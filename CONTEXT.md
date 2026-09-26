# PleromaOS

PleromaOS is client briefing software for salon and barbershop owners. It gives every appointment a precise brief before the client sits down, and gives the business a permanent record of every client's preferences, history, and stylist notes. The goal is to validate demand through a landing page and Design Partner Programme before building the full product.

---

> **Working rule:** nothing is built in this repository without Bryan being
> able to explain it back — what it does, what it deliberately does not do, why
> it was built this way rather than another way, and what that choice costs
> later. See `CLAUDE.md`.

## Purpose

**The core problem:** Every salon owner faces three business risks that go unaddressed — clients who leave without saying why, client knowledge that walks out with the stylist who quits, and clients who don't rebook because they fear starting over with someone new. PleromaOS fixes all three through a single structured brief per client, stored permanently in the business.

**Current stage:** Pre-product validation. The landing page (`product/landing-site/index.html`) is the primary tool — it explains the problem, shows what the product would look like through embedded UI mockups, and drives free-tier signups (freemium model, see pricing decision below).

**Validation goal:** Drive free signups ("Start free — 50 briefs/month") → dominate distribution and capture usage data → convert busy shops to paid tiers. The Design Partner Programme continues as a secondary track: a small number of hand-picked shops get Pro free in exchange for deep feedback and case studies. **Note:** the landing page's live CTA still says "book a 15-min call" and needs updating to match.

---

## Language

**Brief**:
A structured record of a client's hair preferences, specs, and visit history — captured before each appointment, stored permanently in the business. The brief is the core unit of PleromaOS.
_Avoid_: profile, form, questionnaire, consultation note

**Brief match**:
A percentage score indicating how well a stylist executed against the client's brief. Used in the retention and handoff dashboards.
_Avoid_: accuracy score, satisfaction rating (old label: "Accuracy" — removed)

**Client retention**:
Whether clients return on their expected cadence. PleromaOS surfaces who is overdue, who hasn't rebooked, and what their last brief said — so the owner can act before losing the client.
_Avoid_: churn rate, retention rate (too abstract)

**Knowledge loss**:
When a stylist leaves and takes all client preferences and history with them — because it was never stored anywhere. One of the three core pain beats.
_Avoid_: staff turnover impact, knowledge transfer

**Staff handoff**:
The moment when a client's brief transfers from a departing stylist to a new one. With PleromaOS, the new stylist sees the full brief before the first visit; the client never re-explains.
_Avoid_: staff transition, onboarding transfer

**Founding partner** (also: Design Partner):
One of 20 salons who joins PleromaOS before launch, co-builds with Bryan, and gets in free forever.
_Avoid_: early adopter, beta user, pilot customer

**Design Partner Programme**:
The pre-launch initiative where Bryan personally calls every owner who books a 15-min call, selects 20, and co-builds the product with them. The primary CTA on the landing page.
_Avoid_: waitlist, beta programme, application process

**Salon owner**:
The primary user and buyer. The person who cares about retention, staff turnover, and client knowledge — not just the craft. Distinct from stylist.
_Avoid_: client (reserved for the end customer), manager

**Stylist**:
The person who performs the service. May or may not be the salon owner. The stylist uses the brief before each appointment.
_Avoid_: barber (too narrow), hairdresser (less precise in B2B)

**Client**:
The end customer — the person getting their hair done. Not a PleromaOS user at the point of the brief (they interact during brief collection only).
_Avoid_: customer (reserved for the salon owner as buyer), patient

**Consultation**:
The client-facing flow that captures what a client wants and shows them the result on their own face, producing a brief and a render. Run by a client who has not necessarily chosen the shop yet. This is the acquisition surface: shops advertise a free consultation instead of advertising haircuts.
_Avoid_: quiz (internal only), demo, trial, preview flow

**Render**:
The AI-generated image showing the briefed haircut on the client's own photo.
_Avoid_: preview, mockup, simulation, result

**Render confirmation**:
The client confirming that the render shows their face, their hair, and the haircut they actually want. Client-side half of the countersign.
_Avoid_: approval, sign-off, accept

**Feasibility gate**:
The automatic check that decides whether a render is eligible to carry the guarantee. Evaluates the gap between current and goal state, texture compatibility, and styling-effort mismatch. A render that fails the gate is still shown, framed as a longer journey with a plan, but carries no guarantee.
_Avoid_: validation, eligibility check, screening

**Feasibility check**:
The stylist reviewing the render against the client's actual head, in person, before cutting. Where something is not executable the stylist amends the brief, explains why, and offers alternatives. Professional half of the countersign.
_Avoid_: review, approval, verification

**Guaranteed brief**:
A brief that has passed the feasibility gate and been confirmed by both the client and the stylist. Only a guaranteed brief carries the result guarantee. A brief without both confirmations is an ordinary brief.
_Avoid_: signed brief, contract, locked brief

**Result guarantee**:
The shop's promise that the haircut will match the guaranteed brief, or the client does not pay. Funded by the shop, never by PleromaOS. It can only be triggered after the stylist has personally confirmed the result was executable, so it is a failure to deliver something the shop inspected and agreed to.
_Avoid_: money-back guarantee (in product copy), warranty, refund policy

**Booking handoff**:
How a consultation becomes an appointment. At the end of the consultation the client is sent straight into the shop's own booking system by deep link, with the service and barber pre-selected where that booking system's URL supports it. The shop's system keeps owning availability, so PleromaOS never holds a calendar and cannot double-book. The brief is matched to the resulting booking by email address, through the existing forwarded-confirmation mechanism.
_Avoid_: booking integration, connector, scheduling

**Consultation pass**:
What a client receives when the shop takes walk-ins and has no online booking. The render, the brief and a code, sent by email. The client shows it in the shop and the stylist pulls up the guaranteed brief from the code. The pass is the close for walk-in shops.
_Avoid_: voucher, coupon, ticket

**Unbooked render follow-up**:
The message sent 24 hours after a consultation that produced a render but no booking. Shows the client their own render again and returns them to the booking handoff. This is where hesitant leads are recovered, and it ships in v1.
_Avoid_: reminder, nurture, drip, abandoned cart

**Shop entry**:
A consultation started from the shop's QR code by someone already in the building. Email is asked at the end, after the client has seen their brief, exactly as previously resolved. The client selects their barber.
_Avoid_: in-store flow, walk-in flow

**Campaign entry**:
A consultation started from an advertisement by someone who has not chosen the shop yet. Email is asked BEFORE the render, because the render is what the shop is paying for and it is the reward for the email. No barber is selected; the shop assigns whoever has the slot.
_Avoid_: ad funnel, cold flow, lead flow

**Consultation capacity**:
How many consultations a shop may run in a month. Metered separately from briefs, because consultations are advertising volume and briefs are appointment volume; the two scale for different reasons and are paid for out of different budgets. The free tier carries a small consultation allowance so a campaign cannot be pointed at an unmetered renderer.
_Avoid_: credits, render quota, lead limit

**Texture coverage**:
Whether the style library holds reference photos for a client's hair texture. A texture with no coverage produces a materially weaker render, so it is one of the feasibility gate's checks: no coverage means no guarantee badge. The client still receives the render and the full flow. Coverage switches the badge on per texture as references are collected, with no code change.
_Avoid_: library gap, missing references

