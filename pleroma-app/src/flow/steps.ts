// The floor plan in code: which rooms exist and in what order
// (docs/specs/consultation-flow.md, campaign entry, plus the current-length
// question added 2026-09-26 for the feasibility gate).
//
// The in-shop entry uses the same rooms; its landing page speaks to someone
// already in the chair's queue instead of someone who clicked an advert.
// Email comes before the selfie in both (decided 2026-09-26).

export type StepId =
  | "landing" | "email" | "texture" | "length" | "style" | "effort"
  | "selfie" | "wait" | "reveal" | "refine" | "confirm-you" | "confirm-cut" | "handoff";

// The main road. "refine" is a side room reached from the reveal, not a step
// on the road, so it is not in this list.
export const ROAD: StepId[] = [
  "landing", "email", "texture", "length", "style", "effort",
  "selfie", "wait", "reveal", "confirm-you", "confirm-cut", "handoff",
];

// The label on the sheet's top edge (W01: section name, never a screen count).
export const SECTION: Partial<Record<StepId, string>> = {
  texture: "Your hair", length: "Your hair", style: "Your cut", effort: "Your cut",
  selfie: "Your photo", "confirm-you": "Your result", "confirm-cut": "Your result",
};

// How far along the progress hairline is, for the question screens.
export function progress(step: StepId): number {
  const questions: StepId[] = ["texture", "length", "style", "effort", "selfie"];
  const i = questions.indexOf(step);
  return i < 0 ? 1 : (i + 1) / (questions.length + 1);
}
