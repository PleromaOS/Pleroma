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
   ~~A finding the AI is NOT sure about is asked as a normal question.~~
   Changed 27 Sep (Bryan): EVERY finding is shown as the reading plus
   Yes / No, sure or not; the options appear only after "Not quite", so the
   client never has to think through a list up front. A finding the AI
   could not see at all (crown out of view, "not visible") is not brought up.

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

13. **One conversation (27 Sep, Bryan).** The introduction tells a story
    (stories, like Instagram, where campaign clients come from). From the
    scan to the booking, everything is ONE conversation, like texting,
    because texting is familiar to everyone. Two modes are fine; a third
    switch in the middle (dropping out of the chat into a full-screen menu)
    breaks the experience.
    - Choices that need pictures live INSIDE the conversation as picture
      replies (a row of cuts to swipe and tap), the way chat apps send cards.
    - The typing dots appear only when something is really happening (the
      AI reading or drawing), never as padding before a simple question.
    - Still page-style and to be moved into the conversation: the email
      screen (W34), the render wait (W28), the reveal and the confirm
      screens. The render can arrive like a photo someone sends you, tapped
      to open full screen, as the locked AI twin check (W43) already does.
    - The question path (no photos) should become a conversation too, after
      the scan path is done.

The questions after the route chooser: docs/specs/what-you-want.md (draft).

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

## Introduction screen — decisions (2026-09-27)

Modelled on Duolingo (value before asks, one idea per screen, a friendly
voice, visible progress) and Wispr Flow (explain before the phone asks for a
permission, an early proof moment, privacy in short flat sentences plus real
control). Four short screens, then the prep:

  1  Welcome — the SHOP invites them first (name, ideally the barber's face),
     then who PleromaOS is and why: bridging the communication gap between
     client and barber, so clients finally get the result they want, backed
     by something real, not vague words. 3 minutes, free, you keep your
     render and brief. Optional one tap: "What brings you here?" (new look /
     sharpen my cut / fix a bad cut / just curious).
  2  How it works — what to expect next, as a story: three photos → your AI
     twin → your new cut on you → a guarantee the shop backs. The HUMAN why:
       photos: "A good barber looks at you from every side before touching
       the clippers. So do we."
       twin: "Nobody looks their best in a bathroom-light selfie. We'd be
       judging the lighting, not the haircut. Your AI twin is you on a good
       day, so you can judge the cut."
     Every hair type (honest: some textures have no guarantee badge yet).
  3  Your face, your rules — never sold; who sees it; delete anytime; the
     twin kept only if you say so; stop anytime, nothing saved before the
     email; 16 or older; the no-photos option and its honest cost (avatar,
     no guarantee).
  4  The guarantee — what is promised in plain words, and why it is real
     (the barber confirms before cutting).
  Then: prep checklist (face a window, hat and glasses off, hair as you
  normally wear it) → consent switch 1 → camera. The prep also primes the
  phone's camera permission pop-up.
  Everything else: a "Your questions" section.
  Dutch and English, auto-detected (brand rule; the app is English-only today).

Wording rules — only promise what is true:
  - "We never sell your data": true, say it loudly.
  - NOT "never shared with any company": photos pass through our storage
    (Supabase) and the AI (Google) under contract. Say instead: seen by your
    barber and the secure services that make this work, nobody else.
  - "Stored in the EU": TRUE for our database and photo storage (Supabase
    region eu-west-1, Ireland). The AI step may process outside the EU.
  - "Never used to train AI": only true on Google's PAID Gemini tier (the
    paid terms say prompts and responses are not used to improve Google's
    products). Confirm billing is on for our Gemini key before saying it.
  - "Delete anytime": only once the deletion flow exists (launch checklist).

## How it works (W37) — decision 2026-09-27

Five steps on one screen overloaded it. Chosen: **stories-style**, like
Instagram (where campaign traffic comes from): one short line and one picture
per slide, auto-advancing about every 4 seconds; tap to go forward (left edge
goes back), hold to pause, Skip jumps to the last slide. With "reduce motion"
on, it only moves when tapped. The intro gives the SHAPE only; each step is
explained properly when it happens (just-in-time): the prep screen for the
photos, "Reading your hair" for the reading, the twin check for the AI twin.