**Shop**:
The tenant. A barbershop or salon that has signed up. Every client, consultation, brief, visit, render and staff member belongs to exactly one shop, and nothing is shared between shops. The shop carries its own QR slug, booking link, plan and consultation allowance.
_Avoid_: tenant, account, organisation, venue

**Visit**:
One expected appearance of a client at the shop, whatever its outcome: booked, arrived, completed, or no-show. A client who books and never turns up is still a visit, because a free-offer funnel is judged partly on how many of those there are.
_Avoid_: appointment, booking, session

**Staff**:
A person who works at the shop. Staff are never deleted, only marked as former with a leaving date, because past visits stay credited to whoever performed them and are never reassigned.
_Avoid_: employee, team member, user (too broad)

**Offer validity**:
How long after a consultation the client can still book and have the guarantee attach. Fourteen days, for an honest reason: the brief describes their hair as it is today, and after that it describes a head that no longer exists. Distinct from the claim window.
_Avoid_: expiry, deadline, offer window

**Claim window**:
When the client may claim the result did not match. In the chair, before leaving, naming which line of the brief was missed. It closes when they walk out. Distinct from offer validity.
_Avoid_: refund period, dispute window, cooling off

**Leakage**:
A client completing a consultation at one shop's expense and taking the render to a different barber. It cannot be prevented, only made unattractive: the render carries no guarantee unless that shop's stylist countersigns it. Measured as consultation-to-visit conversion per shop.
_Avoid_: theft, abuse, churn

**Consultation allowance**:
How many consultations a shop may run in a calendar month on its plan. It exists because every render is a real charge on PleromaOS, and a shop running advertisements generates consultations by the hundred. One is consumed at the first successful render — the moment a cost is actually incurred — so abandoned consultations and failed renders cost the shop nothing. Re-renders inside the same consultation are free, capped at three.
_Avoid_: credits, quota, limit, usage

**Working render**:
The clean, unmarked render. What the stylist works from, because the image is the work instruction and anything laid over it degrades the instruction.
_Avoid_: master, original, raw

**Shareable render**:
The client's copy of the render, carrying a PleromaOS and shop lockup in a bottom strip, never across the face. Generated at delivery from the working render. It is made to be shared, so the mark stays small enough that people still share it.
_Avoid_: watermarked copy, export, social version

**Assessment**:
One person's scoring of how closely a finished haircut matched the brief. Each visit collects two — the client's and the stylist's — and brief match is computed from them. An assessment always has an author; a score without one cannot be compared, and comparison is what makes a coaching flag possible.
_Avoid_: rating, review, feedback, score

**Outreach**:
Automated messages sent to clients whose stylist has left — letting them know their new stylist already has their full brief.
_Avoid_: notifications, messages, campaign

---

## Relationships

- A **Salon owner** manages one or more **Stylists**
- Each **Client** has one persistent **Brief** stored in the business — not tied to any one stylist
- A **Brief** is updated after each appointment with new specs and notes
- **Brief match** is calculated per visit, per stylist
- When a **Stylist** leaves, **Outreach** is triggered automatically to all their **Clients**
- A **Founding partner** is a **Salon owner** who joins the **Design Partner Programme**

---

## Architecture (landing page)

**File:** `product/landing-site/index.html`
Single self-contained HTML file. Vanilla JS · snap-scroll sections · EN/NL i18n via `T.en`/`T.nl` · Supabase (waitlist form).

**Section order:**
1. `s-hook` — Hero: headline + CTA + social proof (8 salon owners in conversation)
2. Chapter marker — "Three things that cost you clients."
3. `s-pain-0` — Client retention diagram
4. `s-pain-1` — Client profile / knowledge diagram (Women/Men toggle)
5. `s-pain-2` — Staff handoff diagram
6. `reveal` — "Introducing PleromaOS" pivot moment
7. `s-live` — Design Partner Programme CTA
8. `s-cta` — Waitlist fallback form (for people not ready to book a call)

**Design tokens:**
- `--gold: #C9A96E` — primary brand colour: OS wordmark, emphasis, high-weight copy
- `--dark: #1a1816` — all dark section backgrounds
- `--bg: #ede8e0` — warm off-white: light sections, copy on dark
- `--teal: #2d4a35` — secondary accent: trust pills, section kickers

