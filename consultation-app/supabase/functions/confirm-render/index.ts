// DOOR 7 · confirm-render
//
// What it does:   the client says "this is me, and this is the cut I want".
//                 In one all-or-nothing step the database then:
//                   1. freezes the brief (version 1, pointing at this render)
//                   2. updates the client's standing preferences for next time
//                   3. opens the guarantee record with the client's half signed
//                   4. marks the consultation completed
//                 (all inside the Postgres function confirm_render)
// What it does NOT do: it does not make the guarantee active. That needs the
//                 stylist's countersign in the chair (ADR 0010). If the
//                 feasibility gate failed, the guarantee is recorded as
//                 ineligible and the client still gets their brief.
//                 Confirming twice returns the same brief; it never makes a second.
//
//   POST { consultation_id, ticket, render_id, terms_version }
//   200  { brief_id, guarantee_eligible, valid_until }

import { db, gatekeep, openConsultation, readBody, reply } from "../_shared/door.ts";

const KNOWN_REFUSALS = [
  "email_required_first", "render_not_confirmable", "answers_incomplete",
];

Deno.serve(async (req: Request) => {
  const early = gatekeep(req);
  if (early) return early;

  const body = await readBody(req);
  if (!body) return reply(400, { error: "invalid_json" });

  const client = db();
  const opened = await openConsultation(client, body);
  if ("refused" in opened) return opened.refused;
  const c = opened.c;

  const renderId = typeof body.render_id === "string" ? body.render_id : "";
  const terms = typeof body.terms_version === "string" ? body.terms_version.trim() : "";
  if (!renderId) return reply(400, { error: "render_id_required" });
  if (!terms || terms.length > 40) return reply(400, { error: "terms_version_required" });

  const { data, error } = await client.rpc("confirm_render", {
    p_consultation_id: c.id,
    p_render_id: renderId,
    p_terms_version: terms,
  });

  if (error) {
    const reason = KNOWN_REFUSALS.find((k) => error.message.includes(k));
    return reason ? reply(409, { error: reason }) : reply(500, { error: "could_not_confirm" });
  }

  return reply(200, {
    brief_id: data.brief_id,
    guarantee_eligible: data.guarantee_eligible,
    valid_until: data.valid_until,
  });
});
