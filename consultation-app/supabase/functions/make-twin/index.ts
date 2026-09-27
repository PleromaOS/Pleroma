// DOOR 12 · make-twin — the client's AI twin
//
// What it does:   makes the client's AI twin: the same person, same hair, in
//                 good studio light, from their three scan photos and their
//                 CONFIRMED findings (scan-path.md decision 6). Home selfies
//                 are badly lit; the twin lets the cut be drawn and judged on
//                 a clear picture.
//                 Then a second AI checks the twin against the photos and the
//                 findings (the truth check, decision 11): same person? did
//                 the hairline move? did hair appear? did texture, colour or
//                 beard change? If it cheated, it is silently made once more
//                 (our cost, not the client's). Failing twice, it is kept
//                 with a note for the barber, so it never loops.
// What it does NOT do: it never improves the client. No younger, slimmer or
//                 "better" face, no lower hairline, no extra hair: the render
//                 is later drawn on this twin, so any lie here becomes a
//                 guarantee the barber can't keep (decision 10).
//                 It does not wait for the picture (30-60 s): the app asks
//                 door 13 (twin-status).
//
// Three views (Bryan, 27 Sep): the front, and each side at the same angle as
// the client's own side photos, so the barber can judge the sides and the
// client can compare like for like. Each view is made by its own job
// (twin-kitchen) at the same time, and each is checked.
// The front instructions are exactly the ones Bryan approved; only the
// framing sentence differs for the sides.
//
// Attempts: 1 on the first call. A 2nd only after the client said the first
// does "not quite" look like them (door 14). There is no 3rd: after two
// "not quite", the cut is drawn on their own front photo.
//
//   POST { consultation_id, ticket }
//   202  { twin_id, attempt }

import { db, gatekeep, masterKey, openConsultation, readBody, reply, tooManyKnocks } from "../_shared/door.ts";

const IMAGE_MODEL = Deno.env.get("GEMINI_IMAGE_MODEL") ?? "gemini-3-pro-image";
const RUNNING_STALE_MS = 4 * 60_000;

// ---- The words for the confirmed findings ----------------------------------
const W: Record<string, Record<string, string>> = {
  texture: { "straight-fine": "fine, straight", "straight-coarse": "thick, straight", wavy: "wavy", curly: "curly", coily: "tightly coiled (afro-textured)" },
  density: { thin: "on the thin side", medium: "of medium density", thick: "thick" },
  colour: { black: "black", "dark-brown": "very dark brown", "medium-brown": "medium brown", "light-brown": "light brown", blond: "blond", red: "red", grey: "grey", white: "white" },
  grey: { none: "with no grey", some: "with some grey", lots: "with a lot of grey" },
  length_top: { "very-short": "very short on top (under 1 cm)", short: "short on top (1 to 4 cm)", medium: "medium length on top (4 to 8 cm)", "medium-long": "medium-long on top (8 to 15 cm)", long: "long on top (over 15 cm)" },
  sides_now: { skin: "shaved to the skin on the sides", "very-short": "clipper-short on the sides", short: "short on the sides", medium: "medium length on the sides", long: "long on the sides" },
  fade_now: { none: "no fade", low: "a low fade", mid: "a mid fade", high: "a high fade" },
  hairline: { straight: "The hairline runs straight across.", "slightly-higher-temples": "The hairline sits a little higher at the temples.", "clearly-higher-temples": "The hairline sits clearly higher at the temples.", "higher-all-along": "The hairline sits higher all along the front." },
  crown: { full: "The crown is full.", "some-thinning": "The crown is a little lighter.", "clear-thinning": "The crown is noticeably lighter." },
  beard: { none: "He is clean shaven.", stubble: "He has stubble.", short: "He has a short beard.", medium: "He has a medium beard.", full: "He has a full beard." },
  moustache: { none: "No moustache.", natural: "A natural moustache.", styled: "A shaped moustache." },
};
const w = (k: string, v?: string) => (v && W[k]?.[v]) || "";

