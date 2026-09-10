# PleromaOS — AI Try-On → Real App Handoff

**Written:** 10 Sep 2026
**Purpose:** full context for a fresh chat. Read this top to bottom before touching anything.

---

## 0. Where we are in one paragraph

The AI hair-transfer feature has been rebuilt from scratch and **works**. It runs as a
Supabase edge function calling Gemini directly, using a two-image method (client photo +
haircut reference photo). It is deployed and testable from a phone at a code-gated page
on the Netlify-hosted landing site. The next job is to stop testing it in a bare test rig
and instead **wire it into the real visual quiz** (`quiz-prototype.html`), so the whole
client journey — quiz → photo → AI render → brief — runs on a phone. That work has not
started. Nothing about the render pipeline needs to change to do it.

---

## 1. Repo, paths, hosting

| Thing | Value |
|---|---|
| Repo (the real one) | `/Users/Bryan/BAVE Holdings Corp/Pleroma` |
| Git remote | `https://github.com/PleromaOS/pleroma.git`, branch `main` |
| Hosting | **Netlify**, deploying from `product/landing-site/` |
| Live site | https://pleromaos.nl |
| Test rig (live) | `product/landing-site/tryon.html` — gated by code `PLEROMA26`, `noindex,nofollow` |
| The quiz | `product/consultation-app/quiz-prototype.html` (52 KB, self-contained) |
| Supabase project | `eusyxqguevqgrnnjqhut` |

### ⚠️ Wrong-folder trap
There is a **stale duplicate** at `/Users/Bryan/Pleroma` containing 33 old,
un-normalised style reference files. The real repo has 66 correctly-named ones. Both
folders are connected to the desktop bridge and both are named "Pleroma". This cost us
real time once already. **Always work in `BAVE Holdings Corp/Pleroma`.**

### Git state as of writing
- Pushed: `f77808c`, `b1284cc`
- **Unpushed: `d182006`** ("Try-on: in-page lightbox instead of new-tab links") — push this.
- Large amount of untracked work in the tree (`brand/style-library/`,
  `consultation-app/supabase/`, `product/consultation-app/`, `docs/specs/`, plus a pile of
  unrelated SMS/campaign scripts). Decide what gets committed before adding more.
- Git occasionally warns `unable to unlink .git/index.lock: Operation not permitted` over
  the device bridge. Commits still land, but if git misbehaves, that's why.

---

## 2. How the render works (do not redesign this)

### The core finding
**Words alone cannot preserve hair texture.** Naming a style ("a modern pompadour") makes
the model render its stock archetype — which is almost always straight-haired — and treat
any preservation clause as a suggestion.

The fix is **two images**:
- **IMAGE 1** = the client's photo → the model keeps face, hair texture, hair colour from this
- **IMAGE 2** = a haircut reference photo → the model takes *only shape and length* from this

Verified: a curly auburn client given a reference of a straight black-haired man kept his
own curls and his own colour while taking the cut. Every text-only attempt failed that case.

### Two rules that are load-bearing
1. **Prompt order matters.** Preservation must come *before* the change instruction.
   Leading with the style name reintroduces the stock-archetype failure.
2. **Texture is an INPUT-side axis, never an instruction.** Texture selects *which reference
   photo is picked*. It must never be phrased to the model as "make his hair curly" —
   that was an early bug that actively changed the client's texture.

   The same logic extends to the avatar branch (§6 step 2): the avatar the client picks
   *becomes* IMAGE 1, so its texture is now the texture being preserved. Letting them pick
   an avatar whose hair doesn't match theirs silently reintroduces the exact bug — which is
   why the avatar picker must be filtered by the `texture` answer, not left as free choice.

### The PRESERVE/CHANGE tension
Both sides have failed in production. Strengthen identity preservation too far and the
haircut stops changing (this happened — the Caesar came back with only the fade applied).
Strengthen the change clause too far and the face drifts. `CUT_EMPHASIS` and
`IDENTITY_LOCK` in `build-request.ts` are the current balance point. **Change one, retest
both.**

