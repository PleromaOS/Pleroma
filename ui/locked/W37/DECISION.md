# W37 · Introduction · how it works — LOCKED

**Variant 1 (classic stories) · locked 27 September 2026 by Bryan** ("I like number 1").

## What won

> Instagram-style stories: five progress bars across the top, one big
> picture per slide, the title arriving word by word under it, then one line.

Five slides: three photos → we read your hair (findings pop up with ✓) →
choose your cut → your selfie becoming your AI twin → your new cut on you,
with a peek at the brief. Auto-advances about every 3.8 seconds. Tap = next,
tap the left third = back, hold = pause, Skip = straight to the last slide,
which shows **Continue** with "Next: your face, your rules" under it.

## Why, in Bryan's terms

Five steps on one screen overloaded it. Stories let the client watch instead
of read, in a format campaign traffic already knows from Instagram, where
the advert came from. Only the shape of the consultation is shown here; each
step is explained properly when it happens (just-in-time).

## What the rejected variants got wrong

- **2** (the ring as progress) tied in with the welcome screen, but the ring
  cramped the pictures inside it and the progress was less obvious than bars.
- **3** (glass cards over the photo) was the heaviest to draw on old phones,
  and the "Hold to pause" hint lost contrast over the photo.

## Measured

Chromium, 390×844, both themes: each slide fits one screen; the step bars
fill in real time; the last slide's button says where it goes; the language
switch replays the slide in Dutch; with "reduce motion" nothing advances by
itself.

## Constraints discovered while building

- Any element with `display:flex` in CSS overrides the `hidden` attribute:
  hidden slides need an explicit `[hidden] { display: none }`.
- The slide pictures are illustrations made from the stand-in photo; the
  selfie on slide 4 is the same photo darkened on purpose. The product needs a
  real before/after example for slide 4 before launch.
