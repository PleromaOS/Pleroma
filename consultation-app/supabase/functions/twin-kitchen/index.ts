// twin-kitchen — makes ONE view of an AI twin. Only doors may call it
// (the service key, like hair-transfer, ADR 0014).
//
// Why a separate kitchen: one job making the front and both sides ran past
// the 150-second limit of a server function and was stopped halfway (found
// 27 Sep). Each view now gets its own job: make the picture, run the truth
// check, make it once more if it cheated, store it, and report back
// (database function twin_view_done). The last view to finish sets the
// twin's status.
//
// Same clothes on every view (Bryan, 27 Sep): the sides were made at the
// same time as the front, each on its own, so each one invented its own
// shirt. Now the front is made first; only when it is stored does its job
// start the two sides, and each side gets the finished front as an extra
// picture: "same clothes, same background, same light as this". The front
// itself is made exactly as Bryan approved it.
// The kitchen answers its caller straight away and works in the background,
// so starting the sides never eats into the front's own time limit.
//
//   POST { twin_id, view: "front" | "side_a" | "side_b" }   (service key only)

import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const IMAGE_MODEL = Deno.env.get("GEMINI_IMAGE_MODEL") ?? "gemini-3-pro-image";
const CHECK_MODELS = (Deno.env.get("GEMINI_VISION_MODELS") ?? "gemini-3.8-flash,gemini-3.5-flash")
  .split(",").map((s) => s.trim()).filter(Boolean);
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

// The side views: the approved front instructions, with only the framing
// changed to the angle of the client's own side photo.
type View = "front" | "side_a" | "side_b";
const FRONT_FRAMING = "facing the camera, head and shoulders";
function sidePrompt(front: string, photoNumber: 2 | 3): string {
  return front.replace(FRONT_FRAMING,
    `turned to exactly the same angle as IMAGE ${photoNumber} (the same side of his head, the same amount of turn), head and shoulders`)
    + " IMAGE 4 is the finished studio portrait of him from the front. Dress him in EXACTLY the same clothing as IMAGE 4"
    + " (same garment, same colour, same neckline), with the same plain background, the same light and the same colours as IMAGE 4,"
    + " so the pictures belong together as one set. Only the angle is different.";
}

// ---- The truth check ---------------------------------------------------------
const CHECK_PROMPT = `You are checking an AI-made portrait against real photos of the same client.
Photos 1 to 3 are the real client (front, two sides), taken at home. Photo 4 is the AI-made studio portrait ("the twin").
The twin is only allowed to change the light, the background, the sharpness and the framing. Compare carefully and answer:
- same_person: is photo 4 clearly the same person (face shape, features, age, build)?
- hairline_moved: is the front hairline or the temples LOWER or fuller in photo 4 than in the real photos?
- hair_added: is there visibly MORE hair (denser, fuller crown, filled-in patches) in photo 4?
- texture_changed: is the hair texture different (for example curls straightened)?
- colour_changed: is the hair colour or amount of grey clearly different?
- beard_changed: is the beard or moustache clearly different (added, removed, reshaped)?
- face_changed: is the face slimmer, younger or otherwise altered?
Be strict: a barber will cut based on photo 4. Notes: one short sentence naming the biggest difference, or empty.`;
const CHECK_SCHEMA = {
  type: "OBJECT",
  properties: Object.fromEntries([
    ...["same_person", "hairline_moved", "hair_added", "texture_changed", "colour_changed", "beard_changed", "face_changed"].map((k) => [k, { type: "BOOLEAN" }]),
    ["notes", { type: "STRING" }],
  ]),
  required: ["same_person", "hairline_moved", "hair_added", "texture_changed", "colour_changed", "beard_changed", "face_changed", "notes"],
};
type Check = Record<string, boolean | string> & { passed?: boolean };

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
// The scan photos are JPEG; the front twin handed to the sides is PNG.
const jpeg = (b64: string) => ({ inline_data: { mime_type: b64.startsWith("iVBOR") ? "image/png" : "image/jpeg", data: b64 } });

