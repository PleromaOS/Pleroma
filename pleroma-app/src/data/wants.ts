// What the client WANTS: the questions after the route chooser, route A
// ("Choose a famous style"). The approved list is docs/specs/what-you-want.md;
// this file is that list in code. Answer codes must match the backend's
// _shared/wants.ts (door 3 refuses anything else).
//
// Each question says WHEN it is asked, from what is known so far: the answers
// already given, and what the reading found (confirmed by the client). That is
// how the scan path skips what doesn't apply: no fade, no fade questions; a
// clean-shaven client gets one quick beard question, not five.
//
// Every answer has a drawing key (components/Drawing.tsx). An answer without a
// drawing simply shows the card without one (W46 rule).

export type Answer = { value: string; label: string; hint?: string; drawing?: string };
export type Question = {
  key: string;                     // the answer name stored by door 3
  ask: (k: Known) => string;       // the question, in the client's words
  answers: (k: Known) => Answer[];
  when: (k: Known) => boolean;
  barbersChoice?: boolean;         // only fade start, fade shape and neckline (DESIGN-SYSTEM 7.16)
};

// What the room knows: answers so far, and the confirmed reading.
export type Known = { a: Record<string, string | boolean>; f: Record<string, string> };

const A = (value: string, label: string, hint?: string, drawing?: string): Answer => ({ value, label, hint, drawing });

// ---- A2 · the one detail of each cut (by catalogue id) ----------------------
type Detail = { ask: string; answers: Answer[] };
const TOP_VS_SIDES: Detail = { ask: "How short on top?", answers: [
  A("top-same-as-sides", "The same as the sides", "One length all over.", "top-same"),
  A("top-longer-than-sides", "A little longer on top", "Slightly longer than the sides.", "top-longer"),
] };
const PART: Detail = { ask: "Where does it part?", answers: [
  A("part-none", "No part", "Swept up and back.", "part-none"),
  A("part-side", "Side part", "A parting on one side.", "part-side"),
  A("part-middle", "Middle part", "Parted down the centre.", "part-middle"),
] };
const HEIGHT = (ask: string): Detail => ({ ask, answers: [
  A("height-low", "Low", "Neat, close to the head.", "height-1"),
  A("height-medium", "Medium", "Some lift.", "height-2"),
  A("height-high", "High", "Tall and bold.", "height-3"),
] });
const MULLET: Detail = { ask: "How long at the back?", answers: [
  A("back-collar", "To the collar", "Just touching the collar.", "back-collar"),
  A("back-below-collar", "Below the collar", "Longer, past the collar.", "back-below"),
] };
const COMB: Detail = { ask: "How should the parting line look?", answers: [
  A("line-shaved", "Shaved in, sharp", "A clean line cut into the hair.", "line-sharp"),
  A("line-natural", "Natural", "A normal parting, no line.", "line-natural"),
] };
const AFRO: Detail = { ask: "What shape overall?", answers: [
  A("shape-round", "Round", "A soft, rounded shape.", "shape-round"),
  A("shape-angular", "Angular", "Squared-off edges.", "shape-angular"),
] };

