// The words for each finding of the hair reading (door 10, read-hair).
//
// The analyser returns short codes ("slightly-higher-temples"); the client
// sees a sentence ("Your hairline sits a little higher at the temples").
// Every value has three pieces of wording:
//   says    the reading, as a message; the gold part sits inside <em>
//   label   the short answer shown when the client taps "Not quite"
//   question the plain question, for the question path (the scan path
//            always shows the reading with yes / no, since 27 Sep)
//
// Wording rules (scan-path.md decision 2): hairline, crown, patches and
// evenness are described neutrally, as what is visible. Never a diagnosis,
// never a cause, never "receding", "balding" or "thinning".
// The codes must match _shared/hair.ts in the backend.

export type FindingKey =
  | "texture" | "density" | "colour" | "grey" | "length_top" | "sides_now" | "fade_now"
  | "parting" | "cowlick" | "hairline" | "hairline_shape" | "crown" | "bald_spots"
  | "growth_evenness" | "cut_evenness" | "beard" | "beard_patchy" | "moustache";

type Value = { value: string; says: string; label: string };
export type FindingText = {
  key: FindingKey;
  topic: string;        // the small gold label above the message
  question: string;     // used when the AI is not sure
  values: Value[];
  zoom: "top" | "hairline" | "colour" | "side" | "beard"; // which part of the photo to show
};

const v = (value: string, label: string, says: string): Value => ({ value, label, says });

