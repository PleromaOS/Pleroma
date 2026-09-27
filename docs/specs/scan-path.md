# Scan path — decisions (grilling session 2026-09-27, Bryan)

The consultation has two ways in. Terms are defined in CONTEXT.md
(**scan path**, **question path**, **route**, **finding**).

- **Scan path:** three-photo scan → the AI reads the photos → the client
  confirms each finding → then answers only what they WANT.
- **Question path:** for clients who prefer no photos. The existing question
  widgets, every fact asked, and the result shown on an avatar.

## Decisions

1. **Separate axis.** Scan path / question path decides how we learn who the
   client is today. Both paths then offer both routes ("Choose a famous style"
   / "Build my own style"). The word "route" is kept for that choice only.

2. **What the scan reads (findings):**
   - hair basics: texture, thickness, colour and greys, current length,
     current cut and whether there is a fade, parting side
   - hairline and thinning: hairline shape, recession, crown or temples,
     worded gently and neutrally, never as a diagnosis
   - beard and moustache: current length, patchiness, density, moustache
   - NOT gender (never guessed; the v1 quiz is male-only)
   - Skin tone (S0c) is not asked on the scan path: the photo is the face.
   Still asked on both paths: route, style, styling effort, sides (S5–S9),
   beard and moustache goals.

3. **Confirming: one finding per screen.** A simple Yes / No tap. Yes moves
   straight on (auto-advance, like the quiz). No opens that item's normal
   answer options on the same screen, the AI's reading marked. Chosen over
   grouped screens because each screen asks for one small thought.
   A finding the AI is NOT sure about (dark photo, hair tied up, a hat) is
   asked as a normal question instead of a yes/no.

4. **The wait: "Reading your hair".** The AI can only start once the photos
   are stored (after the email). The client sees their photo with a scanning
   sweep, each finding appearing as it is read, then the confirm screens.

5. **Introduction screen, before anything else.** A friendly screen that
   says what to expect, what we need and why, how their privacy is
   protected, and answers the usual worries. It explains the AI twin: home
   selfies are often poorly lit, so we try to build an AI twin of them in
   good light, which lets us show their new cut properly. It also offers the
   choice not to have any photos taken, which means the result is shown on
   an avatar, not their own face and hair (the question path).

6. **The AI twin.** Built in the background right after the findings are
   confirmed, using the photos and the confirmed findings, while the client
   answers the "what you want" questions. The check is worded honestly, not
   "Is this you?": AI can make mistakes, so does this twin look like you, or
   not quite? Not quite → one more try. Rejected again → the cut is drawn on
   their own front photo instead. The barber always sees the original photos
   next to the twin and the render.

7. **The AI twin is persistent** (keeps the earlier "persistent AI clone"
   decision, renamed). One per client: the face is kept and refined with
   every new scan; the hair is updated to that day's scan, because the brief
   describes the hair as it is today. A returning client still scans, so the
   hair is current. "Delete my photos & twin" removes all of it.

8. **Question path avatar:** an avatar library (ready-made faces in the
   existing mannequin style, filtered by hair texture and skin tone, roughly
   5 textures x 3 skin tones x a few hair colours), the cut drawn on the one
   the client picks — one render, same cost as today. Until the library
   exists: the style reference photo captioned with their real sides choice
   (the locked v1 behaviour).

9. **No guarantee on the question path.** The guarantee needs the client's
   own face and hair; a render on an avatar never passes the feasibility
   gate. The intro screen says so plainly. Everything else (consultation,
   brief, booking) still works without photos.

10. **The render must be truthful (principle).** Findings like a receding
    hairline, thinning or density are not just notes for the barber: the
    AI twin and the render must show them. A render never shows something
    that is not possible on this head — never a lower hairline (smaller
    forehead), never more density than the client has. Goal: the barber
    only confirms "good to execute" and almost never has to amend. So the
    confirmed findings go into the twin and render instructions as hard
    constraints (keep the hairline exactly where it is, add no density).

11. **Truth check on every render and twin.** Before the client sees it, a
    second AI compares it with the original photos and confirmed findings:
    did the hairline move, did density appear, did texture or colour change?
    If it cheated, it is silently redone once (costs us, not one of the
    client's re-renders). Fails twice → shown with a note for the barber, so
    it never loops.

12. **Two consent switches.**
    - Before the scan, required: use my photos for THIS consultation —
      reading my hair, making my AI twin, drawing my cut, my barber's brief.
    - At the end, optional, after they have seen their twin and render:
      keep my AI twin for next time. No → the twin is deleted with the photos.
    Separate purposes for face data get separate agreements (GDPR Article 9).
    Wording goes to legal review (launch checklist).

## The resulting flow

SCAN PATH
  1  Landing
  2  Introduction (NEW): what to expect, why photos, privacy, AI twin,
     "no photos" option and what it costs (avatar, no guarantee).
     Consent switch 1 → Start scan   |   Continue without photos → question path
  3  Scan + review of the three photos (built)
  4  Email (built): records consent 1, stores the photos
  5  Reading your hair (NEW)
  6  Finding screens, one per finding (NEW, one reusable widget)
  7  Route chooser → famous style or build my own → style, effort, sides,
     beard and moustache goals (spec'd, still to build) — AI twin builds meanwhile
  8  AI twin check (NEW): "AI can make mistakes — does this look like you?"
  9  Wait → render on the twin, truth-checked (built, extended)
 10  Reveal, confirm the cut (built)
 11  Keep my AI twin for next time? (NEW, consent switch 2)
 12  Booking handoff (built)

QUESTION PATH
  Introduction → Continue without photos → email → the existing
  "who you are" questions (texture, skin tone, current style, length, beard)
  → route chooser and the same "what you want" questions → avatar picker
  (NEW, reference photo until the library exists) → render on the avatar →
  reveal without a guarantee badge → booking handoff

## New widgets (build one at a time, variants first)

  - Introduction screen
  - Reading your hair
  - Finding screen (yes / no, correction inline)
  - AI twin check
  - Keep my AI twin
  - Avatar picker
Plus the spec'd but unbuilt quiz widgets both paths need: route chooser,
preset grid, sides (S5–S9), beard and moustache (S10–S16c).
