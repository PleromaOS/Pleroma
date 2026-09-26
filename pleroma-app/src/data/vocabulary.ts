// The words the app shows for each stored answer.
//
// The database stores short codes ("skin-fade"); clients see plain words
// ("Down to the skin"). Keeping the translation in one file means a wording
// change never touches a screen, and never touches what is stored.
// The codes must match the doors' vocabulary in _shared/door.ts.

export type Option = { value: string; label: string; hint?: string };

export const TEXTURES: Option[] = [
  { value: "straight-fine", label: "Straight and fine" },
  { value: "straight-coarse", label: "Straight and coarse" },
  { value: "wavy", label: "Wavy" },
  { value: "curly", label: "Curly" },
  { value: "coily", label: "Coily" },
];

export const CURRENT_LENGTHS: Option[] = [
  { value: "very-short", label: "Very short", hint: "Clipper length. Scalp shows through." },
  { value: "short", label: "Short", hint: "A few centimetres. Stands up on its own." },
  { value: "medium", label: "Medium", hint: "Long enough to push back or part." },
  { value: "medium-long", label: "Medium-long", hint: "Covers the ears or touches the collar." },
  { value: "long", label: "Long", hint: "Past the collar. Can be tied up." },
];

export const EFFORTS: Option[] = [
  { value: "low", label: "None at all", hint: "Out the door as it is." },
  { value: "medium", label: "A minute or two", hint: "A little product and a bit of shaping." },
  { value: "high", label: "As long as it takes", hint: "Happy to style it properly every day." },
];

export const SIDES: Option[] = [
  { value: "skin-fade", label: "Down to the skin" },
  { value: "close-fade", label: "Very short" },
  { value: "shadow-fade", label: "Soft shadow" },
  { value: "taper", label: "Tapered edges only" },
  { value: "undercut", label: "Short, hard line" },
  { value: "natural", label: "Left long" },
];

export const FADE_HEIGHTS: Option[] = [
  { value: "low", label: "Low", hint: "Just above the ear" },
  { value: "mid", label: "Mid", hint: "At the temple" },
  { value: "high", label: "High", hint: "Above the temple" },
  { value: "drop", label: "Drop", hint: "Curves down behind the ear" },
];

export const BEARDS: Option[] = [
  { value: "none", label: "Clean shaven" },
  { value: "stubble", label: "Stubble" },
  { value: "short", label: "Short beard" },
  { value: "medium", label: "Medium beard" },
  { value: "full", label: "Full beard" },
];

export const labelOf = (list: Option[], value: unknown) =>
  list.find((o) => o.value === value)?.label ?? "";

// Maintenance level of a style shown as a 1–3 meter on the style grid (W02).
export const MAINTENANCE_BARS: Record<string, number> = { Low: 1, Medium: 2, High: 3, Variable: 2 };
