// DOOR 11 · confirm-finding — the client's answer to one finding
//
// What it does:   stores what the client said about ONE finding of their
//                 hair reading (door 10): the value they settled on. The door
//                 itself works out whether that agrees with the AI, so the
//                 accuracy numbers can't be bent by the app. Called once per
//                 finding screen, the moment the client taps, so nothing is
//                 lost if they drop off halfway.
// What it does NOT do: it never changes the AI's reading (findings stay as
//                 returned); answers go in `confirmations` next to it. It
//                 does not write the quiz answers (texture, current length):
//                 the app sends those through door 3 like any other answer.
//
//   POST { consultation_id, ticket, reading_id, key: "texture", value: "wavy" }
//   200  { confirmations: { texture: { value, agreed, ai_unsure, at }, ... } }

import { db, gatekeep, openConsultation, readBody, reply, tooManyKnocks } from "../_shared/door.ts";
import { VOCAB } from "../_shared/hair.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  const early = gatekeep(req);
  if (early) return early;
  const body = await readBody(req);
  if (!body) return reply(400, { error: "invalid_json" });

  const client = db();
  const slow = await tooManyKnocks(client, req, "confirm-finding", 300, 3600);
  if (slow) return slow;
  const opened = await openConsultation(client, body);
  if ("refused" in opened) return opened.refused;
  const c = opened.c;
  if (c.status !== "in_progress") return reply(409, { error: "consultation_closed" });

  const readingId = typeof body.reading_id === "string" ? body.reading_id : "";
  const key = typeof body.key === "string" ? body.key : "";
  const value = typeof body.value === "string" ? body.value : "";
  if (!UUID.test(readingId)) return reply(400, { error: "reading_id_invalid" });
  if (!VOCAB[key]) return reply(400, { error: "finding_unknown" });
  if (!VOCAB[key].includes(value)) return reply(400, { error: "value_not_allowed" });

  // The reading must belong to THIS consultation and have finished.
  const { data: r } = await client.from("hair_readings").select("id, status, findings")
    .eq("id", readingId).eq("consultation_id", c.id).maybeSingle();
  if (!r) return reply(404, { error: "reading_not_found" });
  if (r.status !== "succeeded") return reply(409, { error: "reading_not_ready" });

  const item = r.findings?.items?.[key] as { value: string | null; ask: boolean } | undefined;
  const entry = {
    value,
    agreed: item?.value === value,           // did the client end up where the AI was?
    ai_unsure: item?.ask ?? true,            // the AI was below its confidence bar (the client
                                             // still saw it as yes / no: Bryan, 27 Sep)
    at: new Date().toISOString(),
  };
  const { data, error } = await client.rpc("confirm_finding", {
    p_reading: r.id, p_consultation: c.id, p_key: key, p_entry: entry,
  });
  if (error) return reply(500, { error: "could_not_save" });
  return reply(200, { confirmations: data });
});
