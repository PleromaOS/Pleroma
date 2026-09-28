// hair-transfer — THE KITCHEN. Only doors may call it (ADR 0014).
// POST { styleId, texture, sides, fadeHeight, beard, partingLine?,
//        photoBase64 | photoPath, consultationId, shopId } -> { renderId, status }
// GET  ?renderId=... -> { renderId, status, outputUrl, usedReference, error }
//
// Submit-and-poll because a render takes 25-35s, close enough to the edge
// function wall clock that one blocking request is a coin flip.
//
// 2026-09-26 changes, and nothing else:
//   1. Refuses any caller that does not present the service key. Before this,
//      anyone on the internet could spend the Gemini budget.
//   2. shopId and consultationId are required; every render belongs to a shop.
//   3. outputUrl is a signed link that expires after one hour. The renders
//      bucket is private because a render is the client's face.
// The prompt, the two-image method and the render pipeline are untouched.
//
// 2026-09-28: the new cut on the AI twin, from three angles, each checked.
//   1. The source can be the client's approved AI twin (bucket ai-twins)
//      instead of their front photo: the door decides (request-render).
//   2. Every drawn picture goes through a truth check against the picture it
//      was drawn on: same person, face unchanged, hairline not lowered, no
//      hair added where he has little, texture and colour kept, beard as
//      asked. If it cheated it is drawn once more (our cost); failing twice
//      it is kept with a note for the barber (renders.needs_barber_note).
//   3. On a twin, the front is drawn first. When it is stored, its job starts
//      one job per side (POST { mode: "view" }), because three pictures in one
//      job would run past the 150-second limit. Each side gets the side of
//      the twin plus the finished front: "this exact haircut, from here".
//   The render counts as ready when the FRONT is done; the sides follow and
//   render-status hands them out as they arrive.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { decode, Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { buildRenderRequest } from "./build-request.ts";
import { STYLES } from "./styles.ts";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = Deno.env.get("GEMINI_IMAGE_MODEL") ?? "gemini-3-pro-image";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE_KEY);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s, headers: { ...cors, "Content-Type": "application/json" },
  });

// Photos are JPEG; the AI twin and finished renders are PNG.
const img = (b64: string) => ({ inline_data: { mime_type: b64.startsWith("iVBOR") ? "image/png" : "image/jpeg", data: b64 } });

function toB64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

// Reference contamination mitigation: a clean-shaven client given a stubbled
// reference came back with stubble despite an explicit prohibition. Cropping to
// the top of the reference leaves less of that person to copy.
async function cropToHair(bytes: Uint8Array): Promise<Uint8Array> {
  try {
    const img = (await decode(bytes)) as Image;
    img.crop(0, 0, img.width, Math.max(1, Math.round(img.height * 0.55)));
    return new Uint8Array(await img.encodeJPEG(92));
  } catch {
    return bytes; // a failed crop must not fail the render
  }
}

