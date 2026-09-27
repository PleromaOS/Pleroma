// _shared/wants.ts — the words for what the client WANTS (scan path,
// docs/specs/what-you-want.md). Door 3 (save-answers) accepts these answers
// only with one of these values, so nothing unexpected can reach a brief.
//
// The renderer still reads its own older answers (sides_treatment,
// fade_height, beard_style); the app works those out from these and sends
// both. Change together with pleroma-app/src/data/wants.ts.

export const WANTS: Record<string, string[]> = {
  // A2 · the one detail of the chosen cut
  style_option: [
    "top-same-as-sides", "top-longer-than-sides",
    "crop-straight-fringe", "crop-textured", "crop-spiked", "crop-natural-curl",
    "part-none", "part-side", "part-middle",
    "classic-side-part", "classic-swept-back", "classic-blow-dried",
    "line-shaved", "line-natural",
    "height-low", "height-medium", "height-high",
    "neck-square", "neck-v", "neck-round",
    "shape-round", "shape-angular",
    "back-collar", "back-below-collar",
    "fringe-short", "fringe-medium", "fringe-long",
    "finish-wet", "finish-matte",
    "edgar-below-hairline", "edgar-mid-forehead", "edgar-eyebrows",
    "layers-light", "layers-full",
  ],
  // Sides
  sides_keep: ["yes", "no"],
  sides_type: ["faded", "tapered", "hard-line", "long"],
  fade_start: ["low", "mid", "high", "drop", "barbers-choice"],
  fade_closeness: ["skin", "very-short", "shadow", "darker"],
  fade_style: ["classic", "drop", "burst", "barbers-choice"],
  hard_line: ["sharp", "soft"],
  // Edges
  line_sharpness: ["sharp", "soft", "natural"],
  neckline: ["tapered", "square", "round", "barbers-choice"],
  // Beard and moustache
  beard_plan: ["keep", "stubble", "grow", "shave", "shape", "shorter"],
  beard_shape: ["square", "round", "tapered", "natural"],
  beard_blend: ["blend", "separate"],
  beard_lines: ["sharp", "natural"],
  moustache_plan: ["keep", "trim", "shave"],
};
