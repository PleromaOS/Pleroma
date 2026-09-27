// DOOR 10 · read-hair — the hair analyser
//
// What it does:   sends the client's three stored scan photos (front, both
//                 sides) to the AI and returns a reading of their CURRENT hair
//                 and beard: texture, density, colour and greys, length on top
//                 and sides, any fade, parting, hairline (height and shape),
//                 crown, bald spots, patchy growth, an uneven current cut,
//                 cowlicks, beard, moustache. Each finding has a confidence (0-1); anything
//                 below SURE is flagged `ask`, so the app asks it as a normal
//                 question instead of a yes/no (scan-path.md decision 3).
// What it does NOT do: it never guesses gender, age or ethnicity, never
//                 words anything as a diagnosis, and never changes a stored
//                 reading: the AI's words are kept as returned, so accuracy
//                 can be measured against what the client confirms.
//
// Refuses when: no email / no photo consent / not all three photos stored /
//               a reading is already running / the connection asks too often.
// Reading the same photos twice returns the first reading (no second charge),
// unless the reader itself changed since (READER_VERSION).
//
//   POST { consultation_id, ticket }
//   200  { reading_id, status: "succeeded" | "unreadable", findings, model }

import { db, gatekeep, openConsultation, readBody, reply, tooManyKnocks } from "../_shared/door.ts";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
// Tried in order; a model that is gone, busy or down moves on to the next.
// When all are busy, wait a moment and go round again (BUSY_WAITS_MS).
// gemini-2.5-flash was removed 2026-09-27: Google no longer offers it to new accounts.
const MODELS = (Deno.env.get("GEMINI_VISION_MODELS") ?? "gemini-3.8-flash,gemini-3.5-flash")
  .split(",").map((s) => s.trim()).filter(Boolean);
const SURE = 0.7;                 // below this, the app asks instead of confirming
const RUNNING_STALE_MS = 90_000;
const AI_TIMEOUT_MS = 60_000;
const BUSY_WAITS_MS = [3_000, 8_000];   // pauses before the 2nd and 3rd round

// The vocabulary. Values match the app's answer words where they overlap
// (hair_texture, current_length, beard_style). Change together with the app.
export const VOCAB: Record<string, string[]> = {
  texture: ["straight-fine", "straight-coarse", "wavy", "curly", "coily"],
  density: ["thin", "medium", "thick"],
  colour: ["black", "dark-brown", "medium-brown", "light-brown", "blond", "red", "grey", "white"],
  grey: ["none", "some", "lots"],
  length_top: ["very-short", "short", "medium", "medium-long", "long"],
  sides_now: ["skin", "very-short", "short", "medium", "long"],
  fade_now: ["none", "low", "mid", "high"],
  parting: ["none", "left", "right", "middle"],
  hairline: ["straight", "slightly-higher-temples", "clearly-higher-temples", "higher-all-along"],
  crown: ["full", "some-thinning", "clear-thinning", "not-visible"],
  beard: ["none", "stubble", "short", "medium", "full"],
  beard_patchy: ["not-applicable", "even", "some-patches"],
  moustache: ["none", "natural", "styled"],
  // Added 2026-09-27 (Bryan): things a barber must know before cutting.
  bald_spots: ["none", "one-small", "several-or-large"],
  hairline_shape: ["even", "uneven"],
  growth_evenness: ["even", "patchy"],
  cut_evenness: ["even", "uneven"],
  cowlick: ["none", "front", "crown", "front-and-crown", "not-visible"],
};
// Bump when the questions or rules change: a new version reads again even
// if the same photos were read before.
const READER_VERSION = "2026-09-27c";
// Values a phone photo cannot tell apart reliably: never "sure", always asked.
const NEVER_SURE: Record<string, string[]> = { colour: ["black", "dark-brown"] };
const UNREADABLE = ["none", "too-dark", "blurry", "hair-covered", "face-not-visible", "not-a-person"];

