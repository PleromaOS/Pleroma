# UX Context — PleromaOS

This file is the evolving memory for the `dont-make-me-think` skill.
Read it at the start of every design or copy session. Propose additions at the end.

---

## Project: PleromaOS Landing Page

**Stack:** Single HTML file · Vanilla JS · Snap-scroll sections · EN/NL i18n · Supabase
**Audience:** Salon and barbershop owners in the Netherlands
**Goal:** Waitlist signups. No demo, no trial. Just enough trust to join.

---

## Principles Reinforced — Learned From This Project

### 1. Traffic Sign Logic
Every major section transition needs a signpost that matches what the user is about to see.
A CTA or link label must describe its destination accurately — not what you wish it were.

**Violation found:** "See how it works →" led into 3 problem sections. The user expected a feature demo.
**Fix:** Rename to describe what's coming. Add a chapter marker before problem sections.
**Rule:** If a label and its destination don't match, the sign is broken.

### 2. Billboard Coloring
In single sentences carrying high emotional weight, use typographic color to rank words by importance.
- **Gold** = highest-weight words (consequence, fear, loss, the specific pain)
- **White** = standard readable text, everything else
- **Nothing gets dimmed.** Both tiers are fully legible. The hierarchy is about elevation, not suppression.

**Violation found:** Proposed "muted" (low opacity) for setup words — this is wrong. Every word must be readable. You make important words louder, you don't make other words quieter.

### 3. Visual Metaphors Cannot Block Content
Fades, gradients, and overlays used as metaphor are only valid if all content behind them remains fully readable.

**Violation found:** S2 retention diagram used a fade-to-black gradient to show "clients fading away." Clients 4 and 5 were unreadable.
**Fix:** Dot color coding (green/orange/gray) carries the metaphor. Text rows are always readable.
**Rule:** A metaphor that hides content is not a metaphor — it's an error.

### 4. Fake Interactivity Destroys Trust
Any element that looks interactive but does nothing is a Krug violation.
`cursor:pointer`, arrow icons, link-style color — these all promise interaction. If nothing happens, the user feels tricked.

**Violation found:** `.pvc-profile` had `cursor:default` but styled like a link with "View full client profiles →". Users who clicked got nothing.
**Fix:** Either make it work or make it look static. Replace with a clearly static label.

### 5. Mobile Text Density
On screens ≤ 390px wide, body copy should fit in 2 lines at reading size.
If it can't, cut the copy — not the font size. Smaller fonts on mobile cause abandonment.

**Violation found:** Hero body copy split into 3 narrow columns on mobile due to word-reveal span rendering.
**Fix:** Show only the punchy second sentence on mobile. Cut, don't shrink.

### 6. Language Selectors Need Affordance
Never use bare text labels for language switching. They look like body copy, not interactive controls.
**Convention:** Segmented pill toggle (one pill, two halves, active state filled) — shape communicates "pick one."
**Violation found:** "EN · NL" plain text — indistinguishable from nav copy on mobile.

### 7. Diagram Narrative Order — Problem First, Solution Second
A diagram shown before the problem is described makes no sense to a first-time reader.
They don't know what they're looking at yet.

**Correct order per beat:**
1. Problem copy — the pain, stated clearly
2. Solution diagram — what PleromaOS gives you instead

**And:** Diagrams should show the SOLUTION state, not the problem state. The problem was just described in words. The diagram should show what it looks like when PleromaOS solves it.

**Violation found:** All three pain beat sections showed a problem diagram before problem copy.

### 8. Repetitive Section Labels Add No Information
If a label repeats the same value on every instance, it adds noise, not signal.
**Violation found:** "01 · The problem", "02 · The problem", "03 · The problem" — after the first, these labels tell the user nothing new.
**Fix:** Make each label specific: "01 · Client retention", "02 · Knowledge loss", "03 · Staff turnover."

### 9. Trust Strip Visibility
Trust signals must be visible. At opacity < 0.5 they cannot be read and therefore cannot build trust.
**Violation found:** `.cta-trust` was at `opacity: 0.25`.

### 10. Insider Language in Trust Signals
Trust strip copy must be universally understandable. Industry-specific software names mean nothing to users who don't use that software.
**Violation found:** "No Fresha needed" — only meaningful to Fresha users.
**Fix:** "Works with any booking system."

### 11. Browser Functions Do Not Belong in Product Nav
A refresh button in a product nav creates confusion — it looks like a product feature, not a browser action.
Users who see it either wonder what it does or feel the product is unstable.
**Violation found:** `↺` refresh button in PleromaOS nav.

### 12. Secondary CTAs Must Look Like Buttons
Ghost links (plain text + arrow) are invisible on mobile where there is no hover state.
A secondary CTA needs a visible affordance: an outlined pill shape, a border, or at minimum an underline.
**Violation found:** "See how it works →" was unbordered plain text — unrecognizable as a button on mobile.

### 13. Progress Dots Must Be Wired to the Scroll Controller
Clicking a navigation element must keep the scroll state consistent.
If a dot calls `scrollIntoView()` directly instead of routing through the snap controller, `curIdx` falls out of sync and the next scroll gesture may go the wrong direction.
**Violation found:** Progress dot click handlers bypassed `goSection()`.

### 14. CTA Label Consistency
When multiple entry points lead to the same destination, they must use the same label. Divergent labels create ambiguity — users wonder if they're different things.
**Violation found:** Hero button said "Get Early Access", nav button said "Join Waitlist" — both going to `#waitlist`. "Join Waitlist" is accurate; "Get Early Access" overpromises.
**Rule:** One destination = one label.

### 15. Social Proof Is Not Optional at Zero Stage
Feature copy and scarcity signals cannot replace peer validation. Salon owners trust other salon owners. At zero-to-one, one attributed testimonial outweighs all feature descriptions. The absence of any human voice on the page is a trust gap — not a minimalism choice.
**Open issue:** No testimonials, no quotes, no "X salons signed up" anywhere on the page.

---

## PleromaOS Section Architecture (reference)

| Section | ID | Content |
|---|---|---|
| Hero | s-hook | Headline, CTA, ghost link |
| Chapter marker | — | "Three things that cost you clients." |
| Pain 1 | s-pain-0 | Client retention — problem copy → solution diagram |
| Pain 2 | s-pain-1 | Knowledge loss — problem copy → solution diagram |
| Pain 3 | s-pain-2 | Staff turnover — problem copy → solution diagram |
| Reveal | s-reveal | PleromaOS intro / pivot moment |
| How it works 0–2 | s-how-0/1/2 | Three steps, animated |
| Owner dashboard | s-owner | Phone mockup section |
| Live counter | s-live | Scarcity + CTA |
| Waitlist form | s-waitlist | Survey + Supabase |

---

## Open Issues (to address next)

- [ ] Each section needs a visible chapter marker (active dot label or top-left indicator)
- [ ] "See how it works →" — rename + add outlined pill border
- [ ] Add chapter beat between hero and first problem section
- [ ] All three pain diagram contents need rewrite (show solution, not problem)
- [ ] Billboard coloring — apply gold/white weighting to all key sentences
- [ ] EN/NL toggle — implement segmented pill
- [ ] Mobile hero body copy — hide first sentence, show second only
