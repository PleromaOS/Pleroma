// DOOR 6 · render-status
//
// What it does:   the browser asks "is my render ready?" every few seconds
//                 during the wait. When it is, the door answers with a private
//                 link to the image that stops working after one hour, and
//                 says whether this result can carry the guarantee badge.
// What it does NOT do: it never hands out a permanent or public link to a face,
//                 and it only answers about renders that belong to this
//                 consultation. It does not create the watermarked shareable
//                 copy; that is made later, when the client takes the image away.
//
//   POST { consultation_id, ticket, render_id }
//   200  { status, image_url?, guarantee_eligible?, renders_left }

import { db, gatekeep, openConsultation, readBody, reply } from "../_shared/door.ts";

const MAX_GOOD_RENDERS = 4;

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
  const { data: all } = await client
    .from("renders").select("id, status, output_path")
    .eq("consultation_id", c.id);
  const renders = all ?? [];
  const r = renders.find((x) => x.id === renderId);
  if (!r) return reply(404, { error: "render_not_found" });

  const rendersLeft = Math.max(0, MAX_GOOD_RENDERS - renders.filter((x) => x.status !== "failed").length);

  if (r.status !== "succeeded" || !r.output_path) {
    // A failure is reported plainly; the technical reason stays on the server.
    return reply(200, { status: r.status, renders_left: rendersLeft });
  }

  const [{ data: signed }, { data: gate }] = await Promise.all([
    client.storage.from("renders").createSignedUrl(r.output_path, 3600),
    client.rpc("feasibility_gate", { p_consultation_id: c.id }),
  ]);

  return reply(200, {
    status: "succeeded",
    image_url: signed?.signedUrl ?? null,
    guarantee_eligible: gate?.passed === true,
    renders_left: rendersLeft,
  });
});