const PROMPT = `You are an experienced barber looking at three photos of one client, taken on their phone before a consultation.
Photo 1 is the front. Photos 2 and 3 are the two sides (either order).

Describe their hair and beard AS THEY ARE NOW, the way a barber would before cutting. For each item give one value from the allowed list and a confidence from 0 to 1 (1 = clearly visible and certain; below 0.7 = you are guessing).

Definitions:
- texture: straight-fine (straight, thin strands), straight-coarse (straight, thick strands), wavy (S-shaped bends), curly (defined loops or ringlets), coily (tight coils or zig-zag, afro-textured).
- density: how much hair there is per area of scalp.
- colour: the main natural colour; grey: how much grey or white is mixed in.
- length_top: very-short (under 1 cm), short (1-4 cm), medium (4-8 cm), medium-long (8-15 cm), long (over 15 cm).
- sides_now: skin (shaved to skin), very-short (clipper, under 1 cm), short, medium, long.
- fade_now: whether the sides are currently faded, and how high the fade starts.
- parting: from the PERSON'S OWN point of view (their left, their right). The front photo is NOT mirrored: the person's left appears on the right side of the image.
- hairline: straight, slightly-higher-temples, clearly-higher-temples, higher-all-along.
- crown: judge only if the crown can be seen; otherwise "not-visible" with low confidence.
- beard_patchy: "not-applicable" when there is no beard.
- bald_spots: patches where no hair grows (not a parting, not a deliberate shaved line). one-small, or several-or-large.
- hairline_shape: uneven when the front hairline is crooked or clearly different on the two sides.
- growth_evenness: patchy when hair grows noticeably thinner in some areas than others.
- cut_evenness: uneven when the CURRENT cut is lopsided or grown out unevenly (for example one side longer).
- cowlick: a swirl or strong growth direction that makes hair stand up or part by itself, at the front, the crown, or both.
- colour: black and very dark brown are hard to tell apart in indoor light; give at most 0.6 confidence unless it is unmistakable.

Rules:
- Never guess or mention gender, age, ethnicity or health. Describe hair only.
- Hairline, crown, bald spots and evenness are neutral descriptions of what is visible, never a diagnosis or a cause.
- If the hair is covered (hat, hood), the photos are too dark or blurred, or there is no face, set readable to false and give the reason; still fill every item with your best guess at confidence 0.
- Keep notes to one short sentence a barber would find useful, or leave it empty.`;

function field(values: string[]) {
  return {
    type: "OBJECT",
    properties: { value: { type: "STRING", enum: values }, confidence: { type: "NUMBER" } },
    required: ["value", "confidence"],
  };
}
const SCHEMA = {
  type: "OBJECT",
  properties: {
    readable: { type: "BOOLEAN" },
    unreadable_reason: { type: "STRING", enum: UNREADABLE },
    ...Object.fromEntries(Object.entries(VOCAB).map(([k, v]) => [k, field(v)])),
    notes: { type: "STRING" },
  },
  required: ["readable", "unreadable_reason", ...Object.keys(VOCAB), "notes"],
};

