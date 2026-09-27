# PleromaOS — component registry

The single source of truth for what is built, what is locked, and what a locked
thing looks like. **Nothing is "done" until it has a row here marked LOCKED with
a path.** If it isn't in this table it doesn't exist.

Update this file in the same turn you lock something. Never in a later one.

## Status values

| Status | Meaning |
|---|---|
| `—` | Not started |
| `EXPLORING` | Variants generated, awaiting Bryan's pick |
| `LOCKED` | Bryan picked one. The file in `ui/locked/<ID>/` is now canonical and does not get regenerated. |
| `REVISED` | Was locked, then deliberately changed. The DECISION.md records what changed and why. |

**Only Bryan locks.** Claude generates and recommends; Claude never marks a row
LOCKED without Bryan saying which variant wins.

---

## Build order

Order, template and the exact Claude Design prompt for every widget:
**`ui/BUILD-PLAN.md`**. Build in the order given there — foundations, then the
two anchors, then the screens that lead to them. 25 widgets, 102 variants.

## Foundations — already locked by the design system

These came out of `brand/claude-design/`. They are not explored, not varied, not
redesigned. Every widget below is assembled from them.

| Piece | Source |
|---|---|
| Colour, type, space, radius, motion tokens | `brand/claude-design/tokens.css` |
| Button — primary / secondary / tertiary / destructive | `brand/claude-design/components.html` |
| Chip — neutral / risk / watch / ok | " |
| Spec table row | " |
| Status dot | " |
| Metric (brief match) | " |
| Input | " |
| Card shell + eyebrow | " |
| Segmented toggle | " |
| Progress indicator | " |
| Empty state | " |
| **VisualOption** — 1:1 tile, 3-signal selection | " |

---

## Widgets

Anchor widgets are marked ★ — they carry their screen, they get the full
variation budget, and everything else on that screen is designed around them.

### Client quiz — the client's phone, in a waiting room

| ID | Widget | Anchor | Status | Variants | Locked | Decided |
|---|---|:--:|---|---|---|---|
| W01 | Quiz question screen | ★ | **LOCKED** | 2c of 5 | `ui/locked/W01/` | 2026-09-22 |
| W02 | Style grid + tile | | — | | | |
| W03 | Route chooser | | — | | | |
| W04 | Hair texture picker | | — | | | |
| W05 | Skin tone picker | | — | | | |
| W06 | Preview screen | | — | | | |
| W07 | Summary screen | | — | | | |
| W08 | Barber + email gate | | — | | | |

### Consultation as sales engine — campaign entry

Added 2026-09-18 after grilling. See `docs/adr/0010-countersigned-result-guarantee.md`.

| ID | Widget | Anchor | Status | Variants | Locked | Decided |
|---|---|:--:|---|---|---|---|
| W20 | Campaign landing | | — | | | |
| W34 | Email gate (campaign) | | — | | | |
| W35 | Unbooked render follow-up email | | — | | | |
| W21 | Render reveal + guarantee badge | ★ | — | | | |
| W22 | Render confirmation | | — | | | |
| W23 | Booking handoff | | — | | | |
| W24 | Consultation pass (walk-in shops) | | — | | | |
| W25 | Feasibility check / countersign — stylist | ★ | — | | | |
| W26 | Claim — stylist | | — | | | |
| W27 | Selfie capture + consent | | — | | | |
| W28 | The wait | | — | | | |
| W29 | Refine panel | | — | | | |
| W31 | After photo capture | | — | | | |
| W32 | Brief amendment editor | | — | | | |

### Scan path — introduction, findings, AI twin

Added 2026-09-27 after grilling. See `docs/specs/scan-path.md`, `docs/specs/intro-copy.md`, ADR 0015.

| ID | Widget | Anchor | Status | Variants | Locked | Decided |
|---|---|:--:|---|---|---|---|
| W36 | Introduction · welcome | ★ | **LOCKED** | 3c of 10 | `ui/locked/W36/` | 2026-09-27 |
| W37 | Introduction · how it works | | **LOCKED** | 1 of 3 | `ui/locked/W37/` | 2026-09-27 |
| W38 | Introduction · your face, your rules | | **LOCKED** | 3 of 3 | `ui/locked/W38/` | 2026-09-27 |
| W39 | Introduction · the guarantee | | **LOCKED** | 2 of 2 | `ui/locked/W39/` | 2026-09-27 |
| W40 | Prep checklist + consent | | **LOCKED** | 3 of 3 | `ui/locked/W40/` | 2026-09-27 |
| W41 | Reading your hair | | **LOCKED** | 3 of 3 | `ui/locked/W41/` | 2026-09-27 |
| W42 | Finding screen (yes / no) | ★ | **LOCKED** | 4 of 7 | `ui/locked/W42/` | 2026-09-27 |
| W43 | AI twin check | | **LOCKED** | 1 of 3 | `ui/locked/W43/` | 2026-09-27 |
| W44 | Keep my AI twin | | — | | | |
| W45 | Avatar picker (question path) | | — | | | |

### Shared — built once, used in several flows

| ID | Widget | Anchor | Status | Variants | Locked | Decided |
|---|---|:--:|---|---|---|---|
| W30 | Consent block (Article 9) | | — | | | |
| W33 | Guarantee badge — 2 states | | — | | | |

