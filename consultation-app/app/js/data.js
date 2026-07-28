/**
 * Pleroma Personalized Flow — question definitions (v2).
 *
 * Implements the family-first flow described in /app/personalized-flow-spec.md.
 *
 * Three phases:
 *   1. TEXTURE_QUESTIONS — two binary questions resolving to one of four
 *      texture end-states: Straight | Wavy | Curly | Coily
 *   2. FAMILIES — the 10 haircut families, each with compatible textures and
 *      a starting refinement question ID.
 *   3. QUESTIONS — a flat map of all refinement questions, linked into per-family
 *      flows via `next` IDs on each choice. A `next` of null signals end of flow.
 *
 * Choice fields:
 *   label        {string}   Display text
 *   next         {string|null} Next question ID, or null to end the flow
 *   selectsStyle {string}   HC-XXX styleId — records which style was chosen
 *   specKey      {string}   Key to record in the refinements object
 *   specValue    {string}   Value to record for specKey
 *   textureOnly  {string[]} If present, only show this choice when texture is in the list
 *   type         "binary"|"multi"  (question-level, default "binary")
 */
(function (root) {
  "use strict";

  // ---------------------------------------------------------------------------
  // Phase 1: Texture determination
  // Two binary questions → one of: Straight | Wavy | Curly | Coily
  // ---------------------------------------------------------------------------
  const TEXTURE_QUESTIONS = {
    t1: {
      id: "t1",
      text: "Which best describes your hair?",
      type: "binary",
      choices: [
        { label: "Straight or Wavy", next: "t2a", image: "images/illustrations/texture/wavy.png" },
        { label: "Curly or Coily", next: "t2b", image: "images/illustrations/texture/coily.png" },
      ],
    },
    t2a: {
      id: "t2a",
      text: "More specifically — which fits?",
      type: "binary",
      choices: [
        { label: "Straight — lies flat on its own", specKey: "texture", specValue: "Straight", next: null, image: "images/illustrations/texture/straight.png" },
        { label: "Wavy — natural S-wave or beach texture", specKey: "texture", specValue: "Wavy", next: null, image: "images/illustrations/texture/wavy.png" },
      ],
    },
    t2b: {
      id: "t2b",
      text: "How tight is the curl?",
      type: "binary",
      choices: [
        { label: "Curly — defined ringlet or spiral curls", specKey: "texture", specValue: "Curly", next: null, image: "images/illustrations/texture/curly.png" },
        { label: "Coily — tight, springy coils or kinks", specKey: "texture", specValue: "Coily", next: null, image: "images/illustrations/texture/coily.png" },
      ],
    },
  };

  // First texture question ID
  const TEXTURE_START = "t1";

  // ---------------------------------------------------------------------------
  // Phase 2: Family definitions
  // Each family lists the textures it supports and the ID of its first
  // refinement question. Families that don't apply to the client's texture
  // are filtered out of the picker automatically.
  // ---------------------------------------------------------------------------
  const FAMILIES = [
    {
      id: "Buzz/Crew",
      name: "Buzz / Crew",
      textures: ["Straight", "Wavy", "Curly", "Coily"],
      description: "Short all-over clipped cuts — clean, low-maintenance, classic.",
      emoji: "✂️",
      representativeStyleId: "HC-002",
      startQuestion: "bc-q1",
    },
    {
      id: "Crop",
      name: "Crop",
      textures: ["Straight", "Wavy", "Curly", "Coily"],
      description: "Short top, tight sides — modern finish from straight fringe to textured.",
      emoji: "🎯",
      representativeStyleId: "HC-004",
      startQuestion: "cr-q1",
    },
    {
      id: "Pompadour",
      name: "Pompadour",
      textures: ["Straight", "Wavy", "Curly"],
      description: "Hair swept up and back into a high rounded front — bold and classic.",
      emoji: "👑",
      representativeStyleId: "HC-006",
      startQuestion: "po-q1",
    },
    {
      id: "Classic Men's Haircut",
      name: "Classic Men's Haircut",
      textures: ["Straight", "Wavy"],
      description: "The all-purpose men's cut: slicked back, blowdried, or side-parted.",
      emoji: "🪒",
      representativeStyleId: "HC-007",
      startQuestion: "cm-q1",
    },
    {
      id: "Comb Over",
      name: "Comb Over",
      textures: ["Straight", "Wavy"],
      description: "Top hair combed to one side with a defined part — sharp and refined.",
      emoji: "〰️",
      representativeStyleId: "HC-009",
      startQuestion: "co-q1",
    },
    {
      id: "Flat Top",
      name: "Flat Top",
      textures: ["Coily"],
      description: "Top hair cut perfectly flat and level — requires Coily texture to hold.",
      emoji: "📐",
      representativeStyleId: "HC-010",
      imageTone: "deep",
      startQuestion: "ft-q1",
    },
    {
      id: "Mohawk",
      name: "Mohawk / Fauxhawk",
      textures: ["Straight", "Wavy", "Curly", "Coily"],
      description: "Center strip of longer hair with shaved or tapered sides — from full hawk to subtle peak.",
      emoji: "⚡",
      representativeStyleId: "HC-012",
      startQuestion: "mh-q1",
    },
    {
      id: "Afro/Textured",
      name: "Afro / Textured",
      textures: ["Curly", "Coily"],
      description: "Natural curl or coil grown into a rounded crown — full or faded.",
      emoji: "🌀",
      representativeStyleId: "HC-014",
      startQuestion: "af-q1",
    },
    {
      id: "Mullet",
      name: "Mullet",
      textures: ["Straight", "Wavy", "Curly"],
      description: "Short sides and top, longer in the back — classic or modern take.",
      emoji: "🎸",
      representativeStyleId: "HC-015",
      startQuestion: "mu-q1",
    },
    {
      id: "Fringe",
      name: "Curtains / Fringe",
      textures: ["Straight", "Wavy", "Curly"],
      description: "Center-parted fringe falling in two soft sections — relaxed and current.",
      emoji: "🌿",
      representativeStyleId: "HC-017",
      startQuestion: "fr-q1",
    },
  ];

  // ---------------------------------------------------------------------------
  // Phase 3: Refinement question graph
  // Keyed by question ID. Flow follows `next` links on chosen choices.
  // null next = end of refinement flow → show results.
  // ---------------------------------------------------------------------------
  const QUESTIONS = {

    // ── Buzz/Crew ────────────────────────────────────────────────────────────
    "bc-q1": {
      id: "bc-q1",
      text: "How much length do you want on top?",
      type: "binary",
      choices: [
        {
          label: "All-over buzz — the shortest",
          selectsStyle: "HC-001",
          specKey: "length",
          specValue: "All-over buzz",
          next: "bc-q3",
          image: "images/haircuts/HC-001/{tone}/mid-fade/left.png",
        },
        {
          label: "A bit more on top",
          next: "bc-q2",
          image: "images/haircuts/HC-002/{tone}/mid-fade/left.png",
        },
      ],
    },
    "bc-q2": {
      id: "bc-q2",
      text: "What kind of front are you after?",
      type: "binary",
      choices: [
        {
          label: "Straight blunt fringe across the forehead",
          selectsStyle: "HC-003",
          next: "bc-q3",
          image: "images/haircuts/HC-003/{tone}/mid-fade/left.png",
        },
        {
          label: "Tapered or textured top — no blunt fringe",
          selectsStyle: "HC-002",
          next: "bc-q3",
          image: "images/haircuts/HC-002/{tone}/mid-fade/left.png",
        },
      ],
    },
    "bc-q3": {
      id: "bc-q3",
      text: "Sides & back treatment?",
      type: "binary",
      choices: [
        {
          label: "Fade — blended to skin",
          specKey: "sides",
          specValue: "Fade",
          next: "bc-q4",
          image: "images/haircuts/HC-002/{tone}/high-fade/left.png",
        },
        {
          label: "Taper or scissor-even",
          specKey: "sides",
          specValue: "Taper",
          next: "bc-q5",
          image: "images/haircuts/HC-002/{tone}/low-fade/left.png",
        },
      ],
    },
    "bc-q4": {
      id: "bc-q4",
      text: "How high does the fade go?",
      type: "multi",
      choices: [
        {
          label: "Low — just above the ears",
          specKey: "fadeHeight",
          specValue: "low",
          next: "bc-q5",
          image: "images/haircuts/HC-002/{tone}/low-fade/left.png",
        },
        {
          label: "Mid — at the temples",
          specKey: "fadeHeight",
          specValue: "mid",
          next: "bc-q5",
          image: "images/haircuts/HC-002/{tone}/mid-fade/left.png",
        },
        {
          label: "High / skin — above the temples",
          specKey: "fadeHeight",
          specValue: "high",
          next: "bc-q5",
          image: "images/haircuts/HC-002/{tone}/high-fade/left.png",
        },
      ],
    },
    "bc-q5": {
      id: "bc-q5",
      text: "Hairline — defined edge or natural fade-out?",
      type: "binary",
      choices: [
        {
          label: "Defined / hard edge",
          specKey: "hairline",
          specValue: "Defined",
          next: null,
        },
        {
          label: "Natural fade-out",
          specKey: "hairline",
          specValue: "Natural",
          next: null,
        },
      ],
    },

    // ── Crop ─────────────────────────────────────────────────────────────────
    "cr-q1": {
      id: "cr-q1",
      text: "Which finish appeals to you?",
      type: "multi",
      choices: [
        {
          label: "Straight Fringe — clean horizontal fringe",
          specKey: "finish",
          specValue: "Straight Fringe",
          next: "cr-q2",
        },
        {
          label: "Textured & Tousled — choppy, messy top",
          specKey: "finish",
          specValue: "Textured & Tousled",
          next: "cr-q2",
        },
        {
          label: "Spiked — strong-hold product, spiky look",
          specKey: "finish",
          specValue: "Spiked",
          next: "cr-q2",
        },
        {
          label: "Natural Curl — curl left on top as-is",
          specKey: "finish",
          specValue: "Natural Curl",
          textureOnly: ["Curly", "Coily"],
          next: "cr-q2",
        },
      ],
    },
    "cr-q2": {
      id: "cr-q2",
      text: "Sides & back treatment?",
      type: "binary",
      choices: [
        {
          label: "Fade — blended to skin",
          specKey: "sides",
          specValue: "Fade",
          next: "cr-q3",
          image: "images/haircuts/HC-004/{tone}/high-fade/left.png",
        },
        {
          label: "Taper or scissor-even",
          specKey: "sides",
          specValue: "Taper",
          next: "cr-q4",
          image: "images/haircuts/HC-004/{tone}/low-fade/left.png",
        },
      ],
    },
    "cr-q3": {
      id: "cr-q3",
      text: "How high does the fade go?",
      type: "multi",
      choices: [
        {
          label: "Low — just above the ears",
          specKey: "fadeHeight",
          specValue: "low",
          next: "cr-q4",
          image: "images/haircuts/HC-004/{tone}/low-fade/left.png",
        },
        {
          label: "Mid — at the temples",
          specKey: "fadeHeight",
          specValue: "mid",
          next: "cr-q4",
          image: "images/haircuts/HC-004/{tone}/mid-fade/left.png",
        },
        {
          label: "High / skin — above the temples",
          specKey: "fadeHeight",
          specValue: "high",
          next: "cr-q4",
          image: "images/haircuts/HC-004/{tone}/high-fade/left.png",
        },
      ],
    },
    "cr-q4": {
      id: "cr-q4",
      text: "Hairline — defined edge or natural fade-out?",
      type: "binary",
      choices: [
        {
          label: "Defined / hard edge",
          specKey: "hairline",
          specValue: "Defined",
          next: null,
        },
        {
          label: "Natural fade-out",
          specKey: "hairline",
          specValue: "Natural",
          next: null,
        },
      ],
    },

    // ── Pompadour ─────────────────────────────────────────────────────────────
    "po-q1": {
      id: "po-q1",
      text: "How much contrast do you want between the top and sides?",
      type: "binary",
      choices: [
        {
          label: "Strong contrast — faded sides, sharp look",
          selectsStyle: "HC-006",
          specKey: "sides",
          specValue: "Fade",
          next: "po-q2",
          image: "images/haircuts/HC-006/{tone}/mid-fade/left.png",
        },
        {
          label: "Soft blend — tapered sides, natural feel",
          selectsStyle: "HC-005",
          specKey: "sides",
          specValue: "Taper",
          next: "po-q3",
          image: "images/haircuts/HC-005/{tone}/mid-fade/left.png",
        },
      ],
    },
    "po-q2": {
      id: "po-q2",
      text: "How high does the fade go?",
      type: "multi",
      choices: [
        {
          label: "Low — just above the ears",
          specKey: "fadeHeight",
          specValue: "low",
          next: "po-q3",
          image: "images/haircuts/HC-006/{tone}/low-fade/left.png",
        },
        {
          label: "Mid — at the temples",
          specKey: "fadeHeight",
          specValue: "mid",
          next: "po-q3",
          image: "images/haircuts/HC-006/{tone}/mid-fade/left.png",
        },
        {
          label: "High / skin — above the temples",
          specKey: "fadeHeight",
          specValue: "high",
          next: "po-q3",
          image: "images/haircuts/HC-006/{tone}/high-fade/left.png",
        },
      ],
    },
    "po-q3": {
      id: "po-q3",
      text: "Part preference?",
      type: "binary",
      choices: [
        {
          label: "Side part",
          specKey: "part",
          specValue: "Side",
          next: "po-q4",
        },
        {
          label: "No part — swept straight back",
          specKey: "part",
          specValue: "None",
          next: "po-q4",
        },
      ],
    },
    "po-q4": {
      id: "po-q4",
      text: "Length trajectory today?",
      type: "binary",
      choices: [
        {
          label: "Keep the same length",
          specKey: "lengthTrajectory",
          specValue: "Maintain",
          next: null,
        },
        {
          label: "Open to going a bit shorter",
          specKey: "lengthTrajectory",
          specValue: "Cut shorter",
          next: null,
        },
      ],
    },

    // ── Classic Men's Haircut ─────────────────────────────────────────────────
    "cm-q1": {
      id: "cm-q1",
      text: "How do you prefer to wear it?",
      type: "multi",
      choices: [
        {
          label: "Wet slicked-back — pomade, high shine",
          specKey: "styling",
          specValue: "Wet Slicked-Back",
          next: "cm-q2",
        },
        {
          label: "Blowdried — volume and body",
          specKey: "styling",
          specValue: "Blowdried",
          next: "cm-q2",
        },
        {
          label: "Defined side part — combed, polished",
          specKey: "styling",
          specValue: "Defined Side Part",
          next: "cm-q2",
        },
      ],
    },
    "cm-q2": {
      id: "cm-q2",
      text: "Sides & back treatment?",
      type: "binary",
      choices: [
        {
          label: "Fade — blended to skin",
          specKey: "sides",
          specValue: "Fade",
          next: "cm-q3",
          image: "images/haircuts/HC-007/{tone}/high-fade/left.png",
        },
        {
          label: "Taper or scissor-even",
          specKey: "sides",
          specValue: "Taper",
          next: "cm-q4",
          image: "images/haircuts/HC-007/{tone}/low-fade/left.png",
        },
      ],
    },
    "cm-q3": {
      id: "cm-q3",
      text: "How high does the fade go?",
      type: "multi",
      choices: [
        {
          label: "Low — just above the ears",
          specKey: "fadeHeight",
          specValue: "low",
          next: "cm-q4",
          image: "images/haircuts/HC-007/{tone}/low-fade/left.png",
        },
        {
          label: "Mid — at the temples",
          specKey: "fadeHeight",
          specValue: "mid",
          next: "cm-q4",
          image: "images/haircuts/HC-007/{tone}/mid-fade/left.png",
        },
        {
          label: "High / skin — above the temples",
          specKey: "fadeHeight",
          specValue: "high",
          next: "cm-q4",
          image: "images/haircuts/HC-007/{tone}/high-fade/left.png",
        },
      ],
    },
    "cm-q4": {
      id: "cm-q4",
      text: "Neckline shape?",
      type: "binary",
      choices: [
        {
          label: "Squared — clean horizontal line",
          specKey: "neckline",
          specValue: "Squared",
          next: null,
        },
        {
          label: "V-shape — tapered point at centre",
          specKey: "neckline",
          specValue: "V-shape",
          next: null,
        },
      ],
    },

    // ── Comb Over ─────────────────────────────────────────────────────────────
    "co-q1": {
      id: "co-q1",
      text: "How do you want the sides?",
      type: "binary",
      choices: [
        {
          label: "Faded — sharp, high-contrast sides",
          selectsStyle: "HC-009",
          specKey: "sides",
          specValue: "Fade",
          next: "co-q2",
          image: "images/haircuts/HC-009/{tone}/mid-fade/left.png",
        },
        {
          label: "Tapered or scissor-even",
          selectsStyle: "HC-008",
          specKey: "sides",
          specValue: "Taper",
          next: "co-q3",
          image: "images/haircuts/HC-008/{tone}/mid-fade/left.png",
        },
      ],
    },
    "co-q2": {
      id: "co-q2",
      text: "How high does the fade go?",
      type: "multi",
      choices: [
        {
          label: "Low — just above the ears",
          specKey: "fadeHeight",
          specValue: "low",
          next: "co-q3",
          image: "images/haircuts/HC-009/{tone}/low-fade/left.png",
        },
        {
          label: "Mid — at the temples",
          specKey: "fadeHeight",
          specValue: "mid",
          next: "co-q3",
          image: "images/haircuts/HC-009/{tone}/mid-fade/left.png",
        },
        {
          label: "High / skin — above the temples",
          specKey: "fadeHeight",
          specValue: "high",
          next: "co-q3",
          image: "images/haircuts/HC-009/{tone}/high-fade/left.png",
        },
      ],
    },
    "co-q3": {
      id: "co-q3",
      text: "Part line style?",
      type: "binary",
      choices: [
        {
          label: "Hard / shaved line — razor-sharp part",
          specKey: "partLine",
          specValue: "Hard",
          next: "co-q4",
        },
        {
          label: "Natural — no defined line",
          specKey: "partLine",
          specValue: "Natural",
          next: "co-q4",
        },
      ],
    },
    "co-q4": {
      id: "co-q4",
      text: "Comb direction?",
      type: "binary",
      choices: [
        {
          label: "Left to right",
          specKey: "combDir",
          specValue: "Left-to-right",
          next: null,
        },
        {
          label: "Right to left",
          specKey: "combDir",
          specValue: "Right-to-left",
          next: null,
        },
      ],
    },

    // ── Flat Top ──────────────────────────────────────────────────────────────
    "ft-q1": {
      id: "ft-q1",
      text: "Top height preference?",
      type: "binary",
      choices: [
        {
          label: "Close to the head — tight and low",
          specKey: "topHeight",
          specValue: "Low",
          next: "ft-q2",
        },
        {
          label: "More height — taller, more dramatic",
          specKey: "topHeight",
          specValue: "High",
          next: "ft-q2",
        },
      ],
    },
    "ft-q2": {
      id: "ft-q2",
      text: "Hairline — sharp edge or natural?",
      type: "binary",
      choices: [
        {
          label: "Sharp / defined edge",
          specKey: "hairline",
          specValue: "Sharp",
          next: "ft-q3",
        },
        {
          label: "Natural fade-out",
          specKey: "hairline",
          specValue: "Natural",
          next: "ft-q3",
        },
      ],
    },
    "ft-q3": {
      id: "ft-q3",
      text: "Sides & back treatment?",
      type: "binary",
      choices: [
        {
          label: "Fade — blended to skin",
          specKey: "sides",
          specValue: "Fade",
          next: "ft-q4",
          image: "images/haircuts/HC-010/{tone}/high-fade/left.png",
        },
        {
          label: "Taper",
          specKey: "sides",
          specValue: "Taper",
          next: null,
          image: "images/haircuts/HC-010/{tone}/low-fade/left.png",
        },
      ],
    },
    "ft-q4": {
      id: "ft-q4",
      text: "How high does the fade go?",
      type: "multi",
      choices: [
        {
          label: "Low — just above the ears",
          specKey: "fadeHeight",
          specValue: "low",
          next: null,
          image: "images/haircuts/HC-010/{tone}/low-fade/left.png",
        },
        {
          label: "Mid — at the temples",
          specKey: "fadeHeight",
          specValue: "mid",
          next: null,
          image: "images/haircuts/HC-010/{tone}/mid-fade/left.png",
        },
        {
          label: "High / skin — above the temples",
          specKey: "fadeHeight",
          specValue: "high",
          next: null,
          image: "images/haircuts/HC-010/{tone}/high-fade/left.png",
        },
      ],
    },

    // ── Mohawk ────────────────────────────────────────────────────────────────
    "mh-q1": {
      id: "mh-q1",
      text: "How extreme do you want it?",
      type: "binary",
      choices: [
        {
          label: "Full mohawk — sides shaved to skin",
          selectsStyle: "HC-011",
          specKey: "sides",
          specValue: "Shaved to skin",
          next: "mh-q2",
          image: "images/haircuts/HC-011/{tone}/mid-fade/left.png",
        },
        {
          label: "Fauxhawk — sides left with some length",
          selectsStyle: "HC-012",
          next: "mh-q2",
          image: "images/haircuts/HC-012/{tone}/mid-fade/left.png",
        },
      ],
    },
    "mh-q2": {
      id: "mh-q2",
      text: "Neckline shape?",
      type: "binary",
      choices: [
        {
          label: "Squared — clean horizontal at the nape",
          specKey: "neckline",
          specValue: "Squared",
          next: null,
        },
        {
          label: "V-shape — pointed at the centre",
          specKey: "neckline",
          specValue: "V-shape",
          next: null,
        },
      ],
    },

    // ── Afro/Textured ─────────────────────────────────────────────────────────
    "af-q1": {
      id: "af-q1",
      text: "How do you want the sides?",
      type: "binary",
      choices: [
        {
          label: "Faded — clean contrast between top and sides",
          selectsStyle: "HC-014",
          specKey: "sides",
          specValue: "Fade",
          next: "af-q2",
          image: "images/haircuts/HC-014/{tone}/mid-fade/left.png",
        },
        {
          label: "Natural and full — sides even with the top",
          selectsStyle: "HC-013",
          specKey: "sides",
          specValue: "Natural",
          next: null,
          image: "images/haircuts/HC-013/{tone}/mid-fade/left.png",
        },
      ],
    },
    "af-q2": {
      id: "af-q2",
      text: "How high does the fade go?",
      type: "multi",
      choices: [
        {
          label: "Low — just above the ears",
          specKey: "fadeHeight",
          specValue: "low",
          next: null,
          image: "images/haircuts/HC-014/{tone}/low-fade/left.png",
        },
        {
          label: "Mid — at the temples",
          specKey: "fadeHeight",
          specValue: "mid",
          next: null,
          image: "images/haircuts/HC-014/{tone}/mid-fade/left.png",
        },
        {
          label: "High / skin — above the temples",
          specKey: "fadeHeight",
          specValue: "high",
          next: null,
          image: "images/haircuts/HC-014/{tone}/high-fade/left.png",
        },
      ],
    },

    // ── Mullet ────────────────────────────────────────────────────────────────
    "mu-q1": {
      id: "mu-q1",
      text: "Which direction?",
      type: "binary",
      choices: [
        {
          label: "Modern — textured top, faded sides",
          selectsStyle: "HC-015",
          specKey: "sides",
          specValue: "Fade",
          next: "mu-q2",
          image: "images/haircuts/HC-015/{tone}/mid-fade/left.png",
        },
        {
          label: "Classic — natural, unfaded, old-school",
          selectsStyle: "HC-016",
          specKey: "sides",
          specValue: "Natural",
          next: "mu-q2",
          image: "images/haircuts/HC-016/{tone}/mid-fade/left.png",
        },
      ],
    },
    "mu-q2": {
      id: "mu-q2",
      text: "Back length?",
      type: "binary",
      choices: [
        {
          label: "Shorter — just past the collar",
          specKey: "backLength",
          specValue: "Short",
          next: null,
        },
        {
          label: "Longer — well past the collar",
          specKey: "backLength",
          specValue: "Long",
          next: null,
        },
      ],
    },

    // ── Fringe ────────────────────────────────────────────────────────────────
    "fr-q1": {
      id: "fr-q1",
      text: "Hairline — defined edge or natural?",
      type: "binary",
      choices: [
        {
          label: "Defined / hard edge",
          specKey: "hairline",
          specValue: "Defined",
          next: "fr-q2",
        },
        {
          label: "Natural fade-out",
          specKey: "hairline",
          specValue: "Natural",
          next: "fr-q2",
        },
      ],
    },
    "fr-q2": {
      id: "fr-q2",
      text: "Sides & back treatment?",
      type: "binary",
      choices: [
        {
          label: "Fade — blended to skin",
          specKey: "sides",
          specValue: "Fade",
          next: "fr-q3",
          image: "images/haircuts/HC-017/{tone}/high-fade/left.png",
        },
        {
          label: "Taper or scissor-even",
          specKey: "sides",
          specValue: "Taper",
          next: null,
          image: "images/haircuts/HC-017/{tone}/low-fade/left.png",
        },
      ],
    },
    "fr-q3": {
      id: "fr-q3",
      text: "How high does the fade go?",
      type: "multi",
      choices: [
        {
          label: "Low — just above the ears",
          specKey: "fadeHeight",
          specValue: "low",
          next: null,
          image: "images/haircuts/HC-017/{tone}/low-fade/left.png",
        },
        {
          label: "Mid — at the temples",
          specKey: "fadeHeight",
          specValue: "mid",
          next: null,
          image: "images/haircuts/HC-017/{tone}/mid-fade/left.png",
        },
        {
          label: "High / skin — above the temples",
          specKey: "fadeHeight",
          specValue: "high",
          next: null,
          image: "images/haircuts/HC-017/{tone}/high-fade/left.png",
        },
      ],
    },
  };

  // ---------------------------------------------------------------------------
  // Exports
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Skin tone selection
  // One question → one of: light | medium | deep
  // ---------------------------------------------------------------------------
  const SKIN_TONE_QUESTIONS = {
    sk1: {
      id: "sk1",
      text: "What's your skin tone?",
      type: "multi",
      choices: [
        { label: "Light", specKey: "skinTone", specValue: "light", next: null, image: "images/haircuts/HC-002/light/mid-fade/left.png" },
        { label: "Medium", specKey: "skinTone", specValue: "medium", next: null, image: "images/haircuts/HC-002/medium/mid-fade/left.png" },
        { label: "Deep", specKey: "skinTone", specValue: "deep", next: null, image: "images/haircuts/HC-002/deep/mid-fade/left.png" },
      ],
    },
  };

  const SKIN_TONE_START = "sk1";

  root.PleromaData = {
    TEXTURE_QUESTIONS: TEXTURE_QUESTIONS,
    TEXTURE_START: TEXTURE_START,
    SKIN_TONE_QUESTIONS: SKIN_TONE_QUESTIONS,
    SKIN_TONE_START: SKIN_TONE_START,
    FAMILIES: FAMILIES,
    QUESTIONS: QUESTIONS,
  };
})(typeof window !== "undefined" ? window : globalThis);
