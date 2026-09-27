# W36 · Introduction · welcome — LOCKED

**Variant 3c · locked 27 September 2026 by Bryan** ("I really like 3c").

## What won

> The scan ring. The welcome previews the scan itself: the shop's photo sits
> inside the same ring of fine ticks the Face ID-style scan uses, lighting up
> slowly in gold, under a headline whose words arrive one by one.

Two beats, Duolingo pacing:

- **Beat 1:** logo, step dots, EN/NL (the top line of the Z) → the shop's
  invitation → the headline, word by word, each word blurring into focus →
  the promise → the shop photo in the scan ring, gently floating → "A bit
  shorter?" / "Means something different to everyone." → 3 min · Free ·
  Yours to keep → **Let's start** (bottom right of the Z, the thumb's spot).
- **Beat 2:** back button, dots, EN/NL → **What brings you here?** → four
  glass tiles arriving in Z order → **How it works** (to screen 2).

Words from `docs/specs/intro-copy.md`, with two changes forced by the
usability rules: the long sentence is split so body copy stays near two lines
on a phone, and beat 1's button says "Let's start" because it opens the
question, not "How it works".

## Why, in Bryan's terms

Round 1 variant 3 won on its pacing but stacked everything at the bottom.
Bryan asked for content at the top or centre following the eye's Z path, and
text that arrives and floats: alive, not static, "the future". 3c is the one
that also ties the welcome to what happens next: the ring the client sees on
the first screen is the ring they will fill during the scan.

## What the rejected variants got wrong

- **3a** (top-down Z) read well but the drifting photo low on the screen is
  decoration; it says nothing about what comes next.
- **3b** (centre capsule) put everything in one floating glass box: calm, but
  a box of text, and the whole capsule bobbing makes the button a moving target.
- **Round 1, 1–7:** see the registry; 3 won the first round for its pacing.

## Measured

Chromium, 390×844, both themes: everything fits one screen with no scrolling;
the button's label matches its destination; the language switch replays the
word animation in Dutch; "reduce motion" shows everything at once.

## Constraints discovered while building

- **Glass is now part of the system** (see `brand/DESIGN-SYSTEM.md`, Glass):
  built from the surface token at 62% (panels) or 44% (buttons) plus a blur
  and a fine edge line; never a shadow. Only over imagery; on a flat
  background it is just a grey panel.
- **Blur a photo in advance, not with a CSS filter.** A large CSS-blurred
  layer showed a hard seam in Chromium, and costs more on old phones.
- **Style-library photos can be two panels stacked** (front + side). Crop
  before using one full-bleed.
- **Floating elements must not be the thing people tap.** The ring floats;
  the button does not.
- The photo is a stand-in. In the product it is the shop's own photo, which
  each shop must supply at onboarding.