// Pinning the output to the client photo's own shape is what stops Gemini
// returning a wide side-by-side collage of two haircut options.
const RATIOS: Array<[string, number]> = [
  ["9:16", 9 / 16], ["2:3", 2 / 3], ["3:4", 3 / 4], ["4:5", 4 / 5],
  ["1:1", 1], ["5:4", 5 / 4], ["4:3", 4 / 3], ["3:2", 3 / 2], ["16:9", 16 / 9],
];
function nearestRatio(w: number, h: number): string {
  const a = w / h;
  let best = RATIOS[4];
  for (const r of RATIOS) {
    if (Math.abs(r[1] - a) < Math.abs(best[1] - a)) best = r;
  }
  return best[0];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  // Only a door holds this key. The browser never does.
  if (req.headers.get("authorization") !== `Bearer ${SERVICE_KEY}`) {
    return json({ error: "doors only" }, 401);
  }
  try {
    if (req.method === "GET") return await poll(req);
    if (req.method === "POST") {
      const body = await req.json();
      if (body.mode === "view") {
        if (body.view !== "side_a" && body.view !== "side_b") return json({ error: "view" }, 400);
        // @ts-ignore EdgeRuntime is provided by the Supabase edge runtime
        EdgeRuntime.waitUntil(cookSide(String(body.renderId), body.view));
        return json({ accepted: true }, 202);
      }
      return await submit(body);
    }
    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

async function submit(body: Record<string, any>): Promise<Response> {
  if (!body.shopId || !body.consultationId) {
    return json({ error: "shopId and consultationId required" }, 400);
  }
  const style = STYLES.find((s) => s.id === body.styleId || s.slug === body.styleId);
  if (!style) return json({ error: `unknown styleId ${body.styleId}` }, 400);

  const answers = {
    styleId: body.styleId, texture: body.texture, sides: body.sides,
    fadeHeight: body.fadeHeight, beard: body.beard, partingLine: body.partingLine,
  };
  const built = buildRenderRequest(answers, style);

  // The reference index lives in Postgres so photos can be added without a
  // redeploy, and it returns nothing rather than a wrong-texture match.
  const { data: refRows } = await supabase.rpc("pick_style_reference", {
    p_style_id: style.id,
    p_texture: built.meta.texture ?? null,
    p_sides: built.meta.sides ?? null,
    p_fade_height: built.meta.fadeHeight ?? null,
  });
  const ref = Array.isArray(refRows) ? refRows[0] : null;
  const finalBuilt = buildRenderRequest(answers, {
    ...style, variations: ref ? ["__ref__"] : [],
  });

  // Drawn on the approved AI twin (from the door), or on the client's photo.
  const onTwin = body.source === "twin" && typeof body.twinId === "string" && typeof body.photoPath === "string";
  let photoPath = body.photoPath as string | undefined;
  if (!photoPath) {
    if (!body.photoBase64) return json({ error: "photo required" }, 400);
    const bytes = Uint8Array.from(
      atob(String(body.photoBase64).replace(/^data:[^,]+,/, "")),
      (c) => c.charCodeAt(0),
    );
    photoPath = `${crypto.randomUUID()}.jpg`;
    const up = await supabase.storage
      .from("client-photos").upload(photoPath, bytes, { contentType: "image/jpeg" });
    if (up.error) return json({ error: up.error.message }, 500);
  }

  const { data: render, error: insErr } = await supabase.from("renders").insert({
    shop_id: body.shopId,
    consultation_id: body.consultationId,
    style_id: style.id, style_slug: style.slug,
    texture: finalBuilt.meta.texture, sides: finalBuilt.meta.sides,
    fade_height: finalBuilt.meta.fadeHeight, beard: finalBuilt.meta.beard,
    source_photo_path: photoPath,
    reference_image_url: ref?.storage_path ?? null,
    model: MODEL, prompt: finalBuilt.prompt, status: "running",
    source_kind: onTwin ? "twin" : "photo",
    source_bucket: onTwin ? "ai-twins" : "client-photos",
    twin_id: onTwin ? body.twinId : null,
    side_a_source: onTwin ? body.sidePaths?.side_a ?? null : null,
    side_b_source: onTwin ? body.sidePaths?.side_b ?? null : null,
    pending_views: onTwin && body.sidePaths?.side_a && body.sidePaths?.side_b ? ["side_a", "side_b"] : [],
  }).select().single();
  if (insErr) return json({ error: insErr.message }, 500);

  // @ts-ignore EdgeRuntime is provided by the Supabase edge runtime
  EdgeRuntime.waitUntil(
    runRender(render.id, finalBuilt.prompt, photoPath!, ref?.storage_path ?? null, onTwin ? "ai-twins" : "client-photos",
      beardWords(finalBuilt.meta.beard), render.pending_views ?? []),
  );

  return json({
    renderId: render.id, status: "running",
    usedReference: ref?.storage_path ?? null,
  });
}

async function callGemini(
  prompt: string, photoB64: string, refB64: string | null, ratio: string,
) {
  const parts: unknown[] = [{ text: prompt }];
  // Each picture is named right before it (found 27 Sep on the twin: unnamed
  // pictures got mixed up), so "IMAGE 2" in the prompt means one picture only.
  parts.push({ text: "IMAGE 1:" }, img(photoB64));
  if (refB64) parts.push({ text: "IMAGE 2:" }, img(refB64));

  const res = await fetch(
    `${GEMINI_BASE}/models/${MODEL}:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { imageConfig: { imageSize: "2K", aspectRatio: ratio } },
      }),
    },
  );
  const j = await res.json();
  if (!res.ok) throw new Error(`gemini ${res.status}: ${JSON.stringify(j).slice(0, 400)}`);

  // Take the FIRST image part. Gemini can return several; the old code kept
  // overwriting and silently used the last one.
  for (const p of j.candidates?.[0]?.content?.parts ?? []) {
    const d = p.inlineData?.data ?? p.inline_data?.data;
    if (d) return d as string;
  }
  throw new Error(`no image returned (finishReason: ${j.candidates?.[0]?.finishReason})`);
}

async function runRender(
  renderId: string, prompt: string, photoPath: string, refPath: string | null,
  bucket: string, beard: string, sides: string[],
) {
  const checks: Check[] = [];
  try {
    const photo = await supabase.storage.from(bucket).download(photoPath);
    if (photo.error) throw new Error(`source photo: ${photo.error.message}`);
    const photoBytes = new Uint8Array(await photo.data.arrayBuffer());
    const photoB64 = toB64(photoBytes.buffer as ArrayBuffer);

    let srcAspect = 1;
    let ratio = "1:1";
    try {
      const im = (await decode(photoBytes)) as Image;
      srcAspect = im.width / im.height;
      ratio = nearestRatio(im.width, im.height);
    } catch { /* fall back to square */ }

    let refB64: string | null = null;
    if (refPath) {
      const r = await supabase.storage.from("style-library").download(refPath);
      if (!r.error && r.data) {
        const cropped = await cropToHair(new Uint8Array(await r.data.arrayBuffer()));
        refB64 = toB64(cropped.buffer as ArrayBuffer);
      }
      // A missing reference file is not fatal - the prompt still carries the
      // full description, so the render degrades rather than fails.
    }

    let out: Uint8Array = new Uint8Array();
    for (let tries = 1; tries <= 2; tries++) {
      const p = prompt + (tries > 1 ? REDO : "");
      let raw = await callGemini(p, photoB64, refB64, ratio);
      out = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));

      // Collage guard: markedly wider out than in means two options side by side.
      try {
        const im = (await decode(out)) as Image;
        if (im.width / im.height > srcAspect * 1.4) {
          raw = await callGemini(
            p + " CRITICAL: return a single portrait of one man, cropped" +
              " exactly like the input photo. Do not return two images side by side.",
            photoB64, refB64, ratio,
          );
          out = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
        }
      } catch { /* if it will not decode, store it and let the eye judge */ }

      const check = await truthCheck(photoB64, out, beard, false);
      checks.push(check);
      if (check.passed || check.ran === false) break;
    }

    const outPath = `${renderId}.png`;
    const up = await supabase.storage.from("renders")
      .upload(outPath, out, { contentType: "image/png", upsert: true });
    if (up.error) throw new Error(up.error.message);

    await supabase.rpc("render_view_done", { p_render: renderId, p_view: "front", p_path: outPath, p_checks: checks, p_passed: !!checks[checks.length - 1]?.passed, p_error: null });
    if (sides.length) await dispatchSides(renderId, sides);
  } catch (e) {
    await supabase.rpc("render_view_done", { p_render: renderId, p_view: "front", p_path: null, p_checks: checks, p_passed: false, p_error: String(e).slice(0, 800) });
  }
}

// ---- The sides (renders on a twin only) -------------------------------------
function dispatchSides(renderId: string, views: string[]) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/hair-transfer`;
  return Promise.allSettled(views.map((view) => fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ mode: "view", renderId, view }),
  })));
}