export const STYLE_DETAILS: Record<string, Detail> = {
  "01": TOP_VS_SIDES,                                   // Buzz Cut
  "02": HEIGHT("How high on top?"),                     // Flat Top
  "03": TOP_VS_SIDES,                                   // Crew Cut
  "04": TOP_VS_SIDES,                                   // Caesar
  "05": { ask: "How should the top look?", answers: [   // Textured Crop
    A("crop-straight-fringe", "Straight fringe", "A clean line across the forehead.", "fringe-straight"),
    A("crop-textured", "Textured and messy", "Choppy, lived-in.", "texture-messy"),
    A("crop-spiked", "Spiked", "Pushed up into points.", "spiked"),
    A("crop-natural-curl", "Natural curl", "Your curl left to do its thing.", "curl"),
  ] },
  "06": { ask: "Where does the fringe line sit?", answers: [ // Edgar Cut
    A("edgar-below-hairline", "Just below the hairline", "A short fringe.", "fringe-1"),
    A("edgar-mid-forehead", "Mid-forehead", "The classic Edgar.", "fringe-2"),
    A("edgar-eyebrows", "At the eyebrows", "A long, heavy fringe.", "fringe-3"),
  ] },
  // "07" Fauxhawk: no detail
  "08": HEIGHT("How much height?"),                     // Quiff
  "09": { ask: "What finish?", answers: [               // Slick Back
    A("finish-wet", "Wet shine", "Glossy, with gel or pomade.", "finish-wet"),
    A("finish-matte", "Natural, matte", "No shine.", "finish-matte"),
  ] },
  "10": PART, "11": PART,                               // Pompadours
  "12": { ask: "How do you style it?", answers: [       // Classic Mens
    A("classic-side-part", "Side part", "Neat, parted to one side.", "part-side"),
    A("classic-swept-back", "Swept back, wet look", "Combed back with shine.", "swept-back"),
    A("classic-blow-dried", "Blow-dried", "Soft volume, dry finish.", "blow-dried"),
  ] },
  "13": COMB, "14": COMB,                               // Comb Overs
  "15": { ask: "How long should the fringe be?", answers: [ // Curtains
    A("fringe-short", "Short", "Above the eyebrows.", "fringe-1"),
    A("fringe-medium", "Medium", "Around the eyebrows.", "fringe-2"),
    A("fringe-long", "Long", "Past the eyebrows.", "fringe-3"),
  ] },
  "16": AFRO, "17": AFRO,                               // Afros
  "18": { ask: "What shape at the neck?", answers: [    // Mohawk (replaces the neckline question)
    A("neck-square", "Square", "A straight, blocked edge.", "neck-square"),
    A("neck-v", "V-shape", "Comes to a point.", "neck-v"),
    A("neck-round", "Round", "A soft curve.", "neck-round"),
  ] },
  "19": MULLET, "20": MULLET,                           // Mullets
  "21": { ask: "How much layering?", answers: [         // Wolf Cut
    A("layers-light", "Light texture", "Subtle layers.", "layers-1"),
    A("layers-full", "Full shag", "Lots of choppy layers.", "layers-2"),
  ] },
};

// ---- What the reading found ------------------------------------------------
const FADE_WORDS: Record<string, string> = { low: "a low fade", mid: "a mid fade", high: "a high fade" };
const hasFadeNow = (k: Known) => ["low", "mid", "high"].includes(k.f.fade_now ?? "");
const beardNow = (k: Known) => k.f.beard ?? "";
const hasBeard = (k: Known) => ["short", "medium", "full"].includes(beardNow(k));
const faded = (k: Known) => k.a.sides_type === "faded" || (k.a.sides_keep === "yes" && hasFadeNow(k));
const keepsBeard = (k: Known) => hasBeard(k) && ["shape", "shorter"].includes(String(k.a.beard_plan ?? ""));

// ---- The questions, in order ----------------------------------------------
// Route B (build my own) starts with the top; route A already has its cut.
const LENGTHS = ["very-short", "short", "medium", "medium-long", "long"];
const LENGTH_WORDS: Record<string, [string, string]> = {
  "very-short": ["Very short", "Under 1 cm, clipper length."],
  short: ["Short", "A few centimetres."],
  medium: ["Medium", "Long enough to push back or part."],
  "medium-long": ["Medium-long", "Covers the ears or touches the collar."],
  long: ["Long", "Past the collar."],
};
const building = (k: Known) => k.a.route === "build";
const lengthNow = (k: Known) => LENGTHS.indexOf(k.f.length_top ?? "medium");