---

## 3. What is deployed

### Edge function `hair-transfer` — version 9, `verify_jwt: false`
Three files: `index.ts`, `build-request.ts`, `quiz-data.json`.

`build-request.ts` is **pure** — no network, no Supabase, no side effects. A bad render is
always traceable to deterministic input. Keep it that way.

Non-negotiable prompt clauses (all in `build-request.ts`):
- `IDENTITY_LOCK` — face, jaw width, body weight, age, head angle, framing, lighting, background
- `CUT_EMPHASIS` — the hair on top MUST actually change; cut shorter if currently longer
- `SINGLE_IMAGE` — one photograph, one man; no grid/collage/split/before-after
- `COLOUR_LOCK`, `TEXTURE_KEEP`, `ANTI_FLATTEN`, `REFERENCE_FENCE` (take nothing from IMAGE 2 but shape)

Key mechanics in `index.ts`:
- `cropToHair()` — crops the reference to the top 55%, to stop beard/stubble bleeding across
- `nearestRatio()` — pins output aspect ratio to the input, an anti-collage measure
- collage guard — if `outAspect > srcAspect * 1.4`, retry once
- `callGemini` takes the **first** image part (older code wrongly kept the last)
- `generationConfig: { imageConfig: { imageSize: "2K", aspectRatio: ratio } }`
- background render via `EdgeRuntime.waitUntil()` — a render takes 25–35 s, past the safe
  request window, so it's submit-and-poll

⚠️ **The copy of `index.ts` in this session's scratch (`/home/claude/edge/`) is STALE** —
it's the old Higgsfield/seedream version. Pull the real one with
`supabase functions download hair-transfer` before editing.

### Model
`gemini-3-pro-image` ("Nano Banana Pro"), called direct via the Gemini API.
This is the model Mustafa's original working version used. Billing is on.

⚠️ **Secret name matters:** it must be `GEMINI_API_KEY`. It was once stored as
`gemini api` (lowercase, space) which yielded an empty key and `API_KEY_INVALID`.
We deliberately did **not** add a fallback for the typo'd name.

### Database (project `eusyxqguevqgrnnjqhut`)
- `renders` — one row per render, `expires_at` 24 h, RLS service_role only
- `style_references` — 66 rows, the reference index
- `consultations`, `feedback` — pre-existing

Function `pick_style_reference(p_style_id, p_texture, p_sides, p_fade_height)` scores:
`texture match +6`, `texture unknown +1`, **`texture mismatch −10`**, `sides +3`,
`fade_height +2`. Returns nothing below zero — **a wrong-texture reference is worse than
no reference**, because it hands the model the exact straight-haired archetype we're
avoiding.

### Buckets
`client-photos` (private, GDPR), `renders` (public), `style-library` (public, 66 files), `app` (public).

---

## 4. Known problems

### 🔴 The reference library has a texture hole
Actual counts in `style_references`:

| texture | refs |
|---|---|
| straight-fine | 36 |
| straight-coarse | 22 |
| coily | 6 |
| wavy | **2** |
| curly | **0** |

**Zero curly references exist**, and curly is permitted on 14 of 21 styles. Wavy has two.
This is the single biggest quality limiter, and it is a *content* problem, not a code
problem — no prompt change fixes it. Collecting curly and wavy reference photos is the
highest-leverage non-engineering task on the list.

### 🟠 Face slimming — confirmed, not verified fixed
Narrower jaw/neck observed on three subjects including Bryan himself. Mitigated by
explicit width/weight/age wording in `IDENTITY_LOCK`. **Not yet retested since that
change.** Needs a deliberate A/B on a heavier-set subject.

### 🟠 Reference contamination beyond the haircut
A clean-shaven client given a stubbled reference came back with stubble, despite the
prompt forbidding it. `cropToHair()` (top 55%) is the mitigation, not a cure.

---

## 5. Things that have already been tried and failed — do not repeat

