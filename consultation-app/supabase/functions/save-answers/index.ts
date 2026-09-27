// DOOR 3 · save-answers
//
// What it does:   saves one or more quiz answers onto the consultation as the
//                 client taps through. Each call adds to what is already there;
//                 sending an answer again replaces it.
// What it does NOT do: it does not create a brief. Answers stay a draft until
//                 the client confirms the render (door 6), and only then are
//                 they frozen. It refuses any answer the renderer could not
//                 understand, and any question it has never heard of.
//
//   POST { consultation_id, ticket, answers: { hair_texture: "wavy", ... } }
//   200  { answers: { ...everything saved so far } }

import {
  BEARDS, db, EFFORTS, FADE_HEIGHTS, FREE_TEXT_ANSWERS, gatekeep, LENGTHS, openConsultation,
  readBody, reply, SIDES, STYLE_IDS, TEXTURES, tooManyKnocks,
} from "../_shared/door.ts";
import { WANTS } from "../_shared/wants.ts";

const CHOICES: Record<string, string[]> = {
  style_id: STYLE_IDS,
  hair_texture: TEXTURES,
  sides_treatment: SIDES,
  fade_height: FADE_HEIGHTS,
  beard_style: BEARDS,
  styling_effort: EFFORTS,
  current_length: LENGTHS,   // feeds the length-gap check in the feasibility gate
  // What the client wants (scan path, 2026-09-27). Listed here, these win over
  // the free-text list, so fade_style, line_sharpness and neckline are now
  // checked against fixed words too.
  ...WANTS,
};

Deno.serve(async (req: Request) => {
  const early = gatekeep(req);
  if (early) return early;

  const body = await readBody(req);
  if (!body) return reply(400, { error: "invalid_json" });

  const client = db();
  const slow = await tooManyKnocks(client, req, "save-answers", 300, 3600);
  if (slow) return slow;
  const opened = await openConsultation(client, body);
  if ("refused" in opened) return opened.refused;
  const c = opened.c;
  if (c.status !== "in_progress") return reply(409, { error: "consultation_closed" });

  const incoming = body.answers;
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return reply(400, { error: "answers_required" });
  }

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(incoming as Record<string, unknown>)) {
    if (value === null) { clean[key] = null; continue; }   // null clears an answer
    if (key in CHOICES) {
      if (typeof value !== "string" || !CHOICES[key].includes(value)) {
        return reply(400, { error: "answer_not_allowed", question: key, allowed: CHOICES[key] });
      }
      clean[key] = value;
    } else if (key === "parting_line") {
      if (typeof value !== "boolean") return reply(400, { error: "answer_not_allowed", question: key });
      clean[key] = value;
    } else if (FREE_TEXT_ANSWERS.includes(key)) {
      if (typeof value !== "string" || value.length > 300) {
        return reply(400, { error: "answer_not_allowed", question: key });
      }
      clean[key] = value.trim();
    } else {
      return reply(400, { error: "unknown_question", question: key });
    }
  }

  // One database step (merge_answers), so two answers sent at the same moment
  // can never overwrite each other (found 2026-09-27).
  const set = Object.fromEntries(Object.entries(clean).filter(([, v]) => v !== null));
  const clear = Object.keys(clean).filter((k) => clean[k] === null);
  const { data: merged, error } = await client.rpc("merge_answers", {
    p_consultation: c.id, p_set: set, p_clear: clear,
  });
  if (error) return reply(500, { error: "could_not_save" });

  return reply(200, { answers: merged });
});
