# Handoff: 28 Sep 2026: renders, the goatee, Google being busy

Read this first when you pick the work up in a new chat. It says what was
built today, what is live, what was tested and what was not, and what is
next, in Bryan's order.

Earlier parts of the same day (the AI twin room, W43/W47, the cut on the
twin from three angles) are in commits `63ca38a` and `df5f156`, with notes in
`docs/specs/scan-path.md`.

---

## 1. What happened (the story in short)

1. Bryan asked for a clean shave on the cheeks and his own goatee kept and
   tidied. The picture came back with **grey hair and a looser curl**.
2. **Cause:** the test consultation (`f89aa219…`) still carried the Crew Cut
   answers from earlier testing. So the "goatee" request ran as a *full
   haircut* render, which uses an example photo from the style library. That
   example (`03-crew-cut__classic__coily_no-fade_natural-line_mid-top.jpg`)
   is a man with **salt-and-pepper grey hair and a grey beard**. The image AI
   redraws the whole picture and borrowed his grey. The truth check that
   should have caught it could not run: Google's checker was "busy".
3. Bryan's rule after that: **test first, show him, and only then change the
   app.**
4. While testing, Google's big models (Gemini 3 Pro Image, the drawer, and
   Gemini 3.8/3.5 Flash, the checkers) answered "busy, high demand" for over
   an hour. **This was not the credits.** A test with the same key got
   pictures from the smaller Google image models (paid calls that succeeded),
   so the key and the credits are fine. Only the top models were overloaded.

## 2. Decisions Bryan made today

| Decision | Status |
|---|---|
| Hair, beard, or both must be changeable separately. A client can approve a haircut and **later** ask to see a beard on **that same haircut**. | Tested in the lab; not built into the app yet |
| **#1 Wait smarter** when Google is busy (keep trying, about 10 minutes) | **Built and live** |
| **#4 Backup checker** from another company: **Anthropic (Claude)** | **Built, switched off** until Bryan adds the key |
| #3 Backup *drawer* from another company | **Rejected** by Bryan |
| **Backup drawer from Google itself**: Gemini **3.1 Flash Image** | **Built and live** |
| **Gemini 2.5 (any) is banned.** On the goatee test it airbrushed the skin, slimmed the face and left stubble. | **Enforced in code** |
| **Option 2 before shops go live:** move to Google Cloud (Vertex AI), EU region, **reserve capacity** ("provisioned throughput"), keep the public door as the second route | Written in `docs/LAUNCH-CHECKLIST.md` (commit `558e70e`) |
| **Fix the grey leak next.** Bryan: "the colour of the user's hair must never change, whatever the colour of the reference. Same for every other aspect we listed." | **Top of the to-do list. Not built.** |

## 3. What is live on Supabase right now

| Piece | Version | What changed today |
|---|---|---|
| `hair-transfer` (the picture engine) | **v18** | Patience when busy, relay to fresh jobs, backup artist, 2.5 ban, Claude backup checker (off without a key), goatee beard words |
| `render-status` (door 6) | v3 | Says `waiting_on_google: true` while the engine is waiting on Google |
| `request-render` (door 5) | v5 | A running render counts as stuck only after **12 minutes** (it was 3) |
| Migration `renders_busy_at` | applied | New column `renders.busy_at` |
| `edit-lab` | v10 | **Test-only tool. Not part of the app. Delete before launch** (on the launch checklist) |

Source for all of these is in `consultation-app/supabase/functions/…` and
`…/migrations/20260928b_renders_busy_at.sql`, saved and committed today.

### How the picture engine behaves now (hair-transfer v18)

- **Patience (`patient.ts`).** When Google answers "busy" (503, 429, 5xx or
  no answer in time), ask again every 8 seconds. When a job's 150 seconds are
  nearly used up, hand the same picture to a **fresh job** ("relay"). There
  are up to 9 fresh jobs, about ten minutes in all. A real refusal (a bad
  picture, a blocked request) is never retried. After ten minutes the view
  fails with the error `google_busy: …`.
- **Backup artist.** In each job, the big artist (`gemini-3-pro-image`) is
  asked for about 40 seconds. If it is still busy, the **backup artist
  (`gemini-3.1-flash-image`)** draws instead. The render row's `model` then
  reads `gemini-3.1-flash-image (backup)`, and every truth-check entry has
  `artist`. Settings: `GEMINI_IMAGE_MODEL`, `GEMINI_BACKUP_IMAGE_MODEL`.
- **Ban.** Any model name containing `gemini-2.5` is ignored, for the
  artists and the checkers alike.
- **Backup checker.** If Google's checker is busy on its first round, the
  same questions and the same pass rule go to Claude (`claude-sonnet-5`,
  setting `CLAUDE_CHECK_MODEL`). It does nothing until the secret
  `ANTHROPIC_API_KEY` exists. It skips pictures over about 3.7 MB.
- **The app** (Wait and Reveal screens) shows one calm line while waiting:
  *"The picture service is busy right now. We keep trying for up to ten
  minutes. Your answers and your brief are safe."* The Wait screen gives up
  after 12 minutes (it was 3).
  **This line is a draft.** It did not go through the widget method, so
  Bryan may want to pick the wording.

## 4. What was tested, and what was not