### Stylist — 30 seconds before the client sits down

| ID | Widget | Anchor | Status | Variants | Locked | Decided |
|---|---|:--:|---|---|---|---|
| W09 | Brief card | ★ | — | | | |

### Owner — standing, on a phone, two minutes

| ID | Widget | Anchor | Status | Variants | Locked | Decided |
|---|---|:--:|---|---|---|---|
| W10 | Client row | ★ | — | | | |
| W11 | Today queue | | — | | | |
| W12 | Retention list | | — | | | |
| W13 | Client detail | | — | | | |
| W14 | Team / brief match | | — | | | |
| W15 | Coaching flag | | — | | | |
| W16 | Handoff screen | | — | | | |
| W17 | Shop + QR | | — | | | |
| W18 | Capacity states | | — | | | |
| W19 | App shell + nav | ★ | — | | | |

---

## Screens

A screen is assembled from locked widgets. A screen cannot be assembled while
any widget it needs is unlocked.

| ID | Screen | Widgets needed | Status | File |
|---|---|---|---|---|
| S01 | Quiz — question | W01 | — | |
| S02 | Quiz — style pick | W01, W02 | — | |
| S03 | Quiz — route chooser | W03 | — | |
| S04 | Quiz — preview | W06 | — | |
| S05 | Quiz — summary | W07 | — | |
| S06 | Quiz — close | W08 | — | |
| S07 | Stylist brief | W09 | — | |
| S08 | Owner — today | W19, W11 | — | |
| S09 | Owner — clients | W19, W10, W12 | — | |
| S10 | Owner — client detail | W19, W13, W09 | — | |
| S11 | Owner — team | W19, W14, W15 | — | |
| S12 | Owner — handoff | W19, W16 | — | |
| S13 | Owner — shop | W19, W17, W18 | — | |

---

## Flows

A flow chains screens. `ui/flows/index.html` is the home base that links them
all — this is what a browser agent navigates during a persona audit.

| ID | Flow | Screens | Status | Audited |
|---|---|---|---|---|
| F01 | Client first visit | S03 → S01 → S02 → S04 → S05 → S06 | — | |
| F02 | Client return visit | S05 → S06 | — | |
| F03 | Owner morning check | S08 → S09 → S10 | — | |
| F04 | Owner handles a leaver | S11 → S12 | — | |

---

## Change log

Every lock, revision and unlock gets one line here, newest first. This is the
record of how the product got its shape.

| Date | ID | What happened |
|---|---|---|
| 2026-09-27 | W43 | **LOCKED** — variant 1, twin as a message. |
| 2026-09-27 | W43 | 3 variants: twin as a message, side by side, slider. Retry once, then own photo. |
| 2026-09-27 | W41 | **LOCKED** — variant 3, narrated. |
| 2026-09-27 | W41 | 3 conversation variants with typing dots, incl. slow and can't-read states. |
| 2026-09-27 | W42 | **LOCKED** — variant 4, conversation. |
| 2026-09-27 | W42 | 7 variants of the finding screen (anchor): spotlight, swipe, pointed out, conversation, billboard, brief builds, ring progress. |
| 2026-09-27 | W40 | **LOCKED** — variant 3, the waiting ring. The introduction (W36–W40) is complete. |
| 2026-09-27 | W40 | 3 variants: pre-flight check, tap as you do it, the waiting ring. Age line moved into the consent label. |
| 2026-09-27 | W39 | **LOCKED** — variant 2, the seal. |
| 2026-09-27 | W39 | 2 stories variants: same chassis, the seal. |
| 2026-09-27 | W38 | **LOCKED** — variant 3, stories continued. Foundation first; photos and copy revisited later. |
| 2026-09-27 | W38 | 3 variants: promises that open, three big promises + sheet, stories continued. |
| 2026-09-27 | W37 | **LOCKED** — variant 1, classic stories. |
| 2026-09-27 | W37 | 3 stories-style variants (auto-play, tap / hold / skip). Bryan chose stories over one crowded screen. |
| 2026-09-27 | W36 | **LOCKED** — variant 3c, the scan ring. Glass added to the design system. |
| 2026-09-27 | W36 | Round 2: 3a–3c from variant 3 — top-down Z path, words arrive one by one, drifting photo. |
| 2026-09-27 | W36 | 7 variants of the introduction welcome screen, glass and solid. Placeholder photo from the style library; awaiting Bryan's pick. |
| 2026-09-27 | W36–W45 | Scan path widgets added. ADR 0015. |
| 2026-09-22 | W01 | **LOCKED** — variant 2c, two-zone chassis. Both modes ship off one frame. |
| 2026-09-21 | — | Visual-first: VisualOption component, density law, 1:1 image spec. W01 prompt rewritten. |
| 2026-09-18 | — | BUILD-PLAN.md added — order, templates, variant budgets, prompts. |
| 2026-09-18 | W35 | Unbooked render follow-up email added. |
| 2026-09-18 | W27–W34 | Floor plan complete — 8 more widgets. See docs/specs/consultation-flow.md. |
| 2026-09-18 | W20–W26 | Seven widgets added — consultation as sales engine. ADR 0010. |
| 2026-09-18 | — | Registry created. Design system locked. |
