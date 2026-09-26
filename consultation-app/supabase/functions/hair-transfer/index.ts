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
    if (req.method === "POST") return await submit(req);
    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

async function submit(req: Request): Promise<Response> {
  const body = await req.json();
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
  }).select().single();
  if (insErr) return json({ error: insErr.message }, 500);

  // @ts-ignore EdgeRuntime is provided by the Supabase edge runtime
  EdgeRuntime.waitUntil(
    runRender(render.id, finalBuilt.prompt, photoPath!, ref?.storage_path ?? null),
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
  parts.push({ inline_data: { mime_type: "image/jpeg", data: photoB64 } });
  if (refB64) parts.push({ inline_data: { mime_type: "image/jpeg", data: refB64 } });

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
) {
  try {
    const photo = await supabase.storage.from("client-photos").download(photoPath);
    if (photo.error) throw new Error(`client photo: ${photo.error.message}`);
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

    let raw = await callGemini(prompt, photoB64, refB64, ratio);
    let out = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));

    // Collage guard: markedly wider out than in means two options side by side.
    try {
      const im = (await decode(out)) as Image;
      if (im.width / im.height > srcAspect * 1.4) {
        raw = await callGemini(
          prompt + " CRITICAL: return a single portrait of one man, cropped" +
            " exactly like the input photo. Do not return two images side by side.",
          photoB64, refB64, ratio,
        );
        out = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      }
    } catch { /* if it will not decode, store it and let the eye judge */ }

    const outPath = `${renderId}.png`;
    const up = await supabase.storage.from("renders")
      .upload(outPath, out, { contentType: "image/png", upsert: true });
    if (up.error) throw new Error(up.error.message);

    await supabase.from("renders")
      .update({ status: "succeeded", output_path: outPath }).eq("id", renderId);
  } catch (e) {
    await supabase.from("renders")
      .update({ status: "failed", error: String(e).slice(0, 800) }).eq("id", renderId);
  }
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
