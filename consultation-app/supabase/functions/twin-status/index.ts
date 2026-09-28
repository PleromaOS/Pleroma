// DOOR 13 · twin-status — is the AI twin ready?
//
// What it does:   tells the app where the client's latest AI twin is: still
//                 being made, ready (with a private link to the picture that
//                 expires after an hour), or failed. The app asks every few
//                 seconds while it narrates the making (W43, revised 28 Sep);
//                 the front's link comes as soon as the front exists.
// What it does NOT do: it never shows the truth check's details to the client;
//                 those are for the barber.
//
//   POST { consultation_id, ticket }
//   200  { status: "none" | "running" | "succeeded" | "failed",
//          twin_id?, attempt?, image_url?, side_a_url?, side_b_url?,
//          verdict?, attempts_left }
// image_url is the front; the two sides match the client's side photos.

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

  const { data: t } = await client.from("ai_twins")
    .select("id, attempt, status, output_path, side_a_path, side_b_path, client_verdict")
    .eq("consultation_id", c.id).order("attempt", { ascending: false }).limit(1).maybeSingle();
  if (!t) return reply(200, { status: "none", attempts_left: 2 });

  // Each picture is linked as soon as it exists: the conversation shows the
  // front while the sides are still being made (W43 revised, 28 Sep).
  const link = async (path: string | null) => {
    if (!path || t.status === "failed") return undefined;
    const signed = await client.storage.from("ai-twins").createSignedUrl(path, 3600);
    return signed.data?.signedUrl;
  };
  const [image_url, side_a_url, side_b_url] = await Promise.all([link(t.output_path), link(t.side_a_path), link(t.side_b_path)]);
  return reply(200, {
    status: t.status, twin_id: t.id, attempt: t.attempt, image_url, side_a_url, side_b_url,
    verdict: t.client_verdict ?? undefined,
    attempts_left: Math.max(0, 2 - t.attempt),
  });
});
