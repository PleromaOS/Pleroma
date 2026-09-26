// DOOR 5 · request-render
//
// What it does:   the only way a render happens. Checks that everything needed
//                 is in place, then asks the renderer (hair-transfer) to start.
//                 The first call sends the selfie; re-renders reuse it unless a
//                 new one is sent.
// What it does NOT do: it does not wait for the image (that takes 30-60s; the
//                 browser asks render-status). It does not charge the shop: a
//                 consultation only counts at its first SUCCESSFUL render.
//
// Refuses when:
//   - no email yet               (campaign rule: the render is the reward for the email)
//   - no selfie consent          (GDPR Article 9)
//   - no style or texture chosen (the renderer needs both)
//   - a render is already running for this consultation
//   - 1 render + 3 re-renders already used (ADR 0013 margin cap)
//   - 8 attempts including failures (stops a broken photo burning credit)
//   - the shop has used its monthly consultations (only checked for a first render)
//
//   POST { consultation_id, ticket, photo_base64? }
//   202  { render_id, renders_left }

import { db, gatekeep, masterKey, openConsultation, readBody, reply, tooManyKnocks } from "../_shared/door.ts";

const MAX_GOOD_RENDERS = 4;       // the first render + 3 re-renders
const MAX_ATTEMPTS = 8;           // including failed ones
const STALE_RUNNING_MS = 3 * 60_000;
const MAX_PHOTO_CHARS = 10_000_000; // about 7.5 MB of image

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

  const { data: consent } = await client
    .from("consents").select("id")
    .eq("client_id", c.client_id).eq("purpose", "render_selfie").is("withdrawn_at", null)
    .maybeSingle();
  if (!consent) return reply(409, { error: "selfie_consent_required" });

  const a = c.answers ?? {};
  if (!a.style_id || !a.hair_texture) return reply(409, { error: "style_and_texture_required" });

  // Texture is a hard filter: a style is only offered on the hair types it works on.
  const { data: style } = await client
    .from("styles").select("textures").eq("id", a.style_id).single();
  if (!style || !style.textures.includes(a.hair_texture)) {
    return reply(409, { error: "style_not_offered_for_this_texture" });
  }

  // Renders cost real money. One connection gets 10 a day from an advert and
  // 100 a day from inside a shop, where every client shares the shop's wifi.
  const slow = await tooManyKnocks(
    client, req, `request-render:${c.entry}`, c.entry === "shop" ? 100 : 10, 86400,
  );
  if (slow) return slow;

  const { data: previous } = await client
    .from("renders").select("id, status, created_at, source_photo_path")
    .eq("consultation_id", c.id).order("created_at", { ascending: false });
  const renders = previous ?? [];

  const running = renders.find((r) =>
    (r.status === "running" || r.status === "queued") &&
    Date.now() - new Date(r.created_at).getTime() < STALE_RUNNING_MS
  );
  if (running) return reply(409, { error: "render_already_running", render_id: running.id });

  const good = renders.filter((r) => r.status !== "failed").length;
  if (good >= MAX_GOOD_RENDERS) return reply(429, { error: "no_renders_left" });
  if (renders.length >= MAX_ATTEMPTS) return reply(429, { error: "too_many_attempts" });

  const everSucceeded = renders.some((r) => r.status === "succeeded");
  if (!everSucceeded) {
    const [{ data: shop }, { data: used }] = await Promise.all([
      client.from("shops").select("consultation_allowance").eq("id", c.shop_id).single(),
      client.rpc("consultations_used_this_month", { p_shop_id: c.shop_id }),
    ]);
    if (shop && typeof used === "number" && used >= shop.consultation_allowance) {
      return reply(402, { error: "shop_capacity_reached" });
    }
  }

  const photo = typeof body.photo_base64 === "string" ? body.photo_base64 : null;
  if (photo && photo.length > MAX_PHOTO_CHARS) return reply(413, { error: "photo_too_large" });
  const reusePath = renders.find((r) => r.source_photo_path)?.source_photo_path ?? null;
  if (!photo && !reusePath) return reply(400, { error: "photo_required" });

  // Hand the order to the kitchen, with the key only doors hold.
  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/hair-transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${masterKey()}` },
    body: JSON.stringify({
      shopId: c.shop_id,
      consultationId: c.id,
      styleId: a.style_id,
      texture: a.hair_texture,
      sides: a.sides_treatment,
      fadeHeight: a.fade_height,
      beard: a.beard_style,
      partingLine: a.parting_line === true,
      ...(photo ? { photoBase64: photo } : { photoPath: reusePath }),
    }),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out.renderId) return reply(502, { error: "renderer_unavailable" });

  return reply(202, { render_id: out.renderId, renders_left: MAX_GOOD_RENDERS - good - 1 });
});