## The hair analyser (door 10, read-hair) — built 2026-09-27

- Reads the three stored scan photos with Gemini (vision model; tries
  gemini-3.8-flash, then 3.5-flash; override with the GEMINI_VISION_MODELS
  secret). When every model is busy it waits 3 s, then 8 s, and tries the
  list again (three rounds at most). A model that answers "gone" (404) is
  skipped for the rest of that reading. gemini-2.5-flash was removed from the
  list on 27 Sep: Google no longer offers it to new accounts.
- Returns 18 findings, each a value from a fixed vocabulary plus a confidence
  0-1: texture, density, colour, grey, length_top, sides_now, fade_now,
  parting (from the person's own left/right), hairline, crown, beard,
  beard_patchy, moustache, and (added 27 Sep at Bryan's request) bald_spots,
  hairline_shape (even / uneven), growth_evenness (even / patchy),
  cut_evenness (is the current cut lopsided) and cowlick; plus
  readable / unreadable_reason and one note.
- Below 0.7 confidence a finding is marked `ask`: the app asks it as a normal
  question instead of a yes/no. Anything outside the vocabulary becomes an ask.
- Always asked, whatever the AI's confidence:
  - colour when it reads black or dark brown (a phone photo cannot tell them
    apart; Bryan's very dark brown hair read as black);
  - any "not-visible" answer (crown, cowlick).
- The AI is run at temperature 0 (its steadiest setting).
- Never guesses gender, age, ethnicity or health. Hairline, crown, bald spots
  and evenness are worded as neutral descriptions, never a diagnosis.
- Stored in `hair_readings` exactly as returned (never edited). The client's
  confirmations and corrections go in `confirmations` on the same row, so the
  analyser's real accuracy can be measured.
- The same photos read twice return the first reading (no second charge),
  unless READER_VERSION changed (then it reads again). Current: 2026-09-27c.
- A failed reading stores every model's answer in `error`, for diagnosis.
- Tests on Bryan's own scan (27 Sep): readable in 6-7 s. Bryan judged the
  reading "spot on" except colour (very dark brown read as black; now always
  asked). The five new findings all came back none / even, which matches.
  Known wobble: the hairline read "slightly higher temples" once and
  "straight" twice on the same photos. Temperature 0 should steady it; if it
  keeps moving on other test scans, options are to always ask the hairline,
  or read twice and ask when the two disagree.

## Reading and findings in the app (built 2026-09-27)

- New room `reading` (pleroma-app/src/screens/Reading.tsx), right after the
  email: W41 narration while door 10 reads, then W42 findings one by one.
  The narration runs on a timer; the first finding (or bad news) never lands
  before it finishes (about 5.6 s). After 20 s: "taking a little longer".
- Order, as a barber looks: texture, thickness, colour, grey, length on top,
  sides, fade, parting, cowlick, hairline, hairline shape, crown, bare
  patches, growth, current cut, beard, beard growth, moustache. Beard growth
  is skipped without a real beard. Wording for every value lives in
  pleroma-app/src/data/findings.ts (neutral, never a diagnosis; to be
  polished in the copy pass).
- Every finding: the reading + "Yes, that's right" / "Not quite" (opens the
  answers, "our reading" marked), whether the AI was sure or not. Findings
  the AI could not see are skipped. Back un-answers the previous finding.
- Each answer goes to door 11, confirm-finding, the moment it is tapped. The
  door (not the app) records whether the client agreed with the AI, and
  whether the AI was unsure (ai_unsure), in `hair_readings.confirmations`.
  That shows later whether unsure readings are corrected more often.
  One database step per answer (function confirm_finding), so fast taps
  can't overwrite each other.
- At the end ("All checked" → "Next: choose your cut"): texture and length on
  top are saved as the quiz answers hair_texture and current_length (door 3),
  so the scan path skips those two questions and goes straight to the cut.
- Can't read the photos → "Answer questions" (the texture question onwards)
  or "Scan again". The AI down → "Try again" or "Answer questions instead".
- A rescan before the questions are done throws the old reading away and
  reads again.
- The zoomed photo crop per topic (top, colour, hairline, side, beard) is a
  rough frame; tune it on real scans.
- Demo: add ?demo (a made-up reading; the crown is skipped); add &unreadable to
  see the can't-read path.

## The AI twin, backend (built 2026-09-27)

- Table `ai_twins` (one row per attempt, at most 2 per consultation) and a
  private storage bucket `ai-twins` (a twin is the client's face).
- Door 12 `make-twin`: made from the three scan photos and the CONFIRMED
  findings (texture, thickness, colour and grey, lengths, fade, hairline,
  crown, beard, moustache), with gemini-3-pro-image (the renderer's model),
  as a studio portrait, 3:4. The instructions only allow light, background,
  sharpness and framing to change: never a lower hairline, never more hair,
  never a younger or slimmer face.
- The truth check runs on every twin before anyone sees it: a second AI
  compares it with the photos (same person? hairline moved? hair added?
  texture, colour, beard or face changed?). Failed → made once more,
  silently, at our cost. Failed twice → kept, flagged for the barber
  (`needs_barber_note`). If the checker itself is down, the twin is kept and
  flagged rather than paying for a second picture nobody can check.
- Door 13 `twin-status`: running / ready (private link, 1 hour) / failed.
  The truth check details are never shown to the client.
- Door 14 `twin-verdict`: "looks like me" → the cut is drawn on the twin;
  "not quite" on the first → one more try (door 12 again); "not quite" on
  the second → the cut is drawn on their own front photo.
- First real test, Bryan's scan (27 Sep): ready in 44 s, passed the truth
  check on the first try. Likeness to be judged by Bryan.
- Three angles (Bryan, same day: "make sure that we also get the sides"):
  the front exactly as approved, plus each side at the same angle as the
  client's own side photos, so the barber can judge the sides and the client
  can compare like for like. Each view is made by its own job (function
  `twin-kitchen`, service key only), because one job making all three ran
  past the 150-second limit of a server function and was stopped halfway.
  Each view gets its own truth check and one silent redo; the last view to
  finish sets the status (database function twin_view_done).
- Test on Bryan's scan: both sides ready in about 2 minutes (made at the
  same time as each other). One side passed first time. The other failed
  the truth check twice (first "forehead wrinkles smoothed", then "more
  volume and height on top") and was kept with a note for the barber, as
  designed. Clothing differs between the three views (T-shirt, another
  T-shirt, bare shoulders); Bryan: clothing doesn't matter.
- One shirt on all three views (Bryan, later the same day: "make sure that
  the shirt is consistent"). The front is now made first, exactly as
  approved; when it is stored, its job starts the two sides, and each side
  gets the finished front as an extra picture with "exactly the same
  clothing, background, light and colours as this". The truth check still
  compares each side with the client's real photos only. A twin now takes
  about 2 to 3 minutes (front, then both sides together). If the front
  fails, the sides are closed as failed too, so a twin never hangs.
  Re-test on Bryan's scan (front kept): same grey T-shirt and background on
  all three. One side passed the truth check; on the other the checker was
  busy (503), so it was kept with a note for the barber.
- Sides facing the wrong way (Bryan, 27 Sep: "it repeated the side photo").
  With the front as an extra picture, the image model drew one side, then
  both sides, mirrored: the other side of his head, and turned further than
  his photos. Fixed in twin-kitchen: every picture is labelled ("IMAGE 2:");
  before a side is made, a quick look at the real side photo writes the angle
  out in words (nose toward the left or right edge, slight / three-quarter /
  profile, which ear shows); the truth check now also fails a side that faces
  the wrong way or changes the profile. Also from Bryan: "my chin ... does not
  descend. It continues slightly forward", so the side instructions lock the
  chin projection and jaw angle, and the check looks for a receding chin.
  make-twin now only remakes the sides that are missing.
  Re-test on Bryan's scan (front kept): both sides the right way round, at
  the same angle as his photos, and both passed the truth check first time.
- W47 (locked): the client turns the twin with a slider or a finger, between
  the three checked views. The same viewer will show the new cut.
- Door 15 `my-photos`: 1-hour private links to the client's OWN three scan
  photos, for showing their real photo next to the twin or render.
- Not built yet: the twin check screen in the app (W43), starting the twin
  in the background after the findings, drawing the render on the twin, and
  the truth check on the render.

### The twin in the app (28 Sep)

- New room "twin" between the reading and "what you want" (flow/steps.ts).
  The reading's button now says "Next: your AI twin".
- screens/Twin.tsx: asks door 12 for a twin (door 12 never pays twice: an
  existing twin comes back as it is), then door 13 every 3 seconds. Four
  steps tick off; the first two follow the clock but never run ahead of the
  real status. The front shows the moment it exists (door 13 now links each
  picture as soon as it is stored). When both sides are done: the W43
  side-by-side check (components/TwinCompare.tsx, W47 slider), then
  Yes / Not quite through door 14. A second twin is narrated the same way.
  After two "not quite", or a twin that failed, the cut goes on their own
  photo; the conversation says so in one line.
- What the cut is drawn on is kept as `twin.outcome` ("use-twin" or
  "use-own-photo") for the render step, which still uses the own photo.
- Demo mode simulates it (front after 6 s, sides after 11 s); add
  `&twinfail` to see a failed twin.
- Not yet: drawing the cut on the twin (all three angles) and the truth check
  on the render; the "keep my twin" question (W44) at the end.

### The new cut on the twin, from three angles (28 Sep)

- request-render draws on the AI twin when the client said it looks like
  them (door 14); otherwise on their own front photo, as before.
- hair-transfer draws the front (with the style photo, as before), then one
  job per side. Each side gets the twin's side plus the finished front
  ("this exact haircut, from here"), with the direction written out in words.
- Every picture gets a truth check against what it was drawn on: same
  person, face unchanged, hairline not lowered, no hair added, texture and
  colour kept, beard as asked, and for the sides: facing the right way and
  the same cut as the front. One silent redo, then kept with a note for the
  barber (renders.needs_barber_note, truth_check, truth_passed).
- The render counts as ready when the front is done; render-status hands
  out the sides as they arrive, and the reveal lets the client turn the new
  cut with the W47 slider (the reveal itself is still the placeholder W21).
- Test on Bryan's twin (Crew Cut, mid fade, coily), three renders:
  1. one side came out much shorter on top than the front; the check then
     only compared with the before picture. Added: the side is also checked
     against the finished front ("same cut").
  2. one side came out mirrored. Added: the side's direction is read first
     and written into the instructions.
  3. all three angles right way round and the same cut.
- Known weak spot: the vision models used for the checks answered "busy"
  (503) on 4 of 9 checks today. When the check cannot run, the picture is
  kept with a note for the barber, but the client still sees it.
- Open decision for Bryan: should a render that fails the truth check (or
  could not be checked) lose the guarantee badge? Today the badge only
  follows the feasibility gate.
- Cost: a render on the twin is 3 pictures instead of 1, plus up to 3 redos,
  plus the checks.

## 28 Sep (later): when Google is busy, and the grey leak

Full notes: `docs/HANDOFF-2026-09-28-render-reliability.md`. In short:
- The picture engine now waits up to about 10 minutes when Google is busy,
  switches to the smaller Google image AI (Gemini 3.1 Flash Image) when the
  big one stays busy, never uses Gemini 2.5, and can ask Claude to do the
  truth check once `ANTHROPIC_API_KEY` is set.
- Beard only (hair untouched) works in the lab when no example photo is used.
  Not in the app yet.
- **Open and next:** the client's hair colour must never change (Bryan). Today
  the guardrail is prompt words plus a truth check that can be skipped when the
  checker is busy, and a grey example photo leaked grey twice. Fix before
  anything else.
- The comparison picture: `docs/research/2026-09-28-goatee-backup-models.jpg`.