| Test | Result |
|---|---|
| Patience with fake "busy" answers, then real ones (lab) | Waited every 8 s and handed over to fresh jobs 4 times, exactly as designed. Never saw a success *after* a busy spell, because Google stayed down |
| Diagnosis: credits or overload? | Overload. The key works; 3.1 Flash Image and 2.5 Flash Image both drew pictures; 3 Pro Image and 3.8/3.5 Flash all answered "busy" |
| **Beard only (goatee) on Bryan's approved Crew Cut, no example photo** (lab, tags `beard3`/`beard4`) | **3.1 Flash Image: hair untouched (dark, same curl, same shape), cheeks shaved, goatee kept from all 3 angles.** 2.5 Flash Image: half resolution, airbrushed, slimmer face, stubble left → banned. Sheet sent to Bryan: `goatee-backup-models.jpg` |
| **Live engine, real render `068af9b0-4f96-4531-ab7c-9d9039aaa973`** (Crew Cut + goatee on the twin, while 3 Pro was busy) | All 3 angles drawn by the backup artist, about 4½ min. Only one check ran (side_b, Gemini 3.8 Flash): **grey added to the hair** and **faces the wrong way**. The other two could not be checked (no Claude key, Google busy). **Bryan has not seen these pictures yet**: the link to his computer dropped. Show him first thing |
| Claude backup checker | **Not tested.** Needs the key |

Test data: the test consultation `f89aa219-7b48-4c7f-bd33-10d18c07c33d`
has used its 4 good renders (and 7 of its 8 attempts). The door will refuse
new renders there. The lab tool can send an order straight to the engine
(`forward: "hair-transfer"`), which bypasses the door; that is how
`068af9b0` was made.

## 5. The grey leak: what the guardrail really is today

Bryan believed there was a guardrail that the client's hair colour can
never change. There is one, but it is **words plus a check, not a lock**:

1. **In the prompt** (`build-request.ts`): `COLOUR_LOCK` ("Keep exactly
   the same hair colour and the same grey. Do not recolour it."),
   `REFERENCE_FENCE` ("Take NOTHING from IMAGE 2 except the shape and length
   of the haircut. Do not copy that person's … hair colour, hair texture,
   beard…"), and `TEXTURE_KEEP` / `ANTI_FLATTEN`. The AI usually obeys, but
   not always. It disobeyed twice today, both times with the grey example
   photo.
2. **The example photo is cropped** to its top 55% (`cropToHair`). That
   removes most of the grey beard, **but not the grey hair**.
3. **The truth check** asks `colour_changed` and `texture_changed`. It
   catches the problem **only when it runs**. When it fails: one redo, then
   the picture is **kept with a note for the barber and still shown to the
   client**. When the checker is busy, nothing is caught at all.

So the rule Bryan wants ("never, whatever the reference") is not
guaranteed today. The fix is next and **nothing is built yet**. Ideas to
bring to Bryan, one at a time, tested first:

- **Match the example to the client.** Tag style-library photos with hair
  colour (and grey), and have `pick_style_reference` never pick an example
  whose colour or grey differs from the client's (from the reading). Also
  replace or retag the grey Crew Cut example.
- **Take colour away from the example.** For example, send a darkened or
  outline-only version, so there is no colour to copy. This needs a test:
  it may also weaken the shape.
- **A colour check that never gets "busy".** Compare the colour of the hair
  area before and after with plain arithmetic in our own code, with no AI.
  It always runs, even when every AI is down.
- **Put the reading's colour into words** ("his hair is jet black with no
  grey").
- **Decide what happens when the colour check fails**: redo with the other
  artist, or never show that picture to the client as their cut.

## 6. To do, in Bryan's order

1. **Show Bryan render `068af9b0`** (3 angles, next to his approved Crew Cut
   `3422dd56`).
2. **Fix the grey leak** (section 5). Test first, show him, then build.
3. **Beard-only mode in the app** (hair untouched), plus "haircut first,
   beard later on the same haircut". Proven in the lab with 3.1 Flash Image
   and **no example photo**. Needs: a render mode, a source that can be an
   approved render (not only the twin), and a UI choice (widget method).
4. **Bryan: create the Anthropic key** (platform.claude.com → API key) and
   add it in Supabase → Edge Functions → Secrets as `ANTHROPIC_API_KEY`.
   Then test the Claude checker on the goatee pictures.
5. **The mirrored side.** `readPose` (which way the nose points) uses
   Gemini Flash only. When Google is busy there are no direction words and
   sides come out mirrored. Give it the Claude backup too.
6. **The AI twin maker (`twin-kitchen`, `make-twin`) has none of today's
   protection yet**: no patience, no backup artist, no 2.5 ban. Same
   treatment.
7. **Open decision (Bryan):** should a render whose truth check failed, or
   could not run, lose the guarantee badge? Recommended: yes.
8. **Before launch:** Google Cloud + reserved capacity (launch checklist);
   delete `edit-lab`, `gemini-test`, `dev-seed`, `tryon`.
9. Older items: W44 (keep the twin?), merge the two chat `Message`
   components, the reveal design (W21).

## 7. Things a new chat needs to know to work here

- Supabase project `eusyxqguevqgrnnjqhut`. The cloud sandbox cannot reach
  `supabase.co` directly. Call functions through SQL
  (`net.http_post` / `net.http_get`, then read `net._http_response`).
  Read logs with `query_logs` (`function_logs`, `LAB …` lines).
- The `renders` bucket accepts images only: a JSON upload fails silently.
  Image resizing on storage links does **not** work on this plan (you get
  the full picture back).
- To look at pictures: get signed links (the lab tool's `?sign=` route),
  then compose them on a canvas in the browser pane (tab "seed" at the
  Supabase origin), return a data URL, and decode it in Python.
- Deploying the engine means sending all four files (`index.ts`,
  `patient.ts`, `build-request.ts`, `styles.ts`). Doors deploy with
  `../_shared/door.ts`.
- Git: commit on Bryan's machine, don't push (Bryan pushes).