function twinPrompt(f: Record<string, string>): string {
  const hair = [
    `His hair is ${[w("texture", f.texture), w("density", f.density), w("colour", f.colour), w("grey", f.grey)].filter(Boolean).join(", ")}.`,
    `It is ${[w("length_top", f.length_top), w("sides_now", f.sides_now)].filter(Boolean).join(" and ")}, with ${w("fade_now", f.fade_now) || "no fade"}.`,
    w("hairline", f.hairline), w("crown", f.crown), w("beard", f.beard), w("moustache", f.moustache),
  ].filter(Boolean).join(" ");
  return [
    "IMAGE 1 is a front photo of a man. IMAGES 2 and 3 are photos of the SAME man from each side, all taken on a phone at home.",
    "Make ONE new photograph of this exact same man as a clean studio portrait: facing the camera, head and shoulders, neutral relaxed expression, plain light-grey background, soft even light from the front, sharp focus.",
    "This picture is used to show him a haircut, so it must be the same person with the same hair as today. Being accurate matters more than looking good.",
    "Only the light, the background, the sharpness and the framing change. Nothing about him changes.",
    `His hair and beard right now: ${hair}`,
    "Keep the hairline EXACTLY where it is in the photos: do not lower it, do not fill in the temples. Do not add hair anywhere, do not make it thicker, do not cut, style, groom or tidy the hair or beard. Keep the same texture, the same colour and the same grey.",
    "His FACE must not change at all: same eyes, eyebrows, nose, mouth, jawline, ears, skin tone, skin texture, facial marks, age and expression. Keep the exact same face width - do not narrow or slim his face, jaw, cheeks, chin or neck. Keep his exact body weight and build. Do not make him look younger, thinner or more handsome.",
    "Output EXACTLY ONE photograph showing ONE man. No grid, no collage, no side-by-side, no before-and-after.",
    "Photorealistic photograph.",
  ].join(" ");
}

type View = "front" | "side_a" | "side_b";

// Hands each view to its own kitchen job (twin-kitchen), so no single job
// runs into the 150-second limit. The door answers straight away.
function dispatch(twinId: string, views: View[]) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/twin-kitchen`;
  // @ts-ignore EdgeRuntime is provided by the Supabase edge runtime
  EdgeRuntime.waitUntil(Promise.allSettled(views.map((view) => fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${masterKey()}` },
    body: JSON.stringify({ twin_id: twinId, view }),
  }))));
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

  // The findings as the client confirmed them (the AI's reading, corrected).
  const { data: reading } = await client.from("hair_readings").select("findings, confirmations, status")
    .eq("consultation_id", c.id).eq("status", "succeeded").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!reading) return reply(409, { error: "reading_required" });
  const f: Record<string, string> = {};
  for (const [k, i] of Object.entries(reading.findings?.items ?? {})) {
    const v = (i as { value: string | null }).value;
    if (v && v !== "not-visible") f[k] = v;
  }
  for (const [k, e] of Object.entries(reading.confirmations ?? {})) {
    const v = (e as { value?: string }).value;
    if (v && v !== "not-visible") f[k] = v; else delete f[k];
  }

  // Which attempt: the first, or a second after "not quite". Never a third.
  const { data: previous } = await client.from("ai_twins").select("id, attempt, status, client_verdict, created_at, finished_at, output_path")
    .eq("consultation_id", c.id).order("attempt", { ascending: false });
  const last = previous?.[0];
  // "Running" since: when it started, or when sides were added to a finished front.
  const since = last ? new Date(last.finished_at ?? last.created_at).getTime() : 0;
  if (last && last.status === "running" && Date.now() - since < RUNNING_STALE_MS) {
    return reply(409, { error: "twin_already_running", twin_id: last.id });
  }
  // Adding sides got stuck: the front is still good, never throw it away.
  if (last && last.status === "running" && last.output_path) {
    await client.from("ai_twins").update({ status: "succeeded" }).eq("id", last.id);
    last.status = "succeeded";
  }
  let attempt = 1;
  if (last) {
    if (last.status === "succeeded" && last.client_verdict !== "not-quite") {
      // Made before the side views existed: add just the sides, keep the front.
      const { data: full } = await client.from("ai_twins").select("side_a_path, prompt").eq("id", last.id).single();
      if (full && !full.side_a_path && full.prompt) {
        await client.from("ai_twins").update({ status: "running", finished_at: new Date().toISOString(), pending_views: ["side_a", "side_b"] }).eq("id", last.id);
        dispatch(last.id, ["side_a", "side_b"]);
        return reply(202, { twin_id: last.id, attempt: last.attempt, adding: "sides" });
      }
      return reply(200, { twin_id: last.id, attempt: last.attempt, status: "succeeded" }); // already made: nothing to spend
    }
    if (last.status === "succeeded" && last.attempt >= 2) return reply(409, { error: "no_twin_attempts_left" });
    attempt = last.status === "succeeded" ? last.attempt + 1 : last.attempt;   // a failed build retries the same attempt
    if (last.status !== "succeeded") await client.from("ai_twins").delete().eq("id", last.id);
  }

  // Twins cost real money: the same limits as the render door.
  const slow = await tooManyKnocks(client, req, `make-twin:${c.entry}`, c.entry === "shop" ? 100 : 10, 86400);
  if (slow) return slow;

  const prompt = twinPrompt(f);
  const { data: row, error } = await client.from("ai_twins").insert({
    shop_id: c.shop_id, client_id: c.client_id, consultation_id: c.id, attempt,
    source_paths: paths, model: IMAGE_MODEL, prompt, pending_views: ["front", "side_a", "side_b"],
  }).select("id").single();
  if (error || !row) return reply(500, { error: "could_not_start_twin" });

  dispatch(row.id, ["front", "side_a", "side_b"]);
  return reply(202, { twin_id: row.id, attempt });
});
