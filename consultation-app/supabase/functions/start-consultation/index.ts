// DOOR 1 · start-consultation
//
// What it does:   opens a new consultation for one shop and hands the browser a
//                 ticket. Every later door asks for that ticket.
// What it does NOT do: it asks for no email, stores nothing about the person,
//                 costs no render credit, and does not touch the shop's allowance.
//                 A consultation is only metered at its first successful render.
//
// Spam: one connection may open 10 consultations an hour from an advert, 60 an
// hour from inside a shop (every client there shares the shop's wifi). Empty
// consultations are swept away after 24 hours by the hourly housekeeping job.
//
// Called by: the campaign landing page (W20) and the in-shop QR entry.
//   POST { "shop": "<shop-slug>", "entry": "campaign" | "shop" }
//   201  { "consultation_id": "...", "ticket": "...", "shop_name": "..." }

import { db, fingerprint, gatekeep, readBody, reply, tooManyKnocks } from "../_shared/door.ts";

// 32 random bytes, written as URL-safe text. Unguessable.
function newTicket(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

Deno.serve(async (req: Request) => {
  const early = gatekeep(req);
  if (early) return early;

  const body = await readBody(req);
  if (!body) return reply(400, { error: "invalid_json" });

  const slug = typeof body.shop === "string" ? body.shop.trim().toLowerCase() : "";
  const entry = body.entry;
  if (!slug) return reply(400, { error: "shop_required" });
  if (entry !== "campaign" && entry !== "shop") return reply(400, { error: "entry_invalid" });

  const client = db();

  const slow = await tooManyKnocks(
    client, req, `start-consultation:${entry}`, entry === "shop" ? 60 : 10, 3600,
  );
  if (slow) return slow;

  const { data: shop, error: shopError } = await client
    .from("shops")
    .select("id, name, status")
    .eq("slug", slug)
    .maybeSingle();

  if (shopError) return reply(500, { error: "shop_lookup_failed" });
  // Unknown and suspended shops get the same answer, so the door never
  // confirms to a stranger which shops exist.
  if (!shop || shop.status !== "active") return reply(404, { error: "shop_unavailable" });

  const ticket = newTicket();
  const { data: consultation, error: insertError } = await client
    .from("consultations")
    .insert({
      shop_id: shop.id,
      entry,
      client_token_hash: await fingerprint(ticket),
    })
    .select("id")
    .single();

  if (insertError) return reply(500, { error: "could_not_start" });

  return reply(201, {
    consultation_id: consultation.id,
    ticket,
    shop_name: shop.name,
  });
});