async function makeImage(prompt: string, photos: string[]): Promise<Uint8Array> {
  const res = await fetch(`${GEMINI_BASE}/models/${IMAGE_MODEL}:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, ...photos.map(jpeg)] }],
      generationConfig: { imageConfig: { imageSize: "2K", aspectRatio: "3:4" } },
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`image ${res.status}: ${JSON.stringify(j).slice(0, 300)}`);
  for (const p of j.candidates?.[0]?.content?.parts ?? []) {
    const d = p.inlineData?.data ?? p.inline_data?.data;
    if (d) return Uint8Array.from(atob(d), (c) => c.charCodeAt(0));
  }
  throw new Error(`no image returned (${j.candidates?.[0]?.finishReason ?? "no reason"})`);
}

async function truthCheck(photos: string[], twin: Uint8Array): Promise<Check> {
  const parts = [{ text: CHECK_PROMPT }, ...photos.map(jpeg), { inline_data: { mime_type: "image/png", data: toBase64(twin) } }];
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
      if (!res.ok) throw new Error(`check ${model} ${res.status}`);
      const text = j?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text;
      const c = JSON.parse(text ?? "{}") as Check;
      c.passed = c.same_person === true && !c.hairline_moved && !c.hair_added && !c.texture_changed
        && !c.colour_changed && !c.beard_changed && !c.face_changed;
      c.model = model;
      return c;
    }
  }
  throw new Error(`check unavailable: ${lastErr}`);
}

// Starts other views in their own jobs (used by the front to start the sides).
function dispatch(twinId: string, views: View[]) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/twin-kitchen`;
  return Promise.allSettled(views.map((view) => fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ twin_id: twinId, view }),
  })));
}

async function cook(twinId: string, view: View) {
  const client = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: t } = await client.from("ai_twins").select("id, prompt, source_paths, output_path").eq("id", twinId).single();
  if (!t) return;
  const done = (path: string | null, checks: Check[], passed: boolean, error: string | null, v: View = view) =>
    client.rpc("twin_view_done", { p_twin: t.id, p_view: v, p_path: path, p_checks: checks, p_passed: passed, p_error: error });

  const checks: Check[] = [];
  try {
    const photos: string[] = [];
    for (const p of t.source_paths) {
      const dl = await client.storage.from("client-photos").download(p);
      if (dl.error || !dl.data) throw new Error("photo_download_failed");
      photos.push(toBase64(new Uint8Array(await dl.data.arrayBuffer())));
    }
    // A side needs the finished front, for the clothes, background and light.
    const inputs = [...photos];
    if (view !== "front") {
      if (!t.output_path) throw new Error("front_missing");
      const dl = await client.storage.from("ai-twins").download(t.output_path);
      if (dl.error || !dl.data) throw new Error("front_download_failed");
      inputs.push(toBase64(new Uint8Array(await dl.data.arrayBuffer())));
    }
    const prompt = view === "front" ? t.prompt : sidePrompt(t.prompt, view === "side_a" ? 2 : 3);
    let image: Uint8Array | null = null;
    for (let tries = 1; tries <= 2; tries++) {
      image = await makeImage(prompt + (tries > 1 ? " CRITICAL: the previous attempt changed him. Change NOTHING about his face, hairline, hair or beard." : ""), inputs);
      let check: Check;
      // The truth check compares with his real photos only, never with the front twin.
      try { check = await truthCheck(photos, image); }
      catch (e) {
        // The checker itself is down: keep this picture with a note for the
        // barber rather than paying for a second one nobody can check.
        checks.push({ passed: false, ran: false, notes: `truth check could not run: ${String(e).slice(0, 120)}` });
        break;
      }
      checks.push(check);
      if (check.passed) break;
    }
    const path = view === "front" ? `${t.id}.png` : `${t.id}-${view}.png`;
    const up = await client.storage.from("ai-twins").upload(path, image!, { contentType: "image/png", upsert: true });
    if (up.error) throw new Error(up.error.message);
    await done(path, checks, !!checks[checks.length - 1]?.passed, null);
    if (view === "front") await dispatch(t.id, ["side_a", "side_b"]);
  } catch (e) {
    await done(null, checks, false, String(e).slice(0, 300));
    // No front, no sides: close them too, so the twin never hangs on "running".
    if (view === "front") {
      await done(null, [], false, "front failed", "side_a");
      await done(null, [], false, "front failed", "side_b");
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.headers.get("authorization") !== `Bearer ${SERVICE_KEY}`) return json({ error: "doors only" }, 401);
  const body = await req.json().catch(() => ({}));
  const view = body.view as View;
  if (!["front", "side_a", "side_b"].includes(view)) return json({ error: "view" }, 400);
  if (typeof body.twin_id !== "string") return json({ error: "twin" }, 400);
  // @ts-ignore EdgeRuntime is provided by the Supabase edge runtime
  EdgeRuntime.waitUntil(cook(body.twin_id, view));
  return json({ accepted: true, view }, 202);
});