// Checks the AI's answer against our vocabulary; anything off becomes an
// "ask" with confidence 0, so a bad value can never reach a brief unasked.
function validate(raw: Record<string, unknown>) {
  const out: Record<string, { value: string | null; confidence: number; ask: boolean }> = {};
  for (const [k, allowed] of Object.entries(VOCAB)) {
    const f = raw[k] as { value?: unknown; confidence?: unknown } | undefined;
    const value = typeof f?.value === "string" && allowed.includes(f.value) ? f.value : null;
    let c = typeof f?.confidence === "number" ? f.confidence : 0;
    c = Math.max(0, Math.min(1, value ? c : 0));
    if (value && NEVER_SURE[k]?.includes(value)) c = Math.min(c, 0.6);
    // "not-visible" means the AI could not judge it: always ask.
    out[k] = { value, confidence: Math.round(c * 100) / 100, ask: !value || c < SURE || value === "not-visible" };
  }
  const reason = typeof raw.unreadable_reason === "string" && UNREADABLE.includes(raw.unreadable_reason) ? raw.unreadable_reason : "none";
  return {
    version: READER_VERSION,
    readable: raw.readable === true && reason === "none",
    unreadable_reason: reason,
    items: out,
    notes: typeof raw.notes === "string" ? raw.notes.slice(0, 300) : "",
  };
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

Deno.serve(async (req: Request) => {
  const early = gatekeep(req);
  if (early) return early;
  const body = await readBody(req);
  if (!body) return reply(400, { error: "invalid_json" });

  const client = db();
  const opened = await openConsultation(client, body);
  if ("refused" in opened) return opened.refused;
  const c = opened.c;

  if (c.status !== "in_progress") return reply(409, { error: "consultation_closed" });
  if (!c.client_id) return reply(409, { error: "email_required_first" });
  const { data: consent } = await client.from("consents").select("id")
    .eq("client_id", c.client_id).eq("purpose", "render_selfie").is("withdrawn_at", null).maybeSingle();
  if (!consent) return reply(409, { error: "selfie_consent_required" });

  const { data: photos } = await client.from("client_photos").select("kind, storage_path").eq("consultation_id", c.id);
  const byKind = Object.fromEntries((photos ?? []).map((p) => [p.kind, p.storage_path]));
  const paths = ["front", "side_a", "side_b"].map((k) => byKind[k]);
  if (paths.some((p) => !p)) return reply(409, { error: "photos_required" });

  // Same photos already read? Return that reading. Still running? Say so.
  const { data: last } = await client.from("hair_readings")
    .select("id, status, findings, model, photo_paths, created_at")
    .eq("consultation_id", c.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const samePhotos = last && JSON.stringify(last.photo_paths) === JSON.stringify(paths)
    && (last.status === "running" || last.findings?.version === READER_VERSION);
  if (samePhotos && (last.status === "succeeded" || last.status === "unreadable")) {
    return reply(200, { reading_id: last.id, status: last.status, findings: last.findings, model: last.model });
  }
  if (samePhotos && last.status === "running" && Date.now() - new Date(last.created_at).getTime() < RUNNING_STALE_MS) {
    return reply(409, { error: "reading_already_running", reading_id: last.id });
  }

  const slow = await tooManyKnocks(client, req, `read-hair:${c.entry}`, c.entry === "shop" ? 200 : 20, 86400);
  if (slow) return slow;

  const { data: row, error: insErr } = await client.from("hair_readings")
    .insert({ shop_id: c.shop_id, client_id: c.client_id, consultation_id: c.id, photo_paths: paths })
    .select("id").single();
  if (insErr || !row) return reply(500, { error: "could_not_start_reading" });

  const fail = async (error: string, http = 502) => {
    await client.from("hair_readings").update({ status: "failed", error, finished_at: new Date().toISOString() }).eq("id", row.id);
    return reply(http, { error: "reading_failed", reading_id: row.id });
  };

  // The photos, straight from private storage to the AI. No public link is made.
  const parts: unknown[] = [{ text: PROMPT }];
  const labels = ["Photo 1 (front):", "Photo 2 (one side):", "Photo 3 (other side):"];
  for (let i = 0; i < 3; i++) {
    const dl = await client.storage.from("client-photos").download(paths[i]);
    if (dl.error || !dl.data) return fail("photo_download_failed");
    parts.push({ text: labels[i] });
    parts.push({ inline_data: { mime_type: "image/jpeg", data: toBase64(new Uint8Array(await dl.data.arrayBuffer())) } });
  }

  let out: unknown = null, used = "", lastErr = "", stop = false;
  const gone = new Set<string>();
  for (let round = 0; round <= BUSY_WAITS_MS.length && !out && !stop; round++) {
    if (round > 0) await new Promise((r) => setTimeout(r, BUSY_WAITS_MS[round - 1]));
    for (const model of MODELS) {
      if (gone.has(model)) continue;
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), AI_TIMEOUT_MS);
      try {
        const res = await fetch(`${GEMINI_BASE}/models/${model}:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`, {
          method: "POST", signal: ctl.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: { responseMimeType: "application/json", responseSchema: SCHEMA, temperature: 0 },
          }),
        });
        const j = await res.json().catch(() => ({}));
        // Gone (404), busy (429) or down (5xx): try the next model in the list.
        if (res.status === 404 || res.status === 429 || res.status >= 500) {
          if (res.status === 404) gone.add(model);
          lastErr += `r${round + 1} ${model} ${res.status} ${String(j?.error?.message ?? "").slice(0, 80)}; `;
          continue;
        }
        if (!res.ok) { lastErr += `${model} ${res.status}: ${JSON.stringify(j).slice(0, 300)}`; stop = true; break; }
        const text = j?.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text;
        out = text ? JSON.parse(text) : null; used = model;
        if (!out) { lastErr += `${model}: empty answer; `; stop = true; }
        break;
      } catch (e) {
        lastErr += `${model}: ${String(e).slice(0, 200)}; `;
        stop = true;
        break;
      } finally {
        clearTimeout(timer);
      }
    }
  }
  if (!out || typeof out !== "object") return fail(lastErr || "no_answer");

  const findings = validate(out as Record<string, unknown>);
  const status = findings.readable ? "succeeded" : "unreadable";
  await client.from("hair_readings")
    .update({ status, findings, model: used, finished_at: new Date().toISOString() }).eq("id", row.id);
  return reply(200, { reading_id: row.id, status, findings, model: used });
});