async function cookSide(renderId: string, view: "side_a" | "side_b") {
  const checks: Check[] = [];
  const done = (path: string | null, passed: boolean, error: string | null) =>
    supabase.rpc("render_view_done", { p_render: renderId, p_view: view, p_path: path, p_checks: checks, p_passed: passed, p_error: error });
  try {
    const { data: r } = await supabase.from("renders").select("*").eq("id", renderId).single();
    if (!r) return;
    const source = view === "side_a" ? r.side_a_source : r.side_b_source;
    if (!source || !r.output_path) throw new Error("side_or_front_missing");
    const [side, front] = await Promise.all([
      supabase.storage.from("ai-twins").download(source),
      supabase.storage.from("renders").download(r.output_path),
    ]);
    if (side.error || front.error) throw new Error("download_failed");
    const sideB64 = toB64(await side.data.arrayBuffer());
    const frontB64 = toB64(await front.data.arrayBuffer());

    // The same cut in words, without a style photo: the finished front IS the reference now.
    const style = STYLES.find((s) => s.id === r.style_id);
    if (!style) throw new Error("style_missing");
    const words = buildRenderRequest(
      { styleId: r.style_id, texture: r.texture, sides: r.sides, fadeHeight: r.fade_height, beard: r.beard },
      { ...style, variations: [] },
    ).prompt;
    const prompt =
      "IMAGE 1 is a studio photo of a man seen from the side. IMAGE 2 is the SAME man from the front, already with his new haircut. " +
      "Give the man in IMAGE 1 exactly the haircut in IMAGE 2, as it looks from IMAGE 1's angle: the same length and shape on top, " +
      "the same sides, fade height and edges, the same beard. " + words +
      " Keep IMAGE 1's angle and direction exactly (never mirror him), and its clothing, light and background.";

    // The angle in words, read from the twin's side (found 28 Sep: without it
    // one side of the new cut came out mirrored, as it did on the twin).
    const pose = await readPose(sideB64);
    const facing = pose
      ? ` DIRECTION: in IMAGE 1 his nose points toward the ${pose.toUpperCase()} edge of the picture. In the new picture his nose must point toward the ${pose.toUpperCase()} edge too.`
      : "";

    let out: Uint8Array = new Uint8Array();
    for (let tries = 1; tries <= 2; tries++) {
      const last = checks[checks.length - 1];
      const redo = tries > 1 ? REDO + (last?.cut_differs ? " The haircut MUST be exactly the one in IMAGE 2: the same length on top and the same texture." : "") : "";
      const raw = await callGemini(prompt + facing + redo, sideB64, frontB64, "3:4");
      out = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      const check = await truthCheck(sideB64, out, beardWords(r.beard), true, frontB64);
      checks.push(check);
      if (check.passed || check.ran === false) break;
    }
    const path = `${renderId}-${view}.png`;
    const up = await supabase.storage.from("renders").upload(path, out, { contentType: "image/png", upsert: true });
    if (up.error) throw new Error(up.error.message);
    await done(path, !!checks[checks.length - 1]?.passed, null);
  } catch (e) {
    await done(null, false, String(e).slice(0, 300));
  }
}

