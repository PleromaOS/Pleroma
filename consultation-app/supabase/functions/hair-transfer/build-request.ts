// build-request.ts - turns quiz answers into the prompt. PURE: no I/O.
//
// WHY TWO IMAGES: describing a haircut in words makes the model render its
// stock idea of that style (almost always straight-haired) and treat any
// preservation clause as a suggestion. A reference photo separates "shape"
// (image 2) from "hair" (image 1). Measured, not assumed.
//
// THE BALANCE THIS FILE HOLDS - the hard-won part.
// Two opposing pressures, both of which have failed in production:
//   PRESERVE - face, build, age, texture, colour. Under-specify and the model
//              slims the jaw and neck and takes years off. Seen on 3 subjects.
//   CHANGE   - the haircut itself. Under-specify and it plays safe and does
//              the minimum.
// Strengthening PRESERVE to fix the face-slimming caused a Caesar render where
// only the fade landed and the top was untouched. So CUT_EMPHASIS below is now
// as forceful as the locks. If you strengthen one side, re-read the other.

export type Texture =
  | "straight-fine" | "straight-coarse" | "wavy" | "curly" | "coily";
export type Sides =
  | "skin-fade" | "close-fade" | "shadow-fade" | "taper" | "undercut" | "natural";
export type FadeHeight = "low" | "mid" | "high" | "drop";
export type Beard = "none" | "stubble" | "short" | "medium" | "full";

export interface StyleRecord {
  id: string; slug: string; display: string; len: string; lenLabel: string;
  family: string; defaultSides: string; imageDir: string; variations: string[];
}
export interface QuizAnswers {
  styleId: string; texture?: Texture; sides?: Sides;
  fadeHeight?: FadeHeight; beard?: Beard; partingLine?: boolean;
}
export interface RenderRequest {
  prompt: string; hasReference: boolean;
  meta: { styleId: string; styleSlug: string; texture?: string;
          sides?: string; fadeHeight?: string; beard?: string };
}

const LENGTH: Record<string, string> = {
  "very-short": "very short", short: "short", "medium-short": "medium-short",
  medium: "medium-length", "medium-long": "medium-long", long: "long",
};

const TEXTURE_KEEP: Record<Texture, string> = {
  "straight-fine": "His hair is fine and straight and it stays fine and straight.",
  "straight-coarse": "His hair is thick and straight and it stays thick and straight.",
  wavy: "His hair is wavy and every wave stays a wave.",
  curly: "His hair is curly and every curl stays a curl.",
  coily: "His hair is tightly coiled and the coil pattern stays exactly as it is.",
};

const ANTI_FLATTEN: Partial<Record<Texture, string>> = {
  wavy: "Do not blow-dry it straight, smooth it out or relax the wave.",
  curly: "Do not blow-dry it straight, smooth it, or relax or loosen the curl pattern.",
  coily: "Do not blow-dry it straight, smooth it, or relax or loosen the coil pattern.",
};

const SIDES: Record<Sides, string> = {
  "skin-fade": "Cut the sides and back down to bare skin",
  "close-fade": "Cut the sides and back very short, faded but not bare",
  "shadow-fade": "Cut the sides and back to a soft subtle shadow",
  taper: "Leave the sides long; taper only the sideburns and neckline",
  undercut: "Cut the sides and back short with a hard disconnected line, no blending",
  natural: "Leave the sides and back long, blended naturally into the top",
};

const FADEABLE: Sides[] = ["skin-fade", "close-fade", "shadow-fade"];

const FADE_HEIGHT: Record<FadeHeight, string> = {
  low: "starting low, just above the ear",
  mid: "starting at the temple",
  high: "starting high, above the temple",
  drop: "curving down behind the ear",
};

const BEARD: Record<Beard, string> = {
  none: "He is clean shaven and stays clean shaven",
  stubble: "He has short stubble and keeps it",
  short: "He has a short trimmed beard and keeps it",
  medium: "He has a medium-length beard and keeps it",
  full: "He has a full beard and keeps it",
};

// Names the part of the head that must end up different. Without this the
// model satisfies itself with the sides and leaves the top as it found it.
const CUT_EMPHASIS =
  "THE HAIR ON TOP OF HIS HEAD MUST ACTUALLY CHANGE. Cut it to the new length " +
  "and shape. If his hair is currently longer than the target cut, cut it " +
  "shorter - do not leave his existing length on top. The haircut is the point " +
  "of this edit and it must be clearly visible.";

