# 15. Scan path, persistent AI twin, and the truth check

Date: 2026-09-27

## Status

Accepted

## Context

Clients were answering questions a photo can answer (texture, colour,
length, beard), and their home selfies were too poorly lit for a faithful
render. Renders also flattered: colour and texture copied from the style
reference, hairlines pulled down, density added. A flattering render is a
promise the barber cannot keep, and the result guarantee rests on it.
Full decision list: `docs/specs/scan-path.md`.

## Decision

- **Two paths.** The scan path learns who the client is from three photos:
  an AI reads them into findings, and the client confirms each finding, one
  per screen, yes or no. The question path is for clients who prefer no
  photos: every fact is asked, and the result is shown on an avatar. Both
  paths offer both routes (famous style, build my own).
- **A persistent AI twin.** The cut is drawn on an AI twin in good light,
  built from the photos plus the confirmed findings, and checked by the
  client ("AI can make mistakes — does this look like you?"), with one retry
  and then a fallback to their own photo. At most one twin per client, kept
  only with a second, optional consent given at the end; the face is refined
  with each scan and the hair is always that day's.
- **The render is truthful, enforced by a truth check.** Every twin and
  render is compared automatically with the original photos and confirmed
  findings before the client sees it. A moved hairline, added density or
  changed texture or colour means it is silently redone once, at our cost.
- **No guarantee without photos.** An avatar is someone else's head.

## Considered options

- One consent switch for everything: rejected. Keeping a face after the
  consultation is a separate purpose from the consultation itself.
- A fresh twin each consultation: rejected by Bryan in favour of a twin that
  improves over time; the hair is still updated at every scan.
- Trusting the render instructions without a check: rejected. Image models
  flatter even when told not to, and the barber should confirm, not redesign.
- Findings as barber notes only: rejected. What the photos show must be
  visible in the render itself.

## Consequences

- Each scan-path consultation costs more AI work: the reading, the twin,
  the truth check, and sometimes a silent redo.
- Face data now includes a kept AI twin: the deletion flow must remove it,
  and both consent wordings need legal review before launch.
- The avatar library has to be generated before the question path is
  complete; until then it shows the style reference photo with a caption.
