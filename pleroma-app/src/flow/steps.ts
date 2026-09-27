// The floor plan in code: which rooms exist and in what order
// (docs/specs/consultation-flow.md, campaign entry, plus the current-length
// question added 2026-09-26 for the feasibility gate).
//
// The in-shop entry uses the same rooms; its landing page speaks to someone
// already in the chair's queue instead of someone who clicked an advert.
// The scan comes FIRST in both (decided 2026-09-26, option B): the client
// sees something special before being asked for anything. The photos stay on
// the phone until the email step, which records the consent.

export type StepId =
  | "landing" | "email" | "reading" | "want" | "texture" | "length" | "style" | "effort"
  | "scan" | "wait" | "reveal" | "refine" | "confirm-you" | "confirm-cut" | "handoff";

// Scan path (2026-09-27): after the email the AI reads the photos and the
// client confirms each finding ("reading"), so texture and current length are
// no longer asked; the reading answers them. The texture and length questions
// stay for the question path and for photos that can't be read.

// Then "want" (2026-09-27): the route chooser and the what-you-want questions
// as one conversation (docs/specs/what-you-want.md). The old style and effort
// question screens stay for the question path.

// The main road. "refine" is a side room reached from the reveal, not a step
// on the road, so it is not in this list.
export const ROAD: StepId[] = [
  "landing", "scan", "email", "reading", "want",
  "wait", "reveal", "confirm-you", "confirm-cut", "handoff",
];

// The label on the sheet's top edge (W01: section name, never a screen count).
export const SECTION: Partial<Record<StepId, string>> = {
  texture: "Your hair", length: "Your hair", style: "Your cut", effort: "Your cut",
  scan: "Your photos", reading: "Your hair", want: "Your cut", "confirm-you": "Your result", "confirm-cut": "Your result",
};

// How far along the progress hairline is, for the question screens.
export function progress(step: StepId): number {
  const questions: StepId[] = ["texture", "length", "style", "effort"];
  const i = questions.indexOf(step);
  return i < 0 ? 1 : (i + 1) / (questions.length + 1);
}