// In the order a barber looks: the hair itself, the shape of the head, then the face.
export const FINDINGS: FindingText[] = [
  { key: "texture", topic: "Texture", zoom: "top", question: "Which looks most like your hair?", values: [
    v("straight-fine", "Straight and fine", "Your hair looks <em>straight and fine</em>"),
    v("straight-coarse", "Straight and coarse", "Your hair looks <em>straight and coarse</em>"),
    v("wavy", "Wavy", "Your hair looks <em>wavy</em>"),
    v("curly", "Curly", "Your hair looks <em>curly</em>"),
    v("coily", "Coily", "Your hair looks <em>coily</em>"),
  ] },
  { key: "density", topic: "Thickness", zoom: "top", question: "How much hair do you have?", values: [
    v("thin", "On the lighter side", "Your hair is <em>on the lighter side</em>"),
    v("medium", "Medium", "Your hair is <em>medium</em> in thickness"),
    v("thick", "Thick", "Your hair looks <em>thick</em>"),
  ] },
  { key: "colour", topic: "Colour", zoom: "colour", question: "Which is closest to your hair colour?", values: [
    v("black", "Black", "Your colour looks <em>black</em>"),
    v("dark-brown", "Dark brown", "Your colour looks <em>dark brown</em>"),
    v("medium-brown", "Medium brown", "Your colour looks <em>medium brown</em>"),
    v("light-brown", "Light brown", "Your colour looks <em>light brown</em>"),
    v("blond", "Blond", "Your colour looks <em>blond</em>"),
    v("red", "Red", "Your colour looks <em>red</em>"),
    v("grey", "Grey", "Your colour looks <em>grey</em>"),
    v("white", "White", "Your colour looks <em>white</em>"),
  ] },
  { key: "grey", topic: "Grey", zoom: "colour", question: "How much grey is in your hair?", values: [
    v("none", "None", "We see <em>no grey</em>"),
    v("some", "Some", "We see <em>some grey</em> coming through"),
    v("lots", "Quite a lot", "We see <em>quite a lot of grey</em>"),
  ] },
  { key: "length_top", topic: "Length on top", zoom: "top", question: "How long is the top right now?", values: [
    v("very-short", "Very short (under 1 cm)", "The top is <em>very short</em>"),
    v("short", "Short (1 to 4 cm)", "The top is <em>short</em>, a few centimetres"),
    v("medium", "Medium (4 to 8 cm)", "The top is <em>medium length</em>"),
    v("medium-long", "Medium-long (8 to 15 cm)", "The top is <em>medium-long</em>"),
    v("long", "Long (over 15 cm)", "The top is <em>long</em>"),
  ] },
  { key: "sides_now", topic: "Sides", zoom: "side", question: "How are your sides right now?", values: [
    v("skin", "Shaved to the skin", "Your sides are <em>shaved to the skin</em>"),
    v("very-short", "Clipper short", "Your sides are <em>clipper short</em>"),
    v("short", "Short", "Your sides are <em>short</em>"),
    v("medium", "Medium", "Your sides are <em>medium length</em>"),
    v("long", "Long", "Your sides are <em>long</em>"),
  ] },
  { key: "fade_now", topic: "Fade", zoom: "side", question: "Is there a fade on your sides right now?", values: [
    v("none", "No fade", "There's <em>no fade</em> right now"),
    v("low", "Low fade", "You have a <em>low fade</em>"),
    v("mid", "Mid fade", "You have a <em>mid fade</em>"),
    v("high", "High fade", "You have a <em>high fade</em>"),
  ] },
  { key: "parting", topic: "Parting", zoom: "top", question: "Where does your hair part?", values: [
    v("none", "No parting", "There's <em>no parting</em>"),
    v("left", "On my left", "Your hair parts on <em>your left</em>"),
    v("right", "On my right", "Your hair parts on <em>your right</em>"),
    v("middle", "In the middle", "Your hair parts <em>in the middle</em>"),
  ] },
  { key: "cowlick", topic: "Cowlick", zoom: "top", question: "Does your hair have a cowlick, a spot where it stands up or swirls by itself?", values: [
    v("none", "No cowlick", "We see <em>no cowlick</em>"),
    v("front", "At the front", "Your hair has a <em>cowlick at the front</em>"),
    v("crown", "At the crown", "Your hair has a <em>cowlick at the crown</em>"),
    v("front-and-crown", "Front and crown", "Your hair has a <em>cowlick at the front and the crown</em>"),
    v("not-visible", "Not sure", "We couldn't see <em>any cowlick</em> clearly"),
  ] },
  { key: "hairline", topic: "Hairline", zoom: "hairline", question: "How does your hairline sit?", values: [
    v("straight", "Straight across", "Your hairline runs <em>straight across</em>"),
    v("slightly-higher-temples", "A little higher at the temples", "Your hairline sits <em>a little higher at the temples</em>"),
    v("clearly-higher-temples", "Clearly higher at the temples", "Your hairline sits <em>clearly higher at the temples</em>"),
    v("higher-all-along", "A little higher all along the front", "Your hairline sits <em>a little higher all along the front</em>"),
  ] },
  { key: "hairline_shape", topic: "Hairline shape", zoom: "hairline", question: "Is your hairline the same on both sides?", values: [
    v("even", "The same on both sides", "Your hairline looks <em>even on both sides</em>"),
    v("uneven", "A bit different on each side", "Your hairline is <em>a bit different on each side</em>"),
  ] },
  { key: "crown", topic: "Crown", zoom: "top", question: "How does the crown, the back of the top, look?", values: [
    v("full", "Full", "Your crown looks <em>full</em>"),
    v("some-thinning", "A little lighter", "Your crown looks <em>a little lighter</em>"),
    v("clear-thinning", "Noticeably lighter", "Your crown looks <em>noticeably lighter</em>"),
    v("not-visible", "Not sure", "We couldn't see <em>your crown</em> clearly"),
  ] },
  { key: "bald_spots", topic: "Bare patches", zoom: "top", question: "Are there any patches where no hair grows?", values: [
    v("none", "None", "We see <em>no bare patches</em>"),
    v("one-small", "One small patch", "We see <em>one small bare patch</em>"),
    v("several-or-large", "A few, or a larger one", "We see <em>a few bare patches</em>"),
  ] },
  { key: "growth_evenness", topic: "Growth", zoom: "top", question: "Does your hair grow evenly all over?", values: [
    v("even", "Evenly all over", "Your hair grows <em>evenly all over</em>"),
    v("patchy", "Lighter in some places", "Your hair grows <em>lighter in some places</em>"),
  ] },
  { key: "cut_evenness", topic: "Current cut", zoom: "side", question: "Does your current cut look even?", values: [
    v("even", "Even", "Your current cut looks <em>even</em>"),
    v("uneven", "A bit uneven", "Your current cut looks <em>a bit uneven</em>"),
  ] },
  { key: "beard", topic: "Beard", zoom: "beard", question: "What's on your face right now?", values: [
    v("none", "Clean shaven", "You're <em>clean shaven</em>"),
    v("stubble", "Stubble", "You have <em>stubble</em>"),
    v("short", "Short beard", "You have a <em>short beard</em>"),
    v("medium", "Medium beard", "You have a <em>medium beard</em>"),
    v("full", "Full beard", "You have a <em>full beard</em>"),
  ] },
  { key: "beard_patchy", topic: "Beard growth", zoom: "beard", question: "Does your beard grow evenly?", values: [
    v("even", "Evenly", "Your beard grows <em>evenly</em>"),
    v("some-patches", "With a few gaps", "Your beard grows <em>with a few gaps</em>"),
  ] },
  { key: "moustache", topic: "Moustache", zoom: "beard", question: "What about your moustache?", values: [
    v("none", "No moustache", "You have <em>no moustache</em>"),
    v("natural", "Grown in naturally", "Your moustache is <em>grown in naturally</em>"),
    v("styled", "Shaped or styled", "Your moustache is <em>shaped</em>"),
  ] },
];

// Where to look on the client's own photo for each topic: which photo, how
// far zoomed in, and which part. Rough frames for a front photo with the face
// centred (the scan guides the face into an oval); tuned later on real scans.
export const ZOOM: Record<FindingText["zoom"], { photo: "front" | "sideA"; size: string; pos: string }> = {
  top:      { photo: "front", size: "240%", pos: "50% 6%" },
  colour:   { photo: "front", size: "300%", pos: "35% 8%" },
  hairline: { photo: "front", size: "230%", pos: "50% 22%" },
  side:     { photo: "sideA", size: "170%", pos: "50% 25%" },
  beard:    { photo: "front", size: "220%", pos: "50% 78%" },
};

// A finding can depend on another one: no beard means nothing to say about
// how the beard grows.
export function applies(key: FindingKey, confirmed: Record<string, string>): boolean {
  if (key === "beard_patchy") return !["none", "stubble"].includes(confirmed.beard ?? "");
  return true;
}

export const textOf = (key: FindingKey) => FINDINGS.find((f) => f.key === key)!;
