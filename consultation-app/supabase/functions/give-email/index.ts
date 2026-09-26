// DOOR 2 · give-email
//
// What it does:   attaches a person to the consultation. Finds the client at
//                 this shop by email, or creates them, and links them.
// What it does NOT do: it never tells the browser whether the email was already
//                 known, and it never sends back anything stored about that
//                 person. Otherwise anyone could type a stranger's email into a
//                 shop's page and learn that they are a client there, or what
//                 their hair preferences are.
//
//   POST { consultation_id, ticket, email, first_name? }
//   200  { ok: true }

import { db, gatekeep, normaliseEmail, openConsultation, readBody, reply, tooManyKnocks } from "../_shared/door.ts";

Deno.serve(async (req: Request) => {
  const early = gatekeep(req);
  if (early) return early;

  const body = await readBody(req);
  if (!body) return reply(400, { error: "invalid_json" });

  const client = db();
  // 20 emails an hour from one connection: plenty for a shop's shared wifi,
  // useless for someone trying to fill a shop's list with fake addresses.
  const slow = await tooManyKnocks(client, req, "give-email", 20, 3600);
  if (slow) return slow;
  const opened = await openConsultation(client, body);
  if ("refused" in opened) return opened.refused;
  const c = opened.c;

  if (c.status !== "in_progress") return reply(409, { error: "consultation_closed" });

  const email = normaliseEmail(body.email);
  if (!email) return reply(400, { error: "email_invalid" });

  const firstName = typeof body.first_name === "string"
    ? body.first_name.trim().slice(0, 60) || null
    : null;

  // A consultation belongs to one person. If it is already linked, the same
  // email is accepted again and a different one is refused, BEFORE anything
  // is written. (Fixed 2026-09-26: the first version created the second
  // person's client record and only then refused.)
  if (c.client_id) {
    const { data: linked } = await client
      .from("clients").select("email").eq("id", c.client_id).single();
    if (linked?.email !== email) {
      return reply(409, { error: "consultation_already_has_a_client" });
    }
    return reply(200, { ok: true });
  }

  // Find-or-create in one step. If two requests race, the unique rule on
  // (shop_id, email) makes the second one find the first one's row.
  const { data: person, error: upsertError } = await client
    .from("clients")
    .upsert({ shop_id: c.shop_id, email }, { onConflict: "shop_id,email", ignoreDuplicates: true })
    .select("id, first_name")
    .maybeSingle();
  if (upsertError) return reply(500, { error: "could_not_save_email" });

  let clientRow = person;
  if (!clientRow) {
    const { data, error } = await client
      .from("clients").select("id, first_name")
      .eq("shop_id", c.shop_id).eq("email", email).single();
    if (error) return reply(500, { error: "could_not_save_email" });
    clientRow = data;
  }

  // A first name is only filled in, never overwritten by a stranger.
  if (firstName && !clientRow.first_name) {
    await client.from("clients").update({ first_name: firstName }).eq("id", clientRow.id);
  }

  // Link only if still unlinked, so two racing requests cannot both win.
  const { error: linkError } = await client
    .from("consultations").update({ client_id: clientRow.id })
    .eq("id", c.id).is("client_id", null);
  if (linkError) return reply(500, { error: "could_not_link" });

  return reply(200, { ok: true });
});
