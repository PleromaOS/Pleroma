// DOOR 15 · my-photos — the client's own scan photos, to look at
//
// What it does:   gives the client short-lived private links (1 hour) to
//                 their OWN three scan photos, so a screen can show their real
//                 photo next to their AI twin or render ("is this really me?").
// What it does NOT do: it never lists anyone else's photos, never makes a
//                 lasting or public link, and never changes the photos.
//
//   POST { consultation_id, ticket }
//   200  { front?, side_a?, side_b? }   (private links, expire after an hour)

import { db, gatekeep, openConsultation, readBody, reply } from "../_shared/door.ts";

Deno.serve(async (req: Request) => {
  const early = gatekeep(req);
  if (early) return early;
  const body = await readBody(req);
  if (!body) return reply(400, { error: "invalid_json" });

  const client = db();
  const opened = await openConsultation(client, body);
  if ("refused" in opened) return opened.refused;
  const c = opened.c;

  const { data: photos } = await client.from("client_photos").select("kind, storage_path").eq("consultation_id", c.id);
  const out: Record<string, string> = {};
  for (const p of photos ?? []) {
    const signed = await client.storage.from("client-photos").createSignedUrl(p.storage_path, 3600);
    if (signed.data?.signedUrl) out[p.kind] = signed.data.signedUrl;
  }
  return reply(200, out);
});