export const QUESTIONS: Question[] = [
  { key: "top_plan", when: building,
    ask: () => "Let's start with the top. What do you want there?",
    answers: (k) => [
      A("keep", "Keep the length, just tidy it", "Same length, cleaned up.", "keep"),
      ...(lengthNow(k) > 0 ? [A("shorter", "Shorter", "Take some length off.", "shorter")] : []),
      ...(lengthNow(k) < LENGTHS.length - 1 ? [A("longer", "Let it grow longer", "Your barber plans the growing out with you.", "grow")] : []),
    ] },
  { key: "top_length", when: (k) => building(k) && (k.a.top_plan === "shorter" || k.a.top_plan === "longer"),
    ask: (k) => k.a.top_plan === "shorter" ? "How short on top?" : "How long do you want it in the end?",
    answers: (k) => LENGTHS
      .filter((_, i) => k.a.top_plan === "shorter" ? i < lengthNow(k) : i > lengthNow(k))
      .map((l) => A(l, LENGTH_WORDS[l][0], LENGTH_WORDS[l][1], `len-${LENGTHS.indexOf(l) + 1}`)) },
  { key: "top_direction", when: building,
    ask: () => "Which way do you wear it?",
    answers: () => [
      A("forward", "Forward", "Brushed forward, a fringe.", "fringe-2"),
      A("swept-back", "Swept back", "Off the face.", "swept-back"),
      A("side-part", "Side part", "Parted to one side.", "part-side"),
      A("up", "Up, with volume", "Lifted at the front.", "up"),
      A("natural", "Natural and loose", "However it falls.", "curl"),
    ] },

  { key: "style_option",
    when: (k) => !building(k) && !!STYLE_DETAILS[String(k.a.style_id ?? "")],
    ask: (k) => STYLE_DETAILS[String(k.a.style_id)].ask,
    answers: (k) => STYLE_DETAILS[String(k.a.style_id)].answers },

  { key: "styling_effort", when: () => true,
    ask: () => "How long do you want to spend on it in the morning?",
    answers: () => [
      A("low", "None at all", "Out the door as it is.", "effort-1"),
      A("medium", "A minute or two", "A little product and a bit of shaping.", "effort-2"),
      A("high", "As long as it takes", "Happy to style it properly every day.", "effort-3"),
    ] },

  // Sides
  { key: "sides_keep", when: hasFadeNow,
    ask: (k) => `Keep your sides like now? You have ${FADE_WORDS[k.f.fade_now]}.`,
    answers: () => [
      A("yes", "Yes, same as now", "Your barber keeps your fade as it is.", "keep"),
      A("no", "No, change them", "A few quick questions about the sides.", "change"),
    ] },
  { key: "sides_type", when: (k) => k.a.sides_keep !== "yes",
    ask: () => "How do you want your sides?",
    answers: () => [
      A("faded", "Faded", "Short at the bottom, blending up.", "side-faded"),
      A("tapered", "Tapered at the edges", "Only the edges cleaned up and blended.", "side-tapered"),
      A("hard-line", "Short, with a hard line", "Short sides with a clear edge to the top.", "side-hardline"),
      A("long", "Left long", "No fade, just tidied.", "side-long"),
    ] },
  { key: "fade_start", when: (k) => k.a.sides_type === "faded", barbersChoice: true,
    ask: () => "Where should the fade start?",
    answers: () => [
      A("low", "Low", "Just above the ear.", "height-low"),
      A("mid", "Mid", "Around the temple.", "height-mid"),
      A("high", "High", "Above the temple.", "height-high"),
      A("drop", "Drop", "Curves down behind the ear.", "height-drop"),
    ] },
  { key: "fade_closeness", when: (k) => k.a.sides_type === "faded" || k.a.sides_type === "tapered",
    ask: () => "How close to the skin?",
    answers: (k) => [
      ...(k.a.sides_type === "faded" ? [A("skin", "Down to the skin", "Shaved at the bottom.", "shade-1")] : []),
      A("very-short", "Very short", "A light shadow of hair.", "shade-2"),
      A("shadow", "Soft shadow", "Clearly some hair.", "shade-3"),
      A("darker", "Darker", "More hair, a subtle blend.", "shade-4"),
    ] },
  { key: "fade_style", when: (k) => k.a.sides_type === "faded", barbersChoice: true,
    ask: () => "What shape of fade?",
    answers: () => [
      A("classic", "Classic", "A straight, even line around.", "fade-classic"),
      A("drop", "Drop", "Dips down behind the ear.", "fade-drop"),
      A("burst", "Burst", "An arc around the ear.", "fade-burst"),
    ] },
  { key: "hard_line", when: (k) => k.a.sides_type === "hard-line",
    ask: () => "How should the line look?",
    answers: () => [
      A("sharp", "Sharp and clean", "A crisp edge.", "line-sharp"),
      A("soft", "Softer", "Slightly blended.", "line-soft"),
    ] },

  // Edges
  { key: "line_sharpness", when: () => true,
    ask: () => "How sharp should your edges be?",
    answers: () => [
      A("sharp", "Sharp line-up", "Crisp lines at the front and sides.", "line-sharp"),
      A("soft", "Soft", "Cleaned up, not razor sharp.", "line-soft"),
      A("natural", "Natural", "Left as it grows.", "line-natural"),
    ] },
  { key: "neckline", when: (k) => building(k) || k.a.style_id !== "18", barbersChoice: true,
    ask: () => "How should the back finish at your neck?",
    answers: () => [
      A("tapered", "Tapered", "Blends softly into your neck.", "neck-tapered"),
      A("square", "Square", "A straight, blocked edge.", "neck-square"),
      A("round", "Round", "A soft curve.", "neck-round"),
    ] },

  // Beard and moustache: the first question depends on what the reading found.
  { key: "beard_plan", when: (k) => beardNow(k) !== "",
    ask: (k) => beardNow(k) === "none" ? "Keep it clean shaven?"
      : beardNow(k) === "stubble" ? "What about your stubble?"
      : "What should we do with your beard?",
    answers: (k) => beardNow(k) === "none" ? [
      A("keep", "Yes, clean shaven", undefined, "keep"),
      A("stubble", "I want stubble", undefined, "stubble"),
      A("grow", "I want to grow a beard", "Your barber plans it with you.", "grow"),
    ] : beardNow(k) === "stubble" ? [
      A("keep", "Keep it", undefined, "keep"),
      A("shave", "Shave it off", undefined, "shave"),
      A("grow", "Let it grow", "Your barber plans it with you.", "grow"),
    ] : [
      A("keep", "Keep it like now", "Just a tidy.", "keep"),
      A("shape", "Shape it up", "Same length, a cleaner shape.", "shape"),
      A("shorter", "Shorter", "Take some length off.", "shorter"),
      A("shave", "Shave it off", undefined, "shave"),
    ] },
  { key: "beard_shape", when: keepsBeard,
    ask: () => "What shape of beard?",
    answers: () => [
      A("square", "Square", "Straight along the jaw.", "beard-square"),
      A("round", "Round", "Soft, rounded chin.", "beard-round"),
      A("tapered", "Tapered", "Comes to a point.", "beard-tapered"),
      A("natural", "Natural", "Follows how it grows.", "beard-natural"),
    ] },
  { key: "beard_blend", when: (k) => keepsBeard(k) && faded(k),
    ask: () => "Should your beard blend into the fade?",
    answers: () => [
      A("blend", "Blend it", "One smooth line from fade to beard.", "blend"),
      A("separate", "Keep them separate", "A clear break between the two.", "separate"),
    ] },
  { key: "beard_lines", when: keepsBeard,
    ask: () => "How sharp on the cheeks and neck?",
    answers: () => [
      A("sharp", "Sharp lines", "Clean edges.", "line-sharp"),
      A("natural", "Natural", "Follows the growth.", "line-natural"),
    ] },
  { key: "moustache_plan", when: (k) => !!k.f.moustache && k.f.moustache !== "none" && k.a.beard_plan !== "shave",
    ask: () => "And your moustache?",
    answers: () => [
      A("keep", "Keep it as is", undefined, "keep"),
      A("trim", "Trim it neat", undefined, "shape"),
      A("shave", "Shave it off", undefined, "shave"),
    ] },
];

