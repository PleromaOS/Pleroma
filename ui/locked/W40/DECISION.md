# W40 · Prep checklist + consent — LOCKED

**Variant 3 (the waiting ring) · locked 27 September 2026 by Bryan** ("I prefer the 3").

## What won

> The empty scan ring waits in the middle of the screen, the four prep items
> (window or lamp · hat and glasses off · hair as you normally wear it ·
> sound on) around it; then the camera note, the consent switch and Start scan.

The last screen of the introduction and the only one that is not a story:
consent must be a deliberate tap (GDPR Article 9). **Start scan** is greyed
out and reads "Turn on the switch to start" until the switch is on.

## Why

It closes the loop that began on the welcome screen (W36, the scan ring):
the next thing the client sees is that same ring filling during the scan.

## What the rejected variants got wrong

- **1** (pre-flight check that ticks itself) was calm but passive: the ticks
  claim things the client has not done.
- **2** (tiles you tap as you do them) would improve scan quality but adds
  taps; worth revisiting if failed scans from bad light turn out common.

## Constraints

- **Consent label** (wording version must be bumped when this ships; current
  code uses selfie-2026-09-v2): "I'm 16 or older, and I agree to my photos
  being used for this consultation: reading my hair, my AI twin, my new cut
  and my barber's brief." The age line lives here because the stories
  before it can be skipped (W38 decision record). Legal review pending
  (launch checklist).
- Nothing leaves the phone before the email; the note on screen says so.
- The ring's CSS must target only the ring (`.ringzone > svg`); a broad
  `svg` selector also moved the prep icons.