| Attempt | Why it failed |
|---|---|
| Text-only prompts describing the cut | Model substitutes its stock straight-haired archetype |
| Injecting texture as an instruction ("he has curly hair") | Actively *changed* the client's texture |
| Seedream `is_inpaint: true` | There is no mask parameter — it's prompt-driven, guarantees nothing |
| Hosting HTML in Supabase Storage | Serves as `text/plain` |
| Hosting HTML via an edge function | Gateway rewrites `content-type` to `text/plain` and adds a `sandbox` CSP |
| Matching references by folder name in JS | `variations` are `guard-1`, `classic` — they carry no texture. Index moved to Postgres. |
| Base64 image transport through SQL | Truncates. Twice. Use storage + signed URLs. |
| `<a href="data:...">` for "tap to enlarge" | Browsers block top-level navigation to `data:` URLs. Use an in-page lightbox. |

Also worth knowing: **two claims I made were wrong and Bryan caught both** — the render
"taking 20 minutes" (actual DB times: 25 s, 27 s, 31 s; the rest was orchestration
overhead) and the output "being pixelated" (that was my 210–300 px transport compression;
stored files are 2.3–3.0 MB PNGs at 2K). When judging output quality, **look at the stored
file, not a preview thumbnail.**

---

## 6. THE ACTUAL NEXT TASK

Bryan's words:

> "what i want to do is for us to work on what will eventually be the real app for
> pleromaOS. but i want to be able to test it on my phone from a website the same way we
> are doing it with tryon. but instead we use the old quiz setup we used in the html and
> we keep the ai generation function working smooth. once we have that together then we
> can do the easy from the photo scan."

So: **the quiz becomes the app. The try-on rig gets retired.**

### What `quiz-prototype.html` already is
Self-contained, 52 KB, no external images. Google Fonts (Instrument Serif, Inter,
JetBrains Mono). Dark palette `--bg:#141210`, `--gold:#c9a96e`.

- Quiz data fully inlined at **line 222**: `const D = {...}` — textures, skinTones,
  lengthCategories, screens, fadeTypes, similarFamilies, 21 styles with presetAnswers
- 28 screens: `S0, S0b, S0c, SR, A1, A1b, S1, S1b, S1c, S2, S3, S4, SE, S5–S9, S10–S16c, P1, S17, S18`
- State: `const S = {}`, `let route`, `let hist`, `let cur`, `let skipped`, `let editing`
- Routing: line 335–336 `S16c:() => go('P1'), P1: () => go('S17'),`
- Progress: line 405 `const after = { P1:3, S17:2, S18:1, DONE:0 };`
- **`P1` is the preview screen** — renderer at line 583, "Looks right" CTA at line 592
  (`next('P1')`). This is a placeholder. **The AI render slots in here.**

The field names already match: `build-request.ts` was written against `quiz-data.json`,
which is the same data inlined in the quiz. No translation layer needed.

### Steps

1. **Copy** `product/consultation-app/quiz-prototype.html` →
   `product/landing-site/app.html`. Add the same code gate as `tryon.html`
   (`var CODE = "PLEROMA26";`) and `noindex,nofollow`.
   Keep `quiz-prototype.html` as the design source, or make the landing copy canonical —
   pick one and say so, don't let them drift.

