# What you want — the question list (scan path)

Approved 27 September 2026 (Bryan). Comes straight after the
findings ("All checked") and the route chooser (W03, locked). Everything is
one conversation (scan-path.md decision 13), built from two locked pieces:

- **Pictures** — W03 picture replies: a row of photos to swipe and tap.
- **Words** — W46 word answers: stacked cards, a small drawing, the answer,
  a one-line hint.

## The rules this list follows

1. **Ask only what they WANT.** The reading already told us what they HAVE
   (texture, length, sides, fade, beard, moustache, hairline…). Never ask
   that again.
2. **"Same as now" first, where it fits.** When the reading found something
   the client may simply want to keep (their fade, their beard), the first
   answer is "Keep it like now", which skips the detail questions.
3. **Skip what doesn't apply.** No fade → no fade height. No beard and no
   wish for one → no beard questions.
4. **Never more than 6 answers.** Barber's choice only on fade height, fade
   shape and neckline, always last, never a card (DESIGN-SYSTEM.md 7.16).
5. **The barber's rules are built in, never asked.** The back always sits a
   little lower than the sides; no skin on a taper; darker sides (#3 or more)
   add a note to clean up the sideburns and behind the ears (the client can
   say no).
6. **Plain words, never trade words.** "How close to the skin?", not "guard".
   The trade word goes on the barber's brief.
7. **Typing dots only for real work** (decision 13). Questions just appear.

## The order

### Route A · Choose a famous style (typical: 7–9 taps)

| # | Question (client's words) | Answer type | Answers | Asked when |
|---|---|---|---|---|
| A1 | Pick a cut you like, or build your own. | Pictures (W03) | the cuts that suit their texture | always |
| A2 | One detail of that cut, e.g. Curtains: "How long should the fringe be?" | Words | per cut, from brief-male.md (the single most important option only) | only if the cut has one |
| E1 | How long do you want to spend on it in the morning? | Words, drawing: upkeep bars | None at all · A minute or two · As long as it takes | always |
| S1…| **Sides**, see below | | | |
| L1…| **Edges**, see below | | | |
| B1…| **Beard and moustache**, see below | | | |

### Route B · Build my own style (typical: 9–12 taps)

| # | Question | Answer type | Answers | Asked when |
|---|---|---|---|---|
| T1 | What do you want on top? | Words, drawing: length arrow | Keep the length, just tidy it · A bit shorter · Much shorter · Let it grow longer | always |
| T2 | How short on top? | Words, drawing: ruler | Very short · Short · Medium (only lengths below what they have now) | if "shorter" |
| T3 | Which way do you wear it? | Pictures | Forward · Swept back · Side part · Up with volume · Natural and loose | always |
| E1 | How long in the morning? | Words | as in route A | always |
| S1…, L1…, B1… | as below | | | |

"Let it grow longer" gives a growth plan on the brief ("this is a longer
journey", summary only, never a blocker).

### Sides (both routes)

| # | Question | Answer type | Answers | Asked when |
|---|---|---|---|---|
| S0 | Keep your sides like now? (e.g. "a low fade") | Words | Yes, same as now · No, change them | only if the reading found a fade or a taper |
| S1 | How do you want your sides? | Words, drawing: side profile | Faded · Tapered at the edges · Short with a hard line · Left long | if not "same as now" |
| S2 | Where should the fade start? | Pictures | Low · Mid · High · Drop · Barber's choice | if faded |
| S3 | How close to the skin? | Words, drawing: shade swatch | Down to the skin · Very short · Soft shadow · Darker | if faded (for taper: Very short · Soft shadow · Darker, no skin) |
| S4 | What shape of fade? | Pictures | Classic · Drop · Burst · Barber's choice | if faded |
| S5 | How should the hard line look? | Words | Sharp and clean · Softer | if hard line |

### Edges (both routes)

| # | Question | Answer type | Answers | Asked when |
|---|---|---|---|---|
| L1 | How sharp should your edges be? | Words, drawing: line | Sharp line-up · Soft · Natural | always (no Barber's choice) |
| L2 | How should the back finish at your neck? | Words, drawing: the edge | Tapered · Square · Round · Barber's choice | always |

### Beard and moustache (depends on the reading)

| Reading found | First question | Then |
|---|---|---|
| Clean shaven | Keep it clean shaven? (Yes · I want stubble · I want to grow a beard) | growing → a growth plan on the brief, no more questions today |
| Stubble | What about your stubble? (Keep it · Shave it off · Let it grow) | none |
| A beard (short and up) | What should we do with your beard? (Keep the length, just shape it · Shorter · Shave it off) | B2 shape (Pictures: Square · Round · Tapered · Natural) · B3 blend into the fade? (only if faded: Blend it · Keep them separate) · B4 cheek and neck lines (Sharp · Natural) |
| A moustache | Your moustache? (Keep it as is · Trim it neat · Shave it off) | none |

A patchy beard (from the reading) adds a note for the barber; the client is
never asked about it.

## What is stored (for the build, not for the client)

New answer names the doors must accept: `style_option`, `top_plan`,
`top_length`, `top_direction`, `sides_keep`, `fade_closeness`,
`fade_style`, `line_sharpness`, `neckline`, `beard_plan`, `beard_shape`,
`beard_blend`, `beard_lines`, `moustache_plan`. The existing
`sides_treatment` is worked out from S1 + S3 (faded + skin = skin-fade,
very short = close-fade, soft shadow = shadow-fade), so the renderer and
the brief keep working.

## Pictures and drawings still needed (the photo pass)

- Pictures: fade height (4), fade shape (3), beard shape (4), top direction (5).
- Drawings (simple, like the upkeep bars): sides type, closeness swatches,
  edge sharpness, neckline shapes, top length.
- Fix the Afro Fade library image (visible join line).

## Decided (Bryan, 27 Sep)

1. **"Same as now" shortcut: yes.** When the reading found a fade, a taper
   or a beard, the first answer is "Keep it like now" (S0 and the beard
   row), which skips the detail questions.
2. **The one cut detail (A2): now.** Every cut with an important detail
   asks it, right after the cut is picked. The list is below.
3. **Clean-shaven clients: one quick question.** "Keep it clean shaven?"
   Yes · I want stubble · I want to grow a beard.

## A2 · the one detail per cut

The single most important detail of each cut (from brief-male.md). Words
with a drawing, except where marked. Cuts with no detail skip A2.

| Cut | Question | Answers |
|---|---|---|
| Buzz Cut, Crew Cut, Caesar Cut | How short on top? | The same as the sides · A little longer than the sides |
| Crop | How should the top look? | Straight fringe · Textured and messy · Spiked · Natural curl |
| Classic Pompadour, Modern Pompadour | Where does it part? | No part · Side part · Middle part |
| Classic Men's Haircut | How do you style it? | Side part · Swept back, wet look · Blow-dried |
| Comb Over, Comb Over Fade | How should the parting line look? | Shaved in, sharp · Natural |
| Flat Top | How high on top? | Low · Medium · High |
| Mohawk | What shape at the neck? | Square · V-shape · Round (replaces L2 for this cut) |
| Curly Afro, Afro Fade | What shape overall? | Round · Angular (pictures) |
| Modern Mullet, Classic Mullet | How long at the back? | To the collar · Below the collar |
| Curtains | How long should the fringe be? | Short · Medium · Long |
| Quiff | How much height? | Low · Mid · High |
| Slick Back | What finish? | Wet shine · Natural, matte |
| Edgar Cut | Where does the fringe line sit? | Just below the hairline · Mid-forehead · At the eyebrows |
| Wolf Cut | How much layering? | Light texture · Full shag |
| Fauxhawk | (none) | |

Stored as `style_option`, with the question's short name, e.g.
`fringe_length: medium`.

## Built (27 Sep) · route A in the app

- New room `want` (pleroma-app/src/screens/Want.tsx), right after the
  findings: the route chooser (W03) and the questions (W46) as one
  conversation. The list above lives in pleroma-app/src/data/wants.ts; the
  drawings are placeholders in components/Drawing.tsx.
- Every answer is saved through door 3 on tap. Door 3 now accepts the new
  answers with fixed words only (_shared/wants.ts), including fade_style,
  line_sharpness and neckline, which were free text before.
- Door 3 fix: two answers sent at the same moment used to overwrite each
  other. Saving is now one database step (function merge_answers).
- At the end ("Draw my new cut") the renderer's own answers are worked out
  and saved: sides_treatment, fade_height, beard_style. Barber's choice on
  fade start leaves fade_height empty (the renderer's default).
- Route B ("Build my own", built the same day): top first (keep the
  length / shorter / let it grow longer; the length, only lengths below or
  above what the reading found; which way they wear it), then the same
  questions as route A. Answers `route`, `top_plan`, `top_length`,
  `top_direction` (door 3 accepts them).
- The render needs a reference photo of a known cut (words alone make the
  model draw its stock, straight-haired idea of a style: hair-transfer,
  build-request.ts). So a built style is drawn from the CLOSEST catalogue
  cut that suits the client's hair: worn the same way, same length where
  possible (table in pleroma-app/src/data/wants.ts, closestCut). The brief
  keeps exactly what they built and shows "Your own style", never the name
  of the cut it was drawn from. Demo: wavy, shorter, short, up → Fauxhawk.
- Honest limit: the render of a built style is the nearest known cut, not
  an exact drawing of every choice. A later renderer change can pass the
  built answers into the prompt as well.
- The row shows the first 8 cuts that suit the texture; "See all" opens the
  rest. Demo run (wavy, low fade, stubble, moustache): 11 questions after
  the cut when changing the sides, 7 when keeping them.
