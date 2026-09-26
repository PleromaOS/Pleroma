// DOOR 9 · save-photos
//
// What it does:   stores the three scan photos (front, side A, side B) in the
//                 private 'client-photos' bucket and records them in
//                 client_photos. Sending again replaces them (a rescan).
// What it does NOT do: it never hands out a link to the photos (the phone
//                 already has them; staff and the AI get their own short-lived
//                 access later). It does not analyse or render anything.
//
// Refuses when:
//   - no email yet             (consent belongs to a person)
//   - no live photo consent    (GDPR Article 9: nothing is stored without it)
//   - a photo is not a real JPEG, is too big, or too small to read hair from
//   - the same connection sends too often (spam protection)
//
//   POST { consultation_id, ticket, source: "scan" | "library",
//          front, side_a, side_b }        (each a base64 JPEG, data: prefix allowed)
//   200  { ok: true, saved: ["front", "side_a", "side_b"] }

import { db, gatekeep, openConsultation, readBody, reply, tooManyKnocks } from "../_shared/door.ts";

const KINDS = ["front", "side_a", "side_b"] as const;
const MAX_BYTES = 4_000_000;   // per photo; a phone scan photo is ~0.2-0.5 MB
const MIN_SIDE = 480;          // shorter edge in pixels: below this hair detail is gone

// Reads width and height from the JPEG's own header, and proves it IS a JPEG
// (not a script or a PDF renamed). Returns null for anything else.
function jpegSize(b: Uint8Array): { width: number; height: number } | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    const len = (b[i + 2] << 8) | b[i + 3];
    // Start-of-frame markers carry the size (C0-CF except C4, C8, CC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8] };
    }
    i += 2 + len;
  }
  return null;
}

function decode(raw: unknown): Uint8Array | null {
  if (typeof raw !== "string" || raw.length > MAX_BYTES * 1.4) return null;
  try {
    return Uint8Array.from(atob(raw.replace(/^data:[^,]+,/, "")), (ch) => ch.charCodeAt(0));
  } catch {
    return null;
  }
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

  const { data: consent } = await client
    .from("consents").select("id")
    .eq("client_id", c.client_id).eq("purpose", "render_selfie").is("withdrawn_at", null)
    .maybeSingle();
  if (!consent) return reply(409, { error: "selfie_consent_required" });

  const source = body.source === "library" ? "library" : body.source === "scan" ? "scan" : null;
  if (!source) return reply(400, { error: "source_invalid" });

  // Check all three before storing any, so a bad photo never leaves a half set.
  const photos: { kind: string; bytes: Uint8Array; width: number; height: number }[] = [];
  for (const kind of KINDS) {
    const bytes = decode(body[kind]);
    if (!bytes) return reply(400, { error: "photo_missing_or_too_large", kind });
    const size = jpegSize(bytes);
    if (!size) return reply(400, { error: "photo_not_jpeg", kind });
    if (Math.min(size.width, size.height) < MIN_SIDE) return reply(422, { error: "photo_too_small", kind });
    photos.push({ kind, bytes, ...size });
  }

  // Each save is three uploads. 20 a day per connection from an advert,
  // 200 from a shop's shared wifi.
  const slow = await tooManyKnocks(client, req, `save-photos:${c.entry}`, c.entry === "shop" ? 200 : 20, 86400);
  if (slow) return slow;

  const { data: old } = await client
    .from("client_photos").select("kind, storage_path").eq("consultation_id", c.id);

  for (const p of photos) {
    const path = `${c.shop_id}/${c.id}/${p.kind}-${crypto.randomUUID()}.jpg`;
    const up = await client.storage.from("client-photos").upload(path, p.bytes, { contentType: "image/jpeg" });
    if (up.error) return reply(500, { error: "could_not_store_photo", kind: p.kind });
    const { error } = await client.from("client_photos").upsert({
      shop_id: c.shop_id, client_id: c.client_id, consultation_id: c.id,
      kind: p.kind, source, storage_path: path, bytes: p.bytes.length, width: p.width, height: p.height,
      created_at: new Date().toISOString(),
    }, { onConflict: "consultation_id,kind" });
    if (error) {
      await client.storage.from("client-photos").remove([path]);
      return reply(500, { error: "could_not_record_photo", kind: p.kind });
    }
  }

  // A rescan replaced these: the old files go, so no stray face photos remain.
  const stale = (old ?? []).map((o) => o.storage_path);
  if (stale.length) await client.storage.from("client-photos").remove(stale);

  return reply(200, { ok: true, saved: KINDS });
});
