// _shared/hair.ts — the words the hair analyser may use (door 10) and the
// doors that store the client's answers to it (door 11). One list, so the
// reader and the confirmer can never disagree about what a finding may say.

// The vocabulary. Values match the app's answer words where they overlap
// (hair_texture, current_length, beard_style). Change together with the app.
export const VOCAB: Record<string, string[]> = {
  texture: ["straight-fine", "straight-coarse", "wavy", "curly", "coily"],
  density: ["thin", "medium", "thick"],
  colour: ["black", "dark-brown", "medium-brown", "light-brown", "blond", "red", "grey", "white"],
  grey: ["none", "some", "lots"],
  length_top: ["very-short", "short", "medium", "medium-long", "long"],
  sides_now: ["skin", "very-short", "short", "medium", "long"],
  fade_now: ["none", "low", "mid", "high"],
  parting: ["none", "left", "right", "middle"],
  hairline: ["straight", "slightly-higher-temples", "clearly-higher-temples", "higher-all-along"],
  crown: ["full", "some-thinning", "clear-thinning", "not-visible"],
  beard: ["none", "stubble", "short", "medium", "full"],
  beard_patchy: ["not-applicable", "even", "some-patches"],
  moustache: ["none", "natural", "styled"],
  // Added 2026-09-27 (Bryan): things a barber must know before cutting.
  bald_spots: ["none", "one-small", "several-or-large"],
  hairline_shape: ["even", "uneven"],
  growth_evenness: ["even", "patchy"],
  cut_evenness: ["even", "uneven"],
  cowlick: ["none", "front", "crown", "front-and-crown", "not-visible"],
};