2. **Add the "how do you want to see it?" step — LAST, just before `P1`.**
   The quiz currently has **no photo step at all**. Bryan has decided the placement and
   the shape of it (decided 10 Sep, not up for re-litigation):

   > "photo step goes last. they need to choose whether they want to see their haircut on
   > their own face — to have a more accurate view — or on an avatar. then based on the
   > answer it prompts them to either take the photos or to choose an avatar that looks
   > closest to them and then the haircut will be generated on the avatar."

   So it is a **fork, not a single step**:

   ```
   S16c → [P0: how do you want to see it?]
            ├─ "On my own face"  → P0a: photo capture  ──┐
            └─ "On an avatar"    → P0b: avatar picker  ──┴→ P1 (render + preview) → S17
   ```

   - **P0** — one screen, two choices. Frame the own-face option as *the more accurate
     one*, because it is, and that is the honest nudge toward the better result.
   - **P0a — photo capture.** For now: single front photo, same client-side downscale as
     `tryon.html` (1280 px / 0.88 JPEG). The guided multi-photo capture is still deferred
     (see below).
   - **P0b — avatar picker.** Pick the avatar that looks closest to them. The obvious
     narrowing axes are the ones the quiz *already asked*: `texture` (S0b) and `skinTone`
     (S0c). Filter the grid by those rather than showing every avatar — it makes the
     choice small and it reuses answers already given.
   - Both branches converge on `P1`, which renders identically. From the edge function's
     point of view an avatar is just IMAGE 1 — **no change to `hair-transfer` is needed**.

   **🔴 New dependency this creates: the avatar set does not exist yet.**
   Nothing in the repo is an avatar library. Someone has to decide what an avatar *is*
   (photoreal generated faces? illustrated?) and produce a set that covers the texture ×
   skin-tone grid. Treat this as a blocking content task alongside the curly reference
   gap (§4) — and note it has the *same shape* as that gap: if the avatar set is
   texture-thin, the avatar branch inherits exactly the failure mode we just spent a day
   fixing.

   Photoreal is the safer bet: the whole pipeline is tuned on photographs, and an
   illustrated avatar as IMAGE 1 would be off-distribution for a model asked to preserve
   "skin texture" and "lighting". Worth confirming with Bryan before commissioning a set.

   GDPR note: this design is also the better privacy posture, and by accident of ordering
   rather than by compromise. A client who bails before the last step never hands over a
   face photo, and a client who picks the avatar branch never hands one over at all.

3. **Wire `P1` to the render.** POST to
   `https://eusyxqguevqgrnnjqhut.supabase.co/functions/v1/hair-transfer`, then poll.
   Reuse from `tryon.html`: client-side downscale to 1280 px / 0.88 JPEG, and the in-page
   lightbox.

4. **Give `P1` a real waiting state.** A render is ~30 s. Not a spinner-and-hope — show
   progress, and handle failure.

5. **Degrade gracefully.** Given §4, many texture/style combinations have no reference.
   `pick_style_reference` returns nothing rather than a bad match, so `P1` must handle
   "no render available" as a normal outcome, not an error.

6. **Test on Bryan's phone.** That's the acceptance criterion — not a desktop browser.

### Deferred until the above works
- **Build the avatar set** (see step 2) — blocking for the avatar branch, but the own-face
  branch can ship and be tested first.
- Guided photo capture (the identity-verification-style face scan Bryan asked about).
  Cheap version first: oval overlay + step sequence + brightness check. MediaPipe only if
  the cheap version measurably fails.
- Three photos: front + both sides. Back is deferred — the barber shoots it in-shop.
- Women's quiz — unspecced.
- Barber-facing side — unspecced.

---

## 7. Cleanup owed before any launch

- [ ] Push `d182006`
- [ ] **Rotate the Gemini API key** — it was pasted into a chat
- [ ] **Add an anon-key check or rate limit to `hair-transfer`** — it is `verify_jwt: false`
      and publicly reachable. Anyone with the URL can spend the Gemini balance.
- [ ] Delete dev-only edge functions: `gemini-test` (v7), `dev-seed` (v7), `tryon` (v1) —
      all `verify_jwt: false`
- [ ] Remove duplicate `… (1).jpg` files from the style library
- [ ] Delete `product/landing-site/_ref_used.jpg` if present
- [ ] Retire `tryon.html` once `app.html` supersedes it

---

## 8. Where else context lives

- `CONTEXT.md` — has a full section "✅ AI HAIR TRANSFER — REBUILT AND WORKING (resolved
  Sep 10, 2026)": prompt-order finding, model decision and rejects, architecture,
  non-negotiable clauses, known defects, the two-libraries distinction, the curly gap.
- `consultation-app/supabase/README-hair-transfer.md` — API shape, required secrets
  (including the `GEMINI_API_KEY` naming warning), buckets, how to add references,
  `supabase functions download hair-transfer` instructions.
