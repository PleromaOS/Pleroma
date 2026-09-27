# W47 · Turn your twin — LOCKED

**Variant 2 (photo with a turn slider) · locked 27 September 2026 by Bryan**
("I like number two").

## What won

> The twin arrives in the conversation as a picture message. Under it, a
> slider with three stops written out: **Left side · Front · Right side**.
> Slide the gold knob, or drag the photo itself; both move together.

- The three pictures are the three checked twin views. When the finger lets
  go, it always settles on one of them; the blend between two pictures is
  only seen while moving, and only in the middle of the move.
- Dragging right turns his face to the right (like turning a globe).
- Keyboard and screen reader: the photo is a slider with three stops
  (arrow keys, Home, End); the current angle is read out by name.
- Reusable: the same viewer will show the new cut from three angles.

## Why

Bryan's idea (27 Sep): "with their finger, turn the head of their avatar".
Option 1 of the brainstorm: no extra pictures, so every angle the client can
land on is one the truth check has seen. Variant 2 names the angles, so
nobody has to guess what the picture can do.

## What the rejected variants got wrong / what to watch

- **1** (drag the photo, dots) and **3** (turns once by itself) hide that it
  turns until you try; 3 also costs motion on old phones.
- **4** (tap to open full screen) puts the turning one tap away from the
  question it is meant to help answer.
- **Watch:** the blend between angles shows a brief double image. If clients
  find it odd, the fix is more angles (option 2 of the brainstorm), not a
  different widget.

## Constraints discovered while building

- Bryan's first look: "it repeated the side photo". The image model had drawn
  a side view mirrored (both sides faced the same way). Fixed in the kitchen
  (twin-kitchen, 27 Sep): the side photo's angle is read first and written
  out in words, every picture is labelled, and the truth check now fails a
  side that faces the wrong way or changes the profile (chin, jaw, nose).
- The viewer needs all three views. If a side is missing, show the front
  alone as a plain picture message (W43), never a slider with empty stops.
