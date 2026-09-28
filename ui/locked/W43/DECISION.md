# W43 · AI twin check — REVISED

**Variant 1 (twin as a message) · locked 27 September 2026 by Bryan** ("number 1").

## What won

> The twin arrives in the conversation like a photo someone sent you:
> "Here's your AI twin, in good light." → a large picture message → "AI can
> make mistakes. Does this look like you?" → **Yes, that's me** / **Not quite**.

- **Not quite (first time):** "Thanks for saying. Making another one…",
  typing dots, a second twin, "Closer? Does this one look like you?"
- **Not quite (second time):** "No problem. We'll draw your new cut on your
  own photo instead." (their own photo appears as a message) → **Continue**.
- **Yes:** "Great. Now we draw your new cut on it." → **Continue**.
- Under Continue: "Next: your new cut".

## Why

The most natural continuation of the conversation screens (W41, W42).

## What the rejected variants got wrong / what to watch

- **2** (side by side) was Claude's recommendation: the client compares with
  their own photo instead of judging from memory. **Watch:** if clients
  accept twins that are not quite them, add a small "your photo" thumbnail
  beside the twin message; that would be a revision, not a new widget.
- **3** (slider) compared only half of each face at a time.

## Constraints

- This check protects the result guarantee: the face and hair are confirmed
  as the client's BEFORE any cut is drawn (ADR 0015).
- One retry at most (an AI image costs money), then their own front photo.
- Photos in the candidate are stand-ins; the second twin is an adjusted copy.

---

## 28 September 2026 · REVISED — variant r2-2, side by side (Bryan: "lets lock in option 2")

Now `index.html` (candidate `candidates/W43/r2-v2.html`). The first locked
version is kept as `candidates/W43/locked-2026-09-27-v1.html`.

### What changed and why

- **When:** the twin is made straight after the reading, and the client
  waits for it. Bryan: making it in the background during the questions
  would mean "two conversations at the same time".
- **The wait is narrated:** "Now I'm making your AI twin … about two
  minutes", with four steps that tick off as they really happen (looking at
  your face, setting up the light, making the front, making both sides). The
  front shows as a picture message the moment it exists, then the sides.
  Every line follows the real status from door 13 (twin-status).
- **The check is against the client's own photo:** "Your photo" and "AI
  twin" next to each other at the same size; one slider (the locked W47,
  verbatim) turns both, or drag either picture. Same angle every time.
  Bryan found his chin was wrong only by comparing.
- Unchanged: "AI can make mistakes. Does this look like you?", Yes / Not
  quite, one retry, then their own front photo.

### What the rejected variants got wrong

- **r2-1** (your photo small in the corner): too small to check a jaw or a
  hairline.
- **r2-3** (hold to see your photo): the client has to discover the button.

### To watch

- Home selfies look very different from the studio twin (warm light, closer
  camera). If clients say "not quite" because of the light alone, add a line
  before the question: "The light will look different. Check your face and
  hair."
- If a side view is missing, show the fronts only, without the slider.