// Which way the nose points in a side picture, as seen in the picture.
async function readPose(b64: string): Promise<"left" | "right" | null> {
  const schema = { type: "OBJECT", properties: { nose_points: { type: "STRING", enum: ["left", "right"] } }, required: ["nose_points"] };
  for (let round = 0; round < 2; round++) {
    if (round) await new Promise((r) => setTimeout(r, 5000));
    for (const model of CHECK_MODELS) {
      const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "As seen in the picture (not from his point of view), does this man's nose point toward the left or the right edge of the picture?" }, img(b64)] }],
          generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0 } }),
      });
      if (!res.ok) continue;
      try {
        const j = await res.json();
        const v = JSON.parse(j?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text ?? "{}").nose_points;
        if (v === "left" || v === "right") return v;
      } catch { /* try the next model */ }
    }
  }
  return null;
}

// ---- The truth check on a render ---------------------------------------------
// A haircut can make hair SHORTER and change its SHAPE. It cannot lower a
// hairline, fill in thin areas, change the face, or change the texture. A
// render that does any of that is a promise the barber cannot keep.
type Check = Record<string, boolean | string> & { passed?: boolean; ran?: boolean };
const REDO = " CRITICAL: the previous attempt changed him. Change ONLY the haircut. His face, hairline position, hair density, texture, colour and everything else stay exactly as in IMAGE 1.";
const CHECK_MODELS = (Deno.env.get("GEMINI_VISION_MODELS") ?? "gemini-3.8-flash,gemini-3.5-flash").split(",").map((s) => s.trim()).filter(Boolean);
const CHECK_KEYS = ["same_person", "face_changed", "hairline_lowered", "hair_added", "texture_changed", "colour_changed", "beard_wrong", "wrong_direction", "cut_differs"];
const CHECK_SCHEMA = {
  type: "OBJECT",
  properties: Object.fromEntries([...CHECK_KEYS.map((k) => [k, { type: "BOOLEAN" }]), ["notes", { type: "STRING" }]]),
  required: [...CHECK_KEYS, "notes"],
};
function beardWords(beard?: string | null): string {
  const B: Record<string, string> = {
    none: "clean shaven", stubble: "short stubble", short: "a short trimmed beard", medium: "a medium-length beard", full: "a full beard",
  };
  return beard && B[beard] ? B[beard] : "keep the beard exactly as it is";
}
// For a side, frontCutB64 is the finished front: the side must show the SAME
// cut (found 28 Sep: one side came out far shorter on top than the front).
async function truthCheck(beforeB64: string, after: Uint8Array, beard: string, side: boolean, frontCutB64?: string): Promise<Check> {
  const prompt = `Photo 1 is a man before a haircut. Photo 2 is an AI drawing of the SAME man after a new haircut. The haircut is allowed to make hair shorter and change its shape and the beard is meant to be: ${beard}. Nothing else may change. Answer strictly:
- same_person: is photo 2 clearly the same person (face, features, age, build)?
- face_changed: is the face slimmer, younger, smoother or otherwise altered?
- hairline_lowered: is the front hairline or are the temples LOWER or more filled in than in photo 1?
- hair_added: is there hair in places where photo 1 has little or none (fuller crown, filled bald or thin areas, denser than he can grow)?
- texture_changed: is the hair texture different (for example curls straightened or waves added)?
- colour_changed: is the hair colour or the amount of grey clearly different?
- beard_wrong: is the beard clearly changed in a way that goes against "${beard}" (removed, grown, or a different shape)? If it already matched and was left as it was, that is fine: answer false.
- wrong_direction: ${side ? "does his face point to the OPPOSITE side of the picture compared with photo 1?" : "answer false."}
- cut_differs: ${side && frontCutB64 ? "photo 3 is the same man from the front with the new cut. Is the haircut in photo 2 clearly different from photo 3 (length on top, shape, fade height, texture)?" : "answer false."}
A barber will cut from photo 2, so be strict. Notes: one short sentence naming the biggest problem, or empty.`;
  const parts = [{ text: prompt }, img(beforeB64), { inline_data: { mime_type: "image/png", data: toB64(after.buffer as ArrayBuffer) } },
    ...(side && frontCutB64 ? [img(frontCutB64)] : [])];
  let lastErr = "";
  for (let round = 0; round < 3; round++) {
    if (round) await new Promise((r) => setTimeout(r, round * 4000));
    for (const model of CHECK_MODELS) {
      const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", responseSchema: CHECK_SCHEMA, temperature: 0 } }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 404 || res.status === 429 || res.status >= 500) { lastErr += `${model} ${res.status}; `; continue; }
      if (!res.ok) { lastErr += `${model} ${res.status}; `; continue; }
      try {
        const c = JSON.parse(j?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text ?? "{}") as Check;
        c.passed = c.same_person === true && !c.face_changed && !c.hairline_lowered && !c.hair_added
          && !c.texture_changed && !c.colour_changed && !c.beard_wrong && !c.wrong_direction && !c.cut_differs;
        c.model = model;
        return c;
      } catch { lastErr += `${model} unreadable; `; }
    }
  }
  // The checker itself is down: keep the picture with a note, never pay twice blind.
  return { passed: false, ran: false, notes: `truth check could not run: ${lastErr.slice(0, 120)}` };
}

async function poll(req: Request): Promise<Response> {
  const renderId = new URL(req.url).searchParams.get("renderId");
  if (!renderId) return json({ error: "renderId required" }, 400);

  const { data: r } = await supabase.from("renders")
    .select("*").eq("id", renderId).single();
  if (!r) return json({ error: "not found" }, 404);

  let outputUrl: string | null = null;
  if (r.output_path) {
    const signed = await supabase.storage.from("renders")
      .createSignedUrl(r.output_path, 3600);
    outputUrl = signed.data?.signedUrl ?? null;
  }

  return json({
    renderId: r.id, status: r.status, usedReference: r.reference_image_url,
    outputUrl, error: r.error,
  });
}