**Wordmark rule:** "Pleroma" — capital P, rest lowercase. "OS" — all caps, gold (#C9A96E). No space between. Never "PLEROMAOS", never "Pleroma OS".

**i18n pattern:** `data-en` / `data-nl` on all user-facing strings. Auto-detected from browser (`navigator.language`), saved to `localStorage`. Manual pill toggle in nav.

**Scroll controller:** `_sections` array drives snap-scroll via `goSection(idx)`. Progress dots are wired to the controller. Never call `scrollIntoView()` directly — it breaks `curIdx` sync.

---

## UI Mockups (canonical reference)

The diagrams embedded in the landing page are the canonical UI reference for what PleromaOS looks like. Extracted as standalone self-contained files in `brand/mockups/from-landing/`:

| File | What it shows |
|---|---|
| `01_client-retention.html` | Retention dashboard — at-risk, watch, on-track clients with brief match %, overdue signals, last visit notes |
| `02_client-profile.html` | Client profile card — name, visit history, hair specs, technique, colour, visual reference slot. Women/Men toggle. |
| `03_staff-handoff.html` | Staff handoff — Maya → Jayden transition, auto-outreach stats, brief match before/after across first Jayden visits |

These are illustrative UI concepts communicating product value. Not backed by a working system yet.

**Previous mockups** (`brand/mockups/01_splash.png`, `02_question.png`, `03_results.png`) were placeholder phone screens from an earlier product direction (visual quiz / mannequin selection flow). The landing page diagrams above supersede them as the primary design reference.

---

## Key Decisions Made

**Design Partner Programme instead of waitlist**
A waitlist implies passive waiting. Bryan personally calls everyone who books. This filters for serious owners, signals commitment, and doubles as user research. 20 selected partners co-build and get in free. The rest go on a standard waitlist.

**"Client briefing software" as the category**
Salon owners understand "brief" from the context of a client telling their stylist what they want. The category connects to a familiar concept without inventing jargon. It positions PleromaOS as a professional tool, not a consumer app.

**Three pain beats before product features**
Features are only meaningful once you understand the problem. The page leads with the three business risks before showing what the product does. Each pain beat shows the solution state in a UI mockup — not the problem state.

**EN/NL bilingual from day one**
Initial market is Dutch salon owners. Bryan is based in Amsterdam. Site auto-detects browser language and defaults to Dutch when appropriate. References to "Netherlands" removed from copy to avoid limiting perceived international scope.

**Snap-scroll sections**
The landing page is a linear narrative — each section has one job. Snap-scroll enforces reading order and creates a cinematic feel matching the premium positioning.

**No testimonials yet**
The product doesn't exist. The 8 salon owners in the hero social proof are real people in early conversations, not paying customers. Testimonials come after the Design Partner Programme produces real feedback.

**"Brief match" instead of "Accuracy"**
"Accuracy" implies something objective. "Brief match" describes what's actually tracked: how closely the result aligned with what was in the client's brief. More honest and specific. "Accuracy" label was removed from all copy.

**CTA is a call, not a sign-up**
Signing up implies a product exists. A 15-min call is honest — it's a conversation, not an onboarding. It gives Bryan control over who enters the programme and surfaces real objections early. The urgency copy reads: "We speak with everyone who books. We choose 20. If that's you, you'll hear from us personally."

**Paid social traffic (Instagram/Facebook/LinkedIn) justifies the intro animation**
People who click from paid ads have already seen the brand name and hook. The 3-second brand intro is a brand moment, not a bounce trap, for warm traffic. Cold search traffic would benefit from UTM-based intro suppression (not yet implemented — future work).

---

## Flagged Ambiguities

- **"Partner"** was used for both the Calendly booking CTA and the founding salon concept — resolved: "Design Partner" = the salon, "partner programme" = the initiative.
- **"Application"** was briefly considered for the CTA — rejected: it frames the programme as selective in a gatekeeping way, and no other part of the site uses that word. The experience is "we talk to everyone, we choose 20."
- **"Client" in B2B context** — in PleromaOS, "client" always means the end customer (person getting their hair done). The salon owner is "salon owner" or "you" in copy — never "client."
- **"Accuracy" vs "Brief match"** — resolved: "Brief match" everywhere. "Accuracy" was the old label, now removed from all copy and UI.

---

## Other Tools & Systems

**CRM / Outreach Tracker**
File: `pleroma-crm.html` — functional.
- Apollo.io CSV import (maps: First Name, Last Name, Company, Email, Phone, LinkedIn URL, City, Country, Industry)
- Generic CSV fallback
- Reply logging per lead (channel, date, outcome, notes)
- Auto-status update based on reply outcome
- Waitlist modal with business type: Barbershop / Women's Hair Salon / Mixed Unisex Salon
- Full lead detail panel with reply history

**Supabase**
Waitlist form on the landing page submits to Supabase. The CRM auto-loads from the same table. Project is live.

**Netlify + Domain**
Landing page deployed to `pleromaos.nl` via Netlify. Auto-deploys on `git push` to the connected repo branch. Pushing `CONTEXT.md`, `brand/`, or other internal files does not affect the live site — only `product/landing-site/index.html` and its assets trigger visible changes.

**Google Maps Scraper**
File: `scrape_nl_salons.py` — scrapes barbershops and salons across the Netherlands for outreach leads.

---

## Consultation App (earlier prototype — partially revived Aug 24, 2026)

An earlier product direction built a visual quiz prototype where clients tap through mannequin images to communicate what they want. Its core ideas were revived and reframed in the two-route quiz decision (see July 17 carry-over resolutions): "Quick Pick" became the **"Choose a famous style"** preset route, and the "AI clone" became the **selfie preview + persistent clone** at the end of both routes. The mannequin/haircut image assets below are directly relevant again for the preset gallery and avatar preview.

**Key assets built:**
- Male base mannequins (light/medium/deep) — `consultation-app/app/images/mannequins/base-characters/`
- Male haircut overlays HC-001–HC-017, multiple skin tones × fade levels — `consultation-app/app/images/haircuts/`
- Texture and color quiz images — `consultation-app/app/images/quiz/`
- Female haircut images (curtain bangs, lob, classic bob, long layers, etc.) — `consultation-app/app/images/haircuts/female/`
- App shell HTML — `consultation-app/app/index.html` (screens exist, app logic incomplete)

**Male mannequin origin:** Generated with Higgsfield Nano Banana Pro model. 3D render aesthetic, neutral gray background, bare shoulders, studio lighting. This is the model to use for any future mannequin generation.

**Outreach lead source:** Apollo.io. Top targets: barbershops in Amsterdam, Rotterdam, Den Haag, Utrecht.

---

## Brief Structure — Two Independent Axes (resolved)

A brief is composed of two independent choices that combine freely:

**TOP axis** — the style on top of the head. Client picks a style family, then configures the specifics of that style (length, texture, finish variant). Examples: Crop, Quiff, Wolf Cut, Edgar Cut, Slick Back, Pompadour, Buzz, Comb Over, Curtains, Mullet, Afro.

**SIDES axis** — what happens to the sides and back. Client picks a sides treatment independently of the top. Examples: Low Taper, Mid Fade, High Fade, Skin Fade, Burst Fade, Undercut (hard line contrast), Natural/Long (sides left untouched).

These are NOT linked — any top can combine with any sides treatment (within physical constraints). Burst Fade, Low Taper, High Taper, Skin Fade, and Undercut are SIDES configurations, not top style families.

**Returning clients** often skip the top selection entirely and only refresh their sides. The brief must support this: "Keep my top the same, just update the sides."

**Non-negotiable professional rule:** The back is always cut slightly lower than the sides on a fade. The brief must enforce this — no configuration should produce a brief where back height equals or exceeds side height.

---

## Male Haircut Families — Top Axis (resolved, based on NL market research)

Sourced from Dutch barbershop trends 2023–2026. These are the style families for the TOP of a male brief.

| Family | Styles covered | Notes |
|---|---|---|
| Buzz/Crew | Buzz Cut, Crew Cut, Caesar | All-over short clipper cuts |
| Crop | Textured Crop | Most requested in NL 2025–2026 |
| Pompadour | Classic, Modern (with fade) | Volume-forward, swept back |
| Quiff | — | **MISSING from haircuts.json** — top NL trend, volume forward |
| Slick Back | — | **MISSING** — partially in HC-007, needs own family |
| Edgar Cut | — | **MISSING** — blunt horizontal fringe + high fade; huge in NL barbershops |
| Wolf Cut | — | **MISSING** — shaggy layered longer cut, growing 2024–2026 |
| Comb Over | Classic, Comb Over Fade | Side-parted, longer top |
| Curtains/Middle Part | HC-017 | Trending strongly in NL |
| Mullet | Modern, Classic | "Het Matje" — strong NL comeback |
| Afro/Textured | Curly Afro, Afro Fade | Curly/Coily textures |
| Mohawk | Mohawk, Fauxhawk | Niche/edgy |
| Flat Top | — | Coily hair only |

## Male Sides Configurations — Sides Axis (resolved)

These are sides treatments, NOT top style families. They combine with any top.

- **Fade** — gradual gradient from zero/skin up to top length. Heights: Low / Mid / High. Closeness: Skin / Half-guard / #1 / #2 / #3+
- **Taper** — blends only the sideburn and neckline; hair behind ears preserved. Guards: #1 / #2 / #3. Variations: sides tapered or lined-up × back tapered or lined-up.
- **Burst Fade** — fade that curves around the ear in a burst/arc shape. Hugely trending NL 2024–2026.
- **Undercut** — hard line contrast between top and sides; no gradient. Top length left long, sides cut very short with a defined edge.
- **Natural / Long** — sides left untouched; no fading or tapering. Used for afros, wolf cuts, some mullets.

---

## Brief Collection Flow (resolved)

**First visit:**
Client arrives → scans QR code in the waiting area → completes quiz on their own phone → sees their brief → **must enter email to submit** (hard block — no email, no submission). Email is collected at the END, after the client has seen their brief result — not at the start. Once submitted, the brief posts to the salon's live queue and is permanently stored against the client's email address. No stylist involvement in collection.

**Returning visits:**
PleromaOS sends the client a pre-visit link via email, 24 hours before their appointment. Client opens the link, reviews their saved preferences, updates anything that changed, and adds post-visit notes about how last time went. When they arrive, their brief is already updated.

**How the appointment time is known:**
The salon owner forwards booking confirmation emails (from Fresha, Booksy, etc.) to a PleromaOS email address. PleromaOS parses the email with AI, extracts the appointment date and client info, matches to an existing client record, and schedules the pre-visit email 24h before. This is the short-term integration approach — no API keys required, works across all booking systems.

**Client identity:**
Email address. Collected voluntarily at the end of the first quiz. Used to: (a) retrieve saved brief on return visits, (b) receive pre-visit links, (c) match against booking email data.

---

**Post-visit notes** (resolved):
After each visit, the pre-visit link also invites the client to leave notes about how the previous visit went — what they liked, what they'd change. This is the client's input into brief match scoring.
_Avoid_: review, rating, feedback form

**Coaching flag** (resolved):
A notification sent by the owner to a specific stylist, highlighting a pattern of low brief match scores in a particular skill area (e.g., colour blending, fade consistency). The app automatically suggests sending a coaching flag when the pattern meets a threshold. Always owner-initiated — the app recommends, the owner decides.
_Avoid_: performance review, warning, alert

**Training recommendation** (resolved):
A suggested action generated by PleromaOS when a stylist's brief match scores show sustained underperformance in a specific skill area. Delivered alongside a coaching flag. PleromaOS recommends, the owner acts.
_Avoid_: course suggestion, HR action

---

## Brief Visuals — Image Display Decision (resolved)

**The problem:** Every haircut image in the asset library (`consultation-app/app/images/haircuts/`) shows TOP + SIDES combined in one photo. For example, HC-004 (Textured Crop) always shows the crop shape ON TOP of a fade. There is no image that shows the top style in isolation without a sides treatment implied.

This creates a fundamental tension with the two-axis brief model, where TOP and SIDES are independent choices.

**Decision: Option A — images as inspiration/reference, not as exact selections.**

Haircut images are displayed during brief collection as visual reference points only — not as exact promised outcomes. When a client selects a top style (e.g., "Textured Crop"), the image shown is labelled/framed as a reference showing that top style ON A TYPICAL SIDES TREATMENT. The sides shown in the image are NOT what the client is choosing — sides are a separate, independent decision.

**Implications:**
- Images must never be shown as "this is exactly what you'll get." They are orientation aids.
- The UX must make clear which part of the image is the TOP decision and which is the SIDES decision — e.g., via annotation, a visible dividing line, or a label like "sides shown: mid fade — yours may differ."
- Future image generation should keep this in mind: one consistent sides treatment (e.g., mid taper) across all TOP style reference images makes the separation cleaner.
- This is a practical compromise for now. The ideal long-term solution (Option B) would be images that show only the top zone — but this requires a new generation pass.

---

## Brief Collection Quiz (in development)

**File:** `docs/specs/brief-male-quiz.html`
Phone-frame HTML prototype. No backend. Auto-advances on tap. Three sections: TOP → SIDES → BEARD.

The quiz begins with two gating questions before style selection:

**S0 — Gender:** Male / Female. Simple binary. Gates which style catalog is shown. No third option.

**S0b — Hair texture:** Straight & fine / Straight & coarse / Wavy / Curly / Coily-Afro. Asked immediately after gender. **Hard-filters** which cuts are offered as goals (see "Hair Texture and Skin Tone" below). Stored as part of the brief. Note: this is texture, never ethnicity.

### Screen Flow (Male path)

```
S0  → Gender (Male / Female)
      └─ Male → S0b → S1 (male style grid)
      └─ Female → Female quiz (not yet specced)

S0b → Hair type (Straight / Wavy / Curly / Coily/Afro)
      → Gates which reference images are shown throughout

S1  → Pick current style (21 styles, 3-col grid)
S1b → Keep this style or try something different?
      ├─ Keep → S2
      └─ Change → S1c

S1c → Pick target style (same 21-style grid)
      └─ auto-derives direction from length gap (S.curLen vs target.len)
         → skip S2, S3 → go S5

S2  → How long is it now? (Short / Normal / Long / Very Long)
S3  → What do you want to do with length? (Keep / Shorter / Longer)
      ├─ Keep + Keep style → S5 (skip S4)
      ├─ Keep + Change style → impossible (handled in S1c path above)
      └─ Shorter or Longer → S4

S4  → Pick from 3 alternatives (length-direction + relevance-filtered)
      Relevance logic:
      - Keeping style → same family first, then similar families
      - Changing style → impossible (S4 skipped on change path)
      → S5

S5  → Do you want fading? (Skin / Close / Shadow / No fade)
S6  → Fade height (Low / Mid / High) — skipped if no fade
S7  → Fade shape (Classic / Drop / Burst) — skipped if no fade
S8  → Line sharpness (Sharp / Natural)
S9  → Neckline (Square / Round / Tapered)

S10 → Current beard state (None / Stubble / Short / Medium / Full)
      └─ None → S14 (touchup offer)
      └─ Any → S11

S11 → Light patches? (Even / Some)
S12 → Beard density (Light / Medium / Thick)
S13 → Beard fading (Yes / No)
S14 → Clean-shaven touchup offer (skip / yes → S14b)
S14b→ Beard lines (Sharp / Natural)
S15 → Beard neckline position (Low / Jawline / Natural blend)
S16b→ Beard style (Full / Goatee / Italian / Chin strap / Moustache)
S16 → Summary screen
```

---

## ✅ CANONICAL BUILD SPEC — Male Quiz v1 (locked Aug 24, 2026)

**This is the spec to build from.** It supersedes the older screen flow above, which is kept for history. Every decision from the Aug 24 grilling session is merged here.

### v1 scope decisions

| Decision | v1 |
|---|---|
| Preview | **Avatar only** — top-style reference image + label naming the actual sides choice. No selfie, no AI clone, no consent flow (v2). |
| Style catalog | **All 21 styles.** The 4 missing families (Quiff, Slick Back, Edgar Cut, Wolf Cut) get images generated **before build**. |
| Routes | **Both ship in v1** — "Choose a famous style" and "Build my own style". |
| Presets | **All 21 styles are presets**, plus a "Don't see what you want?" photo-upload tile. |
| Barber selection | **At the end**, on the same screen as the email gate. |
| Styling effort | **Right after style selection**, on both routes. |

### Full screen flow

```
ENTRY — scan shop QR
│
S0   Gender (Male / Female)              → Female = separate quiz, not in v1
S0b  Hair texture (Straight&fine / Straight&coarse / Wavy / Curly / Coily-Afro)
     → HARD-FILTERS the style catalog for all goal screens (S1c, S4, A1)
S0c  Skin tone swatch — 3 unlabelled faces, "Which looks closest to you?" (skippable, default medium)
     → presentation only, never filters anything
│
SR   ROUTE CHOOSER
     ├─ "Choose a famous style"  → ROUTE A
     └─ "Build my own style"     → ROUTE B

─────────── ROUTE A — famous style ───────────
A1   Preset grid (all 21 styles + "Don't see what you want?" tile)
     ├─ Preset tapped → every detail auto-fills → SE
     └─ "Don't see it" → A1b
A1b  Photo upload — client sends a picture of the style they want
     → photo defines the TOP only
     → continues through SIDES + BEARD (S5–S16c), skips top questions
     → photo attaches to the brief as reference art for the barber
     → flagged internally as a catalog-gap signal (which styles to add next)

─────────── ROUTE B — build my own ───────────
S1   Pick current style (21-style grid)
S1b  Keep this style, or try something different?
     ├─ Keep   → S2
     └─ Change → S1c
S1c  Pick target style → auto-derives direction from length gap
     → skips S2, S3, S4
S2   Current length (options CONSTRAINED by S1 — invalid ones disabled)
S3   Length direction (Keep / Shorter / Longer)
     ├─ Keep → skip S4
     └─ Shorter or Longer → S4
S4   Pick from 3 alternatives (length-direction + family similarity + hair type)

─────────── BOTH ROUTES CONVERGE ───────────
SE   Styling effort (Low / Medium / High)
     → mismatch vs the style's maintenance level is FLAGGED on the brief
     → Route A: asked right after the preset is picked
     → Route B: asked right after style selection resolves

SIDES  (Route A presets skip these — preset fills them; photo path DOES answer them)
S5   Fading? (Skin / Close / Shadow / No fade)   → defaultSides pre-selected, overrideable
S6   Fade height (Low / Mid / High)              → skipped if no fade · "Barber's choice" available
S7   Fade shape (Classic / Drop / Burst)         → skipped if no fade · "Barber's choice" available
S8   Line sharpness (Sharp / Natural)            → NO "Barber's choice"
S9   Neckline (Square / Round / Tapered)         → "Barber's choice" available

BEARD  (Route A presets skip these — preset fills them; photo path DOES answer them)
S10  Current beard state (None / Stubble / Short / Medium / Full)
     └─ None → S14
S11  Light patches? (Even / Some)
S12  Beard density (Light / Medium / Thick)
S13  Beard fading (Yes / No)
S14  Clean-shaven touchup offer (skip / yes → S14b)
S14b Beard lines (Sharp / Natural)
S15  Beard neckline position (Low / Jawline / Natural blend)
S16b Beard style (None / Full / Goatee / Italian / Chin strap)
S16c Moustache (None / Natural / Chevron / Handlebar / Pencil)   ← own dimension

PREVIEW
P1   Avatar preview — top-style reference image, captioned with the real sides choice
     e.g. "Textured Crop · your sides: high skin fade"
     Images are REFERENCE ONLY, never "exactly what you'll get" (see Image Display Decision)

CLOSE
S17  SUMMARY — every detail listed, every detail editable (both routes)
     → long-transition warning here if gap ≥ 2 length categories
     → styling-effort mismatch note shown here
S18  Barber selection + email  ← HARD BLOCK, no email = no submission
     → "Who's cutting your hair today?" + email field on one screen
     → SUBMIT → brief posts to salon live queue + stored permanently against email
```

### Hair Texture and Skin Tone — Two Separate Axes (resolved Aug 24, 2026)

A foundational correction to S0b. These are **two independent dimensions** that must never be conflated:

| Axis | What it does | Where it appears |
|---|---|---|
| **Hair texture** | Determines **which cuts are physically possible**. Hard-filters the style catalog. | S0b question · style availability |
| **Skin tone** | Determines **who the client sees in the picture**. Never filters anything. | Visual swatch picker · render dimension |

**Texture profiles (5) — replaces the old 4-option list:**

| Slug | Label | Notes |
|---|---|---|
| `straight-fine` | Straight & fine | Typical fine European hair |
| `straight-coarse` | Straight & coarse | **New.** Straight curl pattern but thick and stiff — common across East Asian hair. Holds a blunt crop beautifully, fights a quiff without heavy product. Behaves nothing like straight-fine despite identical curl pattern. |
| `wavy` | Wavy | |
| `curly` | Curly | |
| `coily` | Coily / Afro | |

**Why texture and not ethnicity.** Ethnicity was the intuitive framing but it breaks on real clients: a Black man with relaxed or looser-curl hair, a white man with coily hair, anyone of mixed heritage — the label predicts the wrong cuts for all of them. Texture predicts correctly every time. There is also a hard compliance edge: **ethnicity is Article 9 special-category data under GDPR**, the same tier as the AI-clone facial data. Asking it would pull the entire quiz into that regime for zero functional gain. Texture is ordinary personal data.

**Style availability is a HARD filter.** Cuts unavailable for a client's texture are **hidden**, not greyed or flagged.

- **Filter applies to:** S1c (target style), S4 (alternatives), A1 (preset grid) — everything expressing a *goal*.
- **Filter does NOT apply to:** **S1 (current style).** A client must always be able to describe what they already have, however unusual for their texture. Filtering S1 would make reality undescribable.

**Skin tone selection:** one optional screen, an **unlabelled visual swatch picker** — 3 rendered heads, *"Which looks closest to you?"* No ethnic labels, no text categories, just faces. Skippable; defaults to medium. Nothing is stored as an ethnicity field. Existing library tones: `light` / `medium` / `deep`.

**Consequence for asset collection:** reference photos are keyed by **texture only**. Skin tone is applied at render time, so one reference photo per texture serves all three tones — it never multiplies the collection work.

- Reference targets: **261** (variation × available texture)
- Generated images: **783** (261 × 3 skin tones)

---

### Style Image Pipeline (resolved Aug 24, 2026) — 🔴 the v1 blocker

**The gap that was blocking the prototype:** the existing library (`consultation-app/app/images/haircuts/HC-XXX/{light|medium|deep}/{low|mid|high}-fade/`) varies **skin tone** and **fade height** — but *not hair type*, and gives only **one look per style**. S0b asks Straight/Wavy/Curly/Coily and is meant to gate which images appear; the old library physically cannot do that. And a Textured Crop can be worn a dozen ways — one photo cannot communicate the range.

**Resolution — a two-stage pipeline. Real photos are source material, never client-facing:**

```
Pinterest  →  reference/  →  AI generation  →  generated/  →  quiz
 (real)       (raw source)   (branded pass)    (what clients see)
```

- **`reference/`** — real photos collected from Pinterest. **Never shown to clients.** They exist so the generation pass knows exactly what each style and variation actually looks like.
- **`generated/`** — branded mannequin renders produced *from* those references. Consistent base character, lighting, and framing, so the style grid never looks like a folder of random Google images. **This is what the quiz displays.**

**Why not generate directly:** synthetic-only images drift from what the style really is. Why not use real photos directly: visual inconsistency destroys the brand and makes the grid feel like a search-results page.

**Library location:** `brand/style-library/male/`

```
male/
  manifest.json                 ← machine-readable index (21 styles, 72 variations)
  README.md                     ← collection workflow + photo quality guidance
  NN-style-slug/
    README.md                   ← what to collect for this style
    variation-slug/
      reference/                ← Pinterest photos: <texture>-01.jpg
      generated/                ← branded renders
```

**Scale:** 21 styles × 3–4 variations each = **72 variations**, **261 reference-photo targets** (variation × available texture) → **783 generated images** (× 3 skin tones). Textures are per-style — Flat Top is curly/coily only, Quiff and Slick Back are straight/wavy only, and so on. Each style's README ticks its own set.

**File naming:** `<texture>-NN.jpg` inside the variation's `reference/` folder — texture lives in the filename, not a folder level, to keep navigation shallow.

**The old mannequin library stays** for the avatar preview step (P1), where a consistent neutral base is an advantage.

### Data each style family must carry

Every one of the 21 style families needs these properties before the quiz can run:

- `len` — length category (very-short / short / medium / medium-long / long)
- `family` — for SIMILAR-families lookup in S4
- `defaultSides` — pre-selected sides treatment, labelled *"typical for this style"*
- `maintenance` — Low / Medium / High / Variable (shown as a badge on style cards)
- `presetAnswers` — the complete auto-fill answer set for Route A
- `textures` — which of the 5 texture profiles this cut is offered for (drives the hard filter)
- `image` — generated art, keyed by texture × skin tone

### Non-negotiable rules

- **Back is always cut slightly lower than the sides** on a fade — no configuration may produce back ≥ sides.
- **Email is a hard block.** No partial briefs, all screens completed.
- **Every internal value has a display label.** Raw keys (`very-short`, `burst`) never shown.
- **Current state and goal state are separate** and both appear on the brief when they differ.
- **Draft sessions** save server-side per screen, resume on reopen, auto-delete after 24h unsubmitted.

---

### Two-Path Logic When Changing Styles

When a client picks a target style different from their current style (S1c path):
- The system compares `LEN.indexOf(target.len)` vs `LEN.indexOf(S.curLen)` to auto-derive `S.dir` (shorter / longer / keep)
- S2 (current length) is skipped — already known from the style picked in S1
- S3 (direction question) is skipped — derived from style comparison
- S4 (alternatives) is skipped — target style already explicitly chosen in S1c
- The brief summary shows both the current style and the target style so the barber understands the transition

**Example:** Client picks Buzz Cut (S1) → "Try something different" → picks Classic Men's (S1c).
- `S.style = HC-001`, `S.curLen = 'very-short'`
- `S.targetStyle = HC-007`, `target.len = 'medium'`
- Auto-derived: `S.dir = 'longer'` (target is longer than current)
- Quiz jumps straight to Sides section

### Style Families and Length Categories

```
very-short : Buzz Cut, Flat Top
short      : Crew Cut, Caesar, Textured Crop, Edgar Cut, Fauxhawk
medium     : Quiff, Slick Back, Classic Pomp, Modern Pomp, Classic Men's,
             Comb Over, Comb Over Fade, Curtains, Curly Afro, Afro Fade, Mohawk
medium-long: Modern Mullet
long       : Wolf Cut, Classic Mullet
```

### SIMILAR Families Map (used for S4 relevance sorting)

```
Buzz/Crew → [Buzz/Crew, Crop, Flat Top, Edgar Cut]
Crop → [Crop, Buzz/Crew, Edgar Cut, Flat Top]
Pompadour → [Pompadour, Quiff, Classic Men's, Comb Over]
Quiff → [Quiff, Pompadour, Classic Men's, Comb Over]
Slick Back → [Slick Back, Pompadour, Classic Men's, Comb Over]
Comb Over → [Comb Over, Classic Men's, Pompadour]
Classic Men's → [Classic Men's, Pompadour, Comb Over, Curtains, Quiff]
Curtains → [Curtains, Wolf Cut, Mullet]
Wolf Cut → [Wolf Cut, Mullet, Curtains]
Mullet → [Mullet, Wolf Cut, Curtains]
Afro/Textured → [Afro/Textured, Mohawk]
Mohawk → [Mohawk, Afro/Textured]
Edgar Cut → [Edgar Cut, Crop, Buzz/Crew]
Flat Top → [Flat Top, Buzz/Crew, Crop]
```

### Known Gaps and Open Logic (unresolved)

1. ~~**Hair type is not asked.**~~ **RESOLVED:** Hair type is asked at S0b (immediately after gender, before style grid). Options: Straight / Wavy / Curly / Coily/Afro. Stored in brief and gates which reference images are shown.

2. ~~**The style grid makes no distinction by hair type.**~~ **RESOLVED:** Hair type from S0b is used to filter/annotate reference images in the style grid. Coily clients see images tagged for their texture; straight clients see straight-hair references.

3. ~~**S2 and S1 can contradict each other.**~~ **RESOLVED:** The quiz treats current state and goal state as two separate things. S1 + S2 define the client's *current* state (what they have now) — these must be internally consistent. S1c defines their *goal* state (what they want). A gap between current and goal is never a contradiction — it is a transition plan. The system derives direction (grow / cut / keep) from the gap. Resolution: S2 answer options are *constrained by S1* — if they pick Buzz Cut, only "very short" is selectable in S2. Invalid options are disabled, not warned against. The brief always captures both current state (starting point) and goal state (end goal) when they differ.

4. ~~**Unrealistic style change transitions.**~~ **RESOLVED:** Long transitions (current-to-goal length gap ≥ 2 categories) are surfaced on the S16 summary screen only — one line: *"This style needs significant growth — this is a longer journey."* No blocker mid-flow. The barber sees it on the brief and has the conversation in person.

5. ~~**S4 alternatives quality is weak.**~~ **RESOLVED:** S4 candidates are scored on three axes: (1) length-direction match (hard filter — wrong direction candidates excluded entirely), (2) family similarity rank from the SIMILAR map (primary sort), (3) hair type compatibility (secondary sort). Top 3 by combined score are shown. This guarantees vibe-adjacent suggestions, not just length-adjacent ones.

6. ~~**The change path skips asking why.**~~ **RESOLVED:** A motivation question (S1b-change sub-screen) asks "What don't you like about your current style?" before the target style grid (S1c). Answer options: Too much maintenance · Wrong length · Ready for something new · Didn't come out right last time. The motivation answer does NOT filter which styles are shown — all styles are always shown in S1c. Instead, each style card in S1c displays a **maintenance badge** (Low / Medium / High / Variable) so the client can self-select with full information. Maintenance levels: Low = Buzz/Crew, Edgar Cut, Flat Top, Curtains; Medium = Textured Crop, Comb Over, Classic Men's, Afro/Textured; High = Quiff, Slick Back, Pompadour; Variable = Mullet, Wolf Cut. The motivation answer is stored in the brief as context for the barber.

**Maintenance level** is a defined property on every style family. It is displayed on every style card in both S1 (current style) and S1c (target style) grids.
_Avoid_: effort level, styling time

7. ~~**Sides section has no style-implied constraints.**~~ **RESOLVED:** Each style family has a `defaultSides` property in the data (e.g. Wolf Cut → Natural/Long; Mohawk → Skin fade or Undercut; Flat Top → High fade or Undercut; Afro → Natural or Low taper). S5 pre-selects the default sides treatment, labelled *"typical for this style."* The client can override freely — no choices are blocked. The brief records what was actually chosen, not the default.

8. ~~**Wolf Cut / Mullet + fade contradiction.**~~ **RESOLVED:** Covered by gap 7 — Wolf Cut defaults to Natural/Long sides in S5. If the client overrides and picks fading anyway, that is a valid brief (it produces an unconventional combination, but it's their choice). No extra warning needed; the barber sees what was chosen and can discuss in person.

9. ~~**Moustache has no detail questions.**~~ **RESOLVED:** Moustache is asked as a separate question within the beard section — not as a branch off S16b. A dedicated moustache screen (S16c or equivalent) asks: *"Moustache?"* with options: None / Natural / Chevron / Handlebar / Pencil. This sits alongside beard style, not below it, so a client can specify Full beard + Handlebar moustache, or Moustache only with no beard. "Moustache only" is removed as a Beard style option; it is now expressed as: Beard style = None + Moustache = [chosen style].

10. ~~**No question about styling habits.**~~ **RESOLVED:** A separate styling effort question is added to the quiz: *"How much time do you want to spend styling each day?"* — Low (no product, done in seconds) / Medium (a little product, a minute or two) / High (product + daily effort, I don't mind). If the client's chosen style maintenance level (from gap 6) conflicts with their stated effort level — e.g. High-maintenance style + Low effort — the brief flags this mismatch in a visible note for the barber. The client is not blocked or redirected; the barber handles it in person.

11. ~~**Colour not captured.**~~ **RESOLVED:** Colour questions are out of scope for the male quiz entirely. Colour (highlights, bleaching, toner, treatments) belongs to the women's quiz, not the men's. Male brief = cut + beard only.

12. ~~**Summary screen shows raw internal values.**~~ **RESOLVED:** Every internal value has a display label. `"very-short"` → *"Very short"*, `"burst"` → *"Burst fade"*, `"low"` → *"Low fade"*, etc. Raw keys are never shown to the client or barber. Implementation discipline, not a design decision.

13. ~~**No "I don't know" option.**~~ **RESOLVED:** *"Barber's choice"* is available as the last, de-emphasised option on S6 (fade height), S7 (fade shape), and S9 (neckline). Not on S8 (line sharpness — clients usually have a strong preference here). When selected, the brief notes: *"Client has no preference on [screen topic]."* The barber decides in session.

14. ~~**No concept of this-visit vs standing preference.**~~ **RESOLVED:** The brief uses a two-layer data model. **Preferences** (stable, persists across visits, pre-filled on return): hair type, sides treatment, fade/taper style, line sharpness, neckline, beard style, moustache style. **This visit** (variable, freshly asked every visit): length direction, specific adjustments, styling effort, any post-visit notes from last time. On a return visit, the pre-visit link shows the client their Preferences pre-filled and asks them to confirm or update, then asks the This-visit questions fresh. The barber always sees both layers on the brief card.

15. ~~**Email capture missing from quiz.**~~ **RESOLVED:** Email is a **hard block** on the brief submission. The S16 summary screen shows the brief, then presents an email input: *"Enter your email to send your brief to the barber."* The client cannot submit without providing an email. No skip option. Once submitted: brief posts to salon's live queue immediately, is stored permanently linked to the client's email, and the barber sees it on the dashboard. The email address is the client's permanent identifier across all future visits.

---

## Open Questions (for grilling)

- ~~How does "brief match" get calculated?~~ **RESOLVED:** Brief match combines both inputs: **60% client post-visit note + 40% stylist self-assessment**. When the two disagree beyond a threshold, the visit is flagged on the owner dashboard (consistent with the existing feedback-disagreement flagging, ADR #0008).
- ~~What is the minimum brief?~~ **RESOLVED:** There is no partial brief — **all screens must be completed** before submission. Anything the client wants to leave to the barber is expressed explicitly via the *"Barber's choice"* option (S6, S7, S9), which the stylist sees on the brief card. A brief is either complete or it doesn't exist.
- ~~What happens between "Design Partner" and "paying customer"? What does launch pricing look like?~~ **RESOLVED — freemium model (pivot, Aug 2026):**
  - PleromaOS is **free to sign up**. The limiting dimension is **briefs per month** per shop.
  - **Tiers:** Free = 50 briefs/month · Growth = 200 briefs/month at **€49/mo** · Pro = 450 briefs/month at **€99/mo** · Enterprise = contact us (multi-location, high volume). **Never unlimited** — heavy usage always maps to a higher tier.
  - **Limit behaviour:** soft grace — briefs keep working for a small buffer (~10 extra) past the limit while the owner gets urgent upgrade prompts; after the buffer, new briefs are blocked. The client never sees an error — the block surfaces to the owner, and the QR shows the shop as "at capacity."
  - **Rationale:** free tier dominates distribution and captures data at scale; paid tiers convert only the shops that are actually busy (a busy shop does 375–625 briefs/month, so 50 free ≈ a few days of real usage).
  - **Design Partner Programme survives as a secondary track:** a small number of hand-picked shops get Pro free in exchange for deep feedback and case studies. The landing page's **main CTA changes from "book a 15-min call" to free signup** ("Start free — 50 briefs/month"); the partner track becomes a smaller secondary path.
- ~~Does PleromaOS integrate with booking systems long-term, or is email-forwarding permanent?~~ **RESOLVED:** Email-forwarding is the standard mechanism for Free, Growth, and Pro tiers. **Booking connectors (Fresha, Booksy, custom in-house systems) are an Enterprise-tier feature**, built per customer as part of the Enterprise deal. The Rob Peetoom opportunity maps to this: his in-house booking system connector is what the Enterprise conversation sells. No connector framework in the MVP.
- ~~What if the booking email doesn't include the client's email?~~ **RESOLVED:** No client email in the forwarded booking → no pre-visit link for that visit. The client does their brief **in-shop via the QR code** instead, which captures their email anyway (email is a hard block on submission). From the next visit onward, Pleroma has their email and the pre-visit flow works. Self-healing — no manual matching, no owner admin work.

### July 17 carry-over questions — all resolved (Aug 24, 2026)

- ~~Per-barber QRs at stations?~~ **RESOLVED:** **Shop QR only** — one QR per salon, placed in the waiting area. The brief already routes to the right barber because the client selects them in the flow. Per-station QRs can be revisited if real usage shows the need.
- ~~How does mid-quiz auto-save work?~~ **RESOLVED:** **Server-side draft sessions.** Each completed screen posts the answer to Supabase, tied to a draft session. Reopening the quiz resumes at the same screen (works across devices). Draft sessions that never reach submission **auto-delete after 24 hours** — no email is attached yet, so nothing is worth keeping.
- ~~Barber deletion — what happens to their client history?~~ **RESOLVED:** **History stays, clients reroute.** Past visits stay permanently credited to the departed barber (honest analytics, real history — consistent with brief match integrity). Clients are not "owned" by a barber: next visit they pick whoever is cutting their hair, and that stylist sees the full brief + history. The dashboard shows the departed barber greyed out as **"Former staff."** No reassignment.
- ~~Quick Pick vs Personalized / AI clone — still in scope?~~ **RESOLVED — reframed as the two-route quiz (major decision):**
  - The quiz has **two entry routes**: **"Choose a famous style"** — client picks a preset; every brief detail (sides, fade, neckline, etc.) auto-fills from the preset — or **"Build my own style"** — the full S0–S16 flow, puzzled together piece by piece.
  - Presets are **named classic styles** (~15–25: Buzz Cut, Crew Cut, Pompadour, French Crop, Mullet, Taper Fade, …). No celebrity names or likenesses. Presets map onto the existing style families (defaultSides, maintenance level).
  - The preset route still asks **S0 (gender) + S0b (hair type)** first.
  - **Both routes converge on the same editable summary** — any auto-filled detail can be tapped and changed — followed by the email gate.
  - **Both routes end with a preview step:** view the chosen style on a **generic avatar**, or **take a selfie** and view it on your own head.
- ~~Selfie / AI clone data?~~ **RESOLVED:** Selfies are **stored with explicit opt-in consent** and used to build and progressively improve the client's **persistent AI clone** — each new selfie refines it, so previews get more accurate over time. Facial data is special-category under GDPR: separate consent at capture, clear language, visible deletion option.
- ~~Can a client delete their AI clone but keep history?~~ **RESOLVED:** **Yes — separate deletions.** "Delete my photos & clone" removes all facial data; briefs and visit history stay (the salon keeps its record). "Delete everything" = full GDPR erasure with brief anonymization per ADR #0009. After clone deletion, previews fall back to the avatar until a new selfie is taken.

---

## File Map (current)

```
/Users/Bryan/Pleroma/
├── CONTEXT.md                            ← this file (domain model + decisions)
├── ux-context.md                         ← UX principles memory for dont-make-me-think skill
├── pleroma-crm.html                      ← outreach CRM (functional)
├── brand/
│   ├── design-system/                    ← (empty, future)
│   ├── logos/                            ← (empty, future)
│   └── mockups/
│       ├── 01_splash.png                 ← OLD placeholder (quiz splash screen)
│       ├── 02_question.png               ← OLD placeholder (quiz question screen)
│       ├── 03_results.png                ← OLD placeholder (quiz results screen)
│       └── from-landing/                 ← CURRENT canonical UI reference
│           ├── 01_client-retention.html
│           ├── 02_client-profile.html
│           └── 03_staff-handoff.html
├── product/
│   └── landing-site/
│       ├── index.html                    ← live landing page (deployed to pleromaos.nl)
│       ├── og-image.png                  ← social share image (1200×630)
│       └── mockups/                      ← (same PNGs as brand/mockups, legacy)
├── consultation-app/                     ← earlier visual quiz prototype (on hold)
│   └── app/
│       └── images/
│           ├── mannequins/               ← male base characters (complete)
│           ├── haircuts/HC-001–HC-017    ← male haircut overlays (complete)
│           └── quiz/                     ← texture + color quiz images (complete)
└── docs/
    ├── legal/
    ├── research/
    └── specs/
```

---

## ✅ AI HAIR TRANSFER — REBUILT AND WORKING (resolved Sep 10, 2026)

Client uploads a photo, gets back the same photo with the briefed haircut on it.
Mustafa's original lived in his Supabase and was never handed over; this is a
clean rebuild. **First successful end-to-end production render: Sep 10, 2026.**

### The core finding: prompt order is load-bearing, and one image is not enough

Three prompt shapes were measured on the same curly-haired subject:

| Prompt shape | Result |
|---|---|
| Style name leads: *"Change this man's haircut to a modern pompadour…"* | Curls **gone**. Straightened. |
| Preservation leads: *"He keeps his curly hair. Every curl stays a curl. Cut the sides…"* | Curls held on short cuts; medium swept cuts came back as loosened waves |
| **Two images** (client + haircut reference) + hard limits | Curls held. Colour held. **This is the one that works.** |

Why: when the style noun leads, the model reaches for its stock idea of that
style — which is almost always straight hair — renders that, and treats any
preservation clause as a suggestion. Showing a reference photo separates
*shape* (taken from image 2) from *hair* (kept from image 1).

**Rule: preservation first, cut second, style name never at the front.**

### Model decision

- **Gemini 3 Pro Image** (`gemini-3-pro-image`), called direct, `imageSize: "2K"`.
- Note: Higgsfield's `nano_banana_pro` **is** this same model. Mustafa saying
  "Gemini" did not by itself explain his result — the two-image method did.
- Rejected: `flux_kontext` (beautifies the face — slims the jaw, removes years);
  `seedream_v5_pro` (best face fidelity of the Higgsfield options, but could not
  hold curl on medium styles). `is_inpaint` on seedream is prompt-driven, **not**
  region-masked — it does not guarantee the face is untouched.
- Nano Banana Pro has **no free tier**. Billing must be enabled on the Google
  Cloud project or every image call returns `limit: 0`.

### Architecture

```
quiz answers
  -> buildRenderRequest()      pure, testable, no I/O — composes the prompt
  -> pick_style_reference()    Postgres fn — scores references, texture weighted highest
  -> hair-transfer edge fn     background render via EdgeRuntime.waitUntil
  -> renders table + storage   client polls GET ?renderId=
```

- `renders` table: submit-and-poll, because a render takes 30–60s and would
  otherwise race the edge function timeout. Failures land on the row, not in a log.
- `client-photos` bucket is **private**; the face is never on a public URL.
  Rows carry `expires_at` = 24h, matching the draft-session policy.
- `style_references` table holds the reference index. It lives in the DB, **not**
  in code, so references can be added without a redeploy.

### Non-negotiable prompt clauses (never shorten these)

1. **IDENTITY_LOCK** — face, bone structure, age, expression, framing.
2. **COLOUR_LOCK** — hair colour and grey are a *separate* failure mode from
   texture and need their own clause.
3. **REFERENCE_FENCE** — take nothing from image 2 but the haircut shape.

### Known defects (as of first working render)

- **Reference contamination.** A clean-shaven client given a stubbled reference
  came back with stubble. **Mitigation: crop the reference to its top 55%** before
  sending — less of the other person left to copy. Verified working.
- **Framing drift.** Output subject sits further back with a lighter background
  despite the prompt asking to preserve framing. Unresolved. Suspect the 55% crop
  removes the composition cue; worth testing a gentler crop.
- **Possible age/face drift** — observed at low resolution, not yet confirmed at
  full size.

### Two image libraries, two different jobs — do not confuse them

| Library | Purpose | Organisation |
|---|---|---|
| `brand/style-library/male/` (66 refs) | **input to the AI** | by haircut; filename is `<texture>_<fade>_<line>_<extra>` — **correct, keep it** |
| `docs/specs/hc-imgs/HC-001…017` (53) | **shown to the client in the quiz** | by skin tone × fade — **wrong axis, see below** |

Folder structure does **not** affect the model: it only ever sees the one
reference image we hand it. Folders are for humans and for the indexer.

🔴 **The generated set (`hc-imgs`) is dimensioned on skin tone × fade.** Skin tone
is the presentation-only, skippable, defaults-to-medium axis; texture is the one
that hard-filters what a client is even offered — and it has no axis at all.
Fix this before generating the remaining ~700.

### 🔴 Reference coverage gap (the current blocker)

Indexed 66 references: 36 straight-fine, 22 straight-coarse, 6 coily, 2 wavy,
and **zero curly** across the entire library. Curly is permitted on 14 of 21
styles and is precisely the texture that text-only rendering fails.

A wrong-texture reference is **worse than none** — it hands the model the exact
mismatched archetype we are avoiding — so `pick_style_reference` returns nothing
when the only candidates mismatch, and the render falls back to text-only.

**Collection priority: curly first, coily second, medium combed styles first.**

### Cleanup owed before launch

- Delete edge functions `gemini-test` and `dev-seed` (both dev-only, JWT off).
- Remove the duplicate `… (1).jpg` object from the `style-library` bucket.
- Secret must be named exactly `GEMINI_API_KEY` (a secret named `gemini api`
  silently reads as empty and Google returns `API_KEY_INVALID`).