export const BARBERS_CHOICE = A("barbers-choice", "Barber's choice", "Let your barber decide in the chair.");

// The next question to ask, or null when everything that applies is answered.
export function nextQuestion(k: Known): Question | null {
  return QUESTIONS.find((q) => q.when(k) && !(q.key in k.a)) ?? null;
}

// The renderer's own older answers, worked out from the new ones
// (sides_treatment, fade_height, beard_style: see _shared/door.ts).
export function rendererAnswers(k: Known): Record<string, string | null> {
  const a = k.a, out: Record<string, string | null> = {};
  if (a.sides_keep === "yes") {
    const now = k.f.sides_now ?? "";
    out.sides_treatment = now === "skin" ? "skin-fade" : now === "very-short" ? "close-fade" : "shadow-fade";
    out.fade_height = ["low", "mid", "high"].includes(k.f.fade_now ?? "") ? k.f.fade_now : null;
  } else if (a.sides_type === "faded") {
    out.sides_treatment = a.fade_closeness === "skin" ? "skin-fade" : a.fade_closeness === "very-short" ? "close-fade" : "shadow-fade";
    out.fade_height = a.fade_start && a.fade_start !== "barbers-choice" ? String(a.fade_start) : null;
  } else if (a.sides_type) {
    out.sides_treatment = { tapered: "taper", "hard-line": "undercut", long: "natural" }[String(a.sides_type)] ?? null;
    out.fade_height = null;
  }
  const now = beardNow(k), plan = String(a.beard_plan ?? "");
  if (plan) {
    const shorter: Record<string, string> = { full: "medium", medium: "short", short: "stubble" };
    out.beard_style = plan === "shave" ? "none" : plan === "stubble" ? "stubble"
      : plan === "shorter" ? (shorter[now] ?? now) : (now || null);
  }
  return out;
}