// The identity lock. Never shorten. The width and weight clauses are not
// padding: "keep his face unchanged" was not enough on any of three subjects.
const IDENTITY_LOCK =
  "His FACE must not change at all: same eyes, eyebrows, nose, mouth, jawline, " +
  "ears, skin tone, skin texture, facial marks, age and expression. Keep the " +
  "exact same face width - do not narrow or slim his face, jaw, cheeks, chin or " +
  "neck. Keep his exact body weight and build. Do not make him look younger, " +
  "thinner or more handsome. Keep the same head angle, framing, clothing, " +
  "lighting and background.";

const COLOUR_LOCK =
  "Keep exactly the same hair colour and the same grey. Do not recolour it.";

const REFERENCE_FENCE =
  "Take NOTHING from IMAGE 2 except the shape and length of the haircut. Do not " +
  "copy that person's face, hair colour, hair texture, beard, stubble, skin, " +
  "clothing, pose or background.";

// Seen live: one wide image with a short buzz and a longer buzz side by side.
// A brief with two answers is not a brief.
const SINGLE_IMAGE =
  "Output EXACTLY ONE photograph showing ONE man, framed exactly like the input " +
  "photo. No grid, no collage, no split screen, no side-by-side comparison, no " +
  "before-and-after, no two versions. One image, one version.";

const REALISM = "Photorealistic photograph.";

// defaultSides folds sides type and fade height into one token; the quiz keeps
// them apart. Without this every style falling back to its default silently
// loses its sides clause.
function normaliseDefaultSides(raw: string): { sides: Sides; fadeHeight?: FadeHeight } {
  switch (raw) {
    case "low-taper": return { sides: "taper", fadeHeight: "low" };
    case "low-fade": return { sides: "close-fade", fadeHeight: "low" };
    case "mid-fade": return { sides: "close-fade", fadeHeight: "mid" };
    case "high-fade": return { sides: "close-fade", fadeHeight: "high" };
    case "natural": return { sides: "natural" };
    default: return { sides: raw as Sides };
  }
}

export function buildRenderRequest(
  answers: QuizAnswers, style: StyleRecord,
): RenderRequest {
  const hasReference = (style.variations?.length ?? 0) > 0;
  const fromDefault = normaliseDefaultSides(style.defaultSides);
  const sides = (answers.sides ?? fromDefault.sides) as Sides;
  const fadeHeight = answers.fadeHeight ??
    (answers.sides ? undefined : fromDefault.fadeHeight);
  const len = LENGTH[style.len] ?? style.lenLabel?.toLowerCase() ?? "";
  const name = style.display.toLowerCase();

  const parts: string[] = [];

  if (hasReference) {
    parts.push(
      "IMAGE 1 is the client. IMAGE 2 is a haircut reference only.",
      `Give the client the haircut shown in IMAGE 2: a ${len} ${name}.`,
    );
  } else {
    parts.push(`Give this man a ${len} ${name}.`);
  }

  parts.push(CUT_EMPHASIS);

  if (sides && SIDES[sides]) {
    let clause = SIDES[sides];
    if (FADEABLE.includes(sides) && fadeHeight && FADE_HEIGHT[fadeHeight]) {
      clause += `, ${FADE_HEIGHT[fadeHeight]}`;
    }
    parts.push(clause + ".");
  }

  if (answers.partingLine) {
    parts.push("There is a sharp shaved parting line on one side.");
  }

  parts.push(
    answers.texture
      ? TEXTURE_KEEP[answers.texture]
      : "His hair texture stays exactly as it is in the photo.",
  );

  if (answers.texture && ANTI_FLATTEN[answers.texture]) {
    parts.push(ANTI_FLATTEN[answers.texture]!);
  }

  if (answers.beard && BEARD[answers.beard]) {
    parts.push(BEARD[answers.beard] + ".");
  }

  parts.push(IDENTITY_LOCK, COLOUR_LOCK);
  if (hasReference) parts.push(REFERENCE_FENCE);
  parts.push(SINGLE_IMAGE, REALISM);

  return {
    prompt: parts.join(" "),
    hasReference,
    meta: {
      styleId: style.id, styleSlug: style.slug, texture: answers.texture, sides,
      fadeHeight: FADEABLE.includes(sides) ? fadeHeight : undefined,
      beard: answers.beard,
    },
  };
}
