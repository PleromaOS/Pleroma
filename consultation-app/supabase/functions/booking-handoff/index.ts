// DOOR 8 · booking-handoff
//
// What it does:   the close. After the client has confirmed their render:
//   - a shop with online booking → returns the shop's own booking link.
//     The shop's calendar owns availability, so two people can never be given
//     the same slot by us.
//   - a walk-in shop → issues a 4-digit consultation pass to say or show at the
//     desk (the stylist pulls the brief up with it). Unique inside the shop.
// What it does NOT do: it does not book anything, pick a barber, or hold a slot.
//                 It does not send the email yet: no email provider is
//                 connected (see docs/LAUNCH-CHECKLIST.md). The code and link
//                 are returned for the screen.
//                 Calling it again returns the same pass; it never issues two.
//
//   POST { consultation_id, ticket }
//   200  { kind: "booking", url, shop_name }
//      | { kind: "pass", code, shop_name, address }

import { db, gatekeep, openConsultation, readBody, reply } from "../_shared/door.ts";

function newCode(): string {
  // 4 digits, 0000–9999. Numbers only, because the design has it read aloud.
  const n = crypto.getRandomValues(new Uint16Array(1))[0] % 10000;
  return String(n).padStart(4, "0");
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

  if (c.status !== "completed") return reply(409, { error: "confirm_render_first" });

  const { data: shop, error } = await client
    .from("shops").select("name, booking_url, address").eq("id", c.shop_id).single();
  if (error || !shop) return reply(500, { error: "shop_lookup_failed" });

  if (shop.booking_url) {
    return reply(200, { kind: "booking", url: shop.booking_url, shop_name: shop.name });
  }

  const pass = (code: string) =>
    reply(200, { kind: "pass", code, shop_name: shop.name, address: shop.address });

  if (c.pass_code) return pass(c.pass_code);

  // The pass is unique per shop, so a collision is refused by the database and
  // we simply draw again. With 10,000 numbers a collision is rare until a shop
  // has thousands of open passes; see LAUNCH-CHECKLIST if that day comes.
  for (let attempt = 0; attempt < 8; attempt++) {
    const { error: saveError } = await client
      .from("consultations").update({ pass_code: newCode() })
      .eq("id", c.id).is("pass_code", null);
    if (!saveError) {
      const { data } = await client.from("consultations").select("pass_code").eq("id", c.id).single();
      if (data?.pass_code) return pass(data.pass_code);
    }
  }
  return reply(500, { error: "could_not_issue_pass" });
});