// ---- Route B: the closest catalogue cut ------------------------------------
// The renderer draws a cut from a reference photo of a known cut (words alone
// made it draw its stock, straight-haired idea of a style: hair-transfer,
// build-request.ts). So a style the client built is drawn from the closest
// cut in the catalogue that suits their hair: same length where possible,
// worn the same way. The brief still carries exactly what they built.
const CLOSEST: Record<string, Record<string, string[]>> = {
  forward:      { "very-short": ["04", "01"], short: ["05", "06", "04"], medium: ["15", "05"], "medium-long": ["19", "21"], long: ["21", "20"] },
  "swept-back": { "very-short": ["03", "01"], short: ["03", "12"], medium: ["09", "10", "16"], "medium-long": ["09", "19"], long: ["20", "21"] },
  "side-part":  { "very-short": ["01"], short: ["12", "03"], medium: ["13", "14", "12"], "medium-long": ["13", "19"], long: ["21", "20"] },
  up:           { "very-short": ["02", "01"], short: ["07", "02", "05"], medium: ["08", "11", "10", "17"], "medium-long": ["08", "18"], long: ["21"] },
  natural:      { "very-short": ["01"], short: ["03", "05", "16"], medium: ["16", "15", "12"], "medium-long": ["19", "16", "21"], long: ["21", "20", "16"] },
};
type Cut = { id: string; len: string; textures: string[] };

export function closestCut(k: Known, cuts: Cut[]): string | null {
  const texture = String(k.a.hair_texture ?? "");
  const fits = cuts.filter((c) => c.textures.includes(texture));
  const len = k.a.top_plan === "keep" ? (k.f.length_top ?? "medium") : String(k.a.top_length ?? k.f.length_top ?? "medium");
  const wanted = CLOSEST[String(k.a.top_direction ?? "natural")]?.[len] ?? [];
  return wanted.find((id) => fits.some((c) => c.id === id))   // worn the same way, same length
    ?? fits.find((c) => c.len === len)?.id                     // same length
    ?? fits[0]?.id ?? null;                                    // anything that suits their hair
}
