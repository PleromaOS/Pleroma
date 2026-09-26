// DOOR 4 · give-consent
//
// What it does:   records that the client agreed to ONE purpose, and which
//                 version of the wording they saw.
// What it does NOT do: it never bundles purposes. The selfie for the render,
//                 the after photo and the shop's marketing are three separate
//                 agreements (ADR 0013, GDPR Article 9). Asking twice for the
//                 same purpose does not create a second agreement.
//                 The shop-marketing purpose cannot be given through this door:
//                 that consent is asked later, by the shop, not inside the funnel.
//
//   POST { consultation_id, ticket, purpose: "render_selfie" | "after_photo",
//          wording_version: "2026-09-v1" }
//   200  { ok: true, granted_at }

import { db, gatekeep, openConsultation, readBody, reply } from "../_shared/door.ts";

const PURPOSES_ALLOWED_HERE = ["render_selfie", "after_photo"];

Deno.serve(async (req: Request) => {
  const early = gatekeep(req);
  if (early) return early;

  const body = await readBody(req);
  if (!body) return reply(400, { error: "invalid_json" });

  const client = db();
  const opened = await openConsultation(client, body);
  if ("refused" in opened) return opened.refused;
  const c = opened.c;

  // Consent belongs to a person. No email yet means no person yet.
  if (!c.client_id) return reply(409, { error: "email_required_first" });

  const purpose = body.purpose;
  if (typeof purpose !== "string" || !PURPOSES_ALLOWED_HERE.includes(purpose)) {
    return reply(400, { error: "purpose_invalid", allowed: PURPOSES_ALLOWED_HERE });
  }
  const wording = typeof body.wording_version === "string" ? body.wording_version.trim() : "";
  if (!wording || wording.length > 40) return reply(400, { error: "wording_version_required" });

  const { data: live } = await client
    .from("consents").select("granted_at")
    .eq("client_id", c.client_id).eq("purpose", purpose).is("withdrawn_at", null)
    .maybeSingle();
  if (live) return reply(200, { ok: true, granted_at: live.granted_at });

  const { data, error } = await client
    .from("consents")
    .insert({ shop_id: c.shop_id, client_id: c.client_id, purpose, wording_version: wording })
    .select("granted_at").single();
  if (error) return reply(500, { error: "could_not_record_consent" });

  return reply(200, { ok: true, granted_at: data.granted_at });
});
