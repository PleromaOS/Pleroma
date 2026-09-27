# W43 · AI twin check — LOCKED

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
