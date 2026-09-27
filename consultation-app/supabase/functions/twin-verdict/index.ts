// DOOR 14 · twin-verdict — "does this look like you?"
//
// What it does:   records the client's answer to their AI twin, worded
//                 honestly in the app ("AI can make mistakes"), and says what
//                 happens next:
//                   looks-like-me            → the cut is drawn on this twin
//                   not-quite, first twin    → one more try (door 12 again)
//                   not-quite, second twin   → the cut is drawn on their own
//                                              front photo instead
//                 (scan-path.md decision 6; W43, locked).
// What it does NOT do: it never deletes the twin; whether it is KEPT after the
//                 consultation is a separate consent at the end (W44).
//
//   POST { consultation_id, ticket, twin_id, verdict: "looks-like-me" | "not-quite" }
//   200  { next: "use-twin" | "try-again" | "use-own-photo" }

import { db, gatekeep, openConsultation, readBody, reply } from "../_shared/door.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const twinId = typeof body.twin_id === "string" ? body.twin_id : "";
  const verdict = body.verdict;
  if (!UUID.test(twinId)) return reply(400, { error: "twin_id_invalid" });
  if (verdict !== "looks-like-me" && verdict !== "not-quite") return reply(400, { error: "verdict_invalid" });

  const { data: t } = await client.from("ai_twins").select("id, attempt, status")
    .eq("id", twinId).eq("consultation_id", c.id).maybeSingle();
  if (!t) return reply(404, { error: "twin_not_found" });
  if (t.status !== "succeeded") return reply(409, { error: "twin_not_ready" });

  const { error } = await client.from("ai_twins")
    .update({ client_verdict: verdict, verdict_at: new Date().toISOString() }).eq("id", t.id);
  if (error) return reply(500, { error: "could_not_save" });

  const next = verdict === "looks-like-me" ? "use-twin" : t.attempt < 2 ? "try-again" : "use-own-photo";
  return reply(200, { next });
});
