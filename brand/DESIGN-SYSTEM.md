# PleromaOS — Design System & Product Design Spec

**Version 1.0 · 18 September 2026**
Source of truth for every PleromaOS surface. Companion to `CONTEXT.md` (domain model) and `ux-context.md` (usability rulings).

---

## 0. How to use this file

This file is written to be handed to a designer or to Claude Design as the complete briefing. It has three layers, and they carry different authority:

| Layer | Sections | Authority |
|---|---|---|
| **Locked** | Brand, colour, type, vocabulary, non-negotiable rules | Do not change. These are decided. |
| **Specified** | Components, screen patterns, states | Build exactly this. Propose changes, don't make them silently. |
| **Open** | Owner dashboard information architecture (§10) | Described, not drawn. This is what you design. |

**The approved reference implementations** are the four mockups: Client Profile (Women), Client Profile (Men), Staff Handoff, Client Retention. When this document and those mockups disagree, the mockups win and this document gets corrected.

**Out of scope for now** — do not design these, do not ask about them: the women's quiz (men only in v1), the style image library, social proof and testimonials, the free-signup pricing flow.

---

## 1. The product in one page

**Category:** client briefing software for salons and barbershops.
Not a consultation app. Not a CRM. Not a booking system.

**What it does:** every appointment gets a precise brief before the client sits down, and the business — not the individual stylist — keeps that record permanently.

**The three problems it exists to solve**, always in this order:

1. **Client retention** — a client disappears and the owner never learns why
2. **Knowledge loss** — everything known about a client lives in one person's head
3. **Staff handoff** — when a stylist leaves, the client has to start over

**Market:** Netherlands first — Amsterdam, Rotterdam, Den Haag, Utrecht. Bilingual English/Dutch from day one.

### The three people who touch it

| | Who they are | Where they are | What the interface owes them |
|---|---|---|---|
| **Salon owner** | Primary user *and* the buyer. Cares about retention and turnover, not craft | On a phone, standing, between clients | Answers, not data. "Who do I call today, and why." |
| **Stylist** | Performs the service. May or may not be the owner | On a phone, 30 seconds before a client sits down | One card. Scannable at arm's length. Zero navigation. |
| **Client** | The end customer. **Not a user** — touches this once, via QR, in a waiting room | Own phone, possibly an old Android, possibly in bright light | A ~20-screen quiz that never feels like 20 screens. One decision per screen. |

The client flow is the hard design problem. This is a stranger with no motivation, sitting in a waiting room, who must complete **every** screen — there is no partial brief — and hand over an email address at the end.


### Chosen with the eyes

**Any choice a client makes that can be shown as a picture is shown as a
picture. Text is the fallback, not the default.**

The client is a stranger with no barbering vocabulary, on a phone, with no
patience. "Shadow fade" is a term they do not know and cannot picture. A
photograph of a shadow fade is understood instantly and needs no vocabulary at
all. Every screen in the consultation is built so the client does as little
thinking as possible.

This applies to the questions too, not only the style catalogue. Where the
difference between options is geometric rather than photographic — fade height,
fade shape, neckline, line sharpness, beard shape — a drawn diagram beats a
photograph, because four photographs of fades at thumbnail size are
indistinguishable while four silhouettes with the line at different heights are
obvious. Barbers already explain these with diagrams.

Three answer types, and every question declares which it uses:

| Type | Use for | Example |
|---|---|---|
| **Photo** | Identity — what thing is this | Style catalogue, hair texture |
| **Diagram** | Geometry — how much, how high, what shape | Fade height, neckline, beard shape |
| **Text** | Abstractions with nothing to depict | Styling effort, Barber's choice |

### Voice

Plain, direct, professional. Short sentences. The owner is addressed as "you." Never breathless, never corporate, never cute. Confident because the problem is real, not because the product is clever.

Pain copy may be punchy and fragmented. Solution copy is settled and assured — the problem was named, here is the answer.

---

## 2. Brand identity

### 2.1 Two marks, two jobs

There are two marks and they are **not interchangeable.**

**A. The Pleroma lockup — the company mark**

`PLEROMA` set in a high-contrast serif, all caps, generously letterspaced, with a circular emblem replacing the **O**: a line-drawn lion's head in forest green facing a brass rising sun. On cream.

Use for: company identity, investor and partner material, letterhead, legal documents, the founding-partner programme, physical print, signage, the app icon.

Rules:
- The emblem always occupies the position of the **O**. It is never lifted out and used alone as an avatar or favicon at small sizes — the lion loses all detail below 48px.
- The emblem may be used alone **only** at 64px or larger, as an app icon or profile mark.
- Minimum lockup width: 180px. Below that, use the product wordmark instead.
- Never recolour the lion. Forest green line, brass sun, always.
- Never add "OS" to this lockup.

**B. The PleromaOS wordmark — the product mark**

`PleromaOS` set in a high-contrast serif: **Pleroma** in ink/cream, **OS** in gold. Mixed case.

Use for: the app, the landing page, every product screen, in-product headers, social share images.

Rules — these are absolute:
- **Capital P, rest lowercase. "OS" in caps and gold. No space.**
- Never `PLEROMAOS`. Never `Pleroma OS`. Never `PleromaOs`. Never all-gold. Never all-ink.
- In small uppercase card eyebrows the lockup appears as `PLEROMA` + `OS` where only the OS carries gold — letterspacing applies to both parts equally.
- The wordmark never sits on a photograph without a solid scrim behind it.
- Minimum width: 96px.

### 2.2 The emblem's meaning

The lion is craft, authority and the barber's trade. The rising sun is the client's result — the thing revealed when the cape comes off. They face each other. That tension is the brand: **the craft you know, the future you need.**

Do not add new symbolism. Do not introduce scissors, combs, razors, chairs or barber poles. The category is software, not a barbershop.

---

## 3. Colour

### 3.1 The theming contract

**Dark is canonical.** It is what ships, what the mockups show, and what the brand reads as. Light mode is a supported equal, not a degraded fallback — but every design decision is made in dark first and then mapped.

Light mode is derived from the cream of the logo lockup, not from generic white. **PleromaOS light mode is warm.** Pure white `#ffffff` never appears as a surface.

The switch is a **single `data-theme` attribute on `<html>`**. Every colour in the product is a semantic token. No component ever names a raw hex value, and no component knows which theme it is in.

```html
<html data-theme="dark">   <!-- default -->
<html data-theme="light">
```

Default resolution order: explicit user choice (stored) → OS preference → dark.

### 3.2 Token table

Both themes define the same token names. This is the entire palette; there are no other colours.

```css
:root[data-theme="dark"] {
  /* Surface */
  --bg:            #141210;   /* page */
  --surface:       #1c1917;   /* card */
  --surface-2:     #242019;   /* inset, nested panel, input */
  --surface-3:     #2b2620;   /* hover / pressed */
  --line:          #332c24;   /* hairline */
  --line-strong:   #453c30;   /* emphasized divider */

  /* Text */
  --ink:           #f4efe6;   /* primary */
  --ink-2:         #b3a894;   /* secondary */
  --ink-3:         #908674;   /* meta, captions */
  --ink-on-gold:   #1a1816;   /* text on a gold fill */

  /* Brand */
  --gold:          #c9a96e;   /* accent fill, emphasis, OS */
  --gold-text:     #c9a96e;   /* gold as text */
  --gold-dim:      #9c8555;   /* gold borders, low emphasis */
  --gold-wash:     #2a2317;   /* tinted background */
  --forest:        #4a7a5c;   /* secondary brand, trust */

  /* Status */
  --ok:            #4a7a5c;  --ok-text:    #6fae86;  --ok-wash:    #1a2a1f;
  --watch:         #c98a4e;  --watch-text: #d99a5e;  --watch-wash: #2a2017;
  --risk:          #c96b56;  --risk-text:  #e07760;  --risk-wash:  #2e1b17;
}

:root[data-theme="light"] {
  /* Surface */
  --bg:            #efe9dd;
  --surface:       #faf6ec;
  --surface-2:     #f3ecdf;
  --surface-3:     #ebe3d3;
  --line:          #ded3c0;
  --line-strong:   #c9bca3;

  /* Text */
  --ink:           #1a1816;
  --ink-2:         #5c5347;
  --ink-3:         #7a6f5e;
  --ink-on-gold:   #1a1816;

  /* Brand */
  --gold:          #c9a96e;   /* fills and marks ONLY — never text */
  --gold-text:     #7d5f22;   /* the accessible gold for type */
  --gold-dim:      #b39359;
  --gold-wash:     #f5ecd8;
  --forest:        #2d4a35;

  /* Status */
  --ok:            #2d4a35;  --ok-text:    #2d4a35;  --ok-wash:    #e4ecdf;
  --watch:         #8a5a1e;  --watch-text: #8a5a1e;  --watch-wash: #f7ead6;
  --risk:          #9e3a2a;  --risk-text:  #9e3a2a;  --risk-wash:  #f7e2dd;
}
```

### 3.3 The three rules that make light mode work

**1. Gold is a fill in light mode, not a type colour.**
`#c9a96e` on cream is a 2.07:1 contrast ratio — unreadable. Any gold *text* uses `--gold-text`, which darkens to `#7d5f22` in light. Gold *fills* (the active segment of a toggle, the primary button) keep `#c9a96e` in both themes, with `--ink-on-gold` text on top at 7.9:1.

**2. In light mode, cards are defined by their border, not their fill.**
`--surface` against `--bg` is only 1.12:1 — deliberately, because a hard white card on cream looks cheap. The 1px `--line` border does the work. In dark mode the reverse is true: the fill separates and the border refines. **Never remove the card border in light mode.**

**3. Status colours darken, they don't just invert.**
The red that reads as urgent on near-black (`#c96b56`) reads as pink on cream. Light mode uses true, darker pigments (`#9e3a2a`). The *meaning* is identical; the value is not.

### 3.4 Semantic assignments

| Meaning | Token | Where it appears |
|---|---|---|
| At risk, overdue, missing brief, destructive | `--risk*` | Retention "AT RISK" group, "No rebooking", "No brief on file", warning chips |
| Watch, not yet rebooked, mismatch flagged | `--watch*` | Retention "WATCH" group, styling-effort mismatch note, approaching capacity |
| On track, rebooked, brief held, confirmed | `--ok*` | Retention "ON TRACK", "Rebooked · 12 Aug", brief match improvements, trust signals |
| Brand emphasis, the product's own voice | `--gold*` | OS in the wordmark, eyebrow labels, spec-row labels, primary CTA, the one loud word in a sentence |

**Colour is never the only signal.** Every status carries a dot **and** a text label **and** a left border. A red dot alone is not a state.

### 3.5 Verified contrast (WCAG 2.1 AA)

| Pair | Dark | Light |
|---|---|---|
| `--ink` on `--surface` | 15.3:1 | 16.4:1 |
| `--ink-2` on `--surface` | 7.5:1 | 7.0:1 |
| `--ink-3` on `--surface` | 4.9:1 | 4.6:1 |
| `--gold-text` on `--surface` | 7.8:1 | 5.5:1 |
| `--ok-text` on `--surface` | 6.7:1 | 9.1:1 |
| `--watch-text` on `--surface` | 5.1:1 | 5.5:1 |
| `--risk-text` on `--surface` | 5.8:1 | 6.3:1 |
| `--ink-on-gold` on `--gold` | 7.9:1 | 7.9:1 |

All pass AA for normal text. `--forest` (`#4a7a5c`) in dark mode is **3.5:1 and is a fill and border colour only** — it is never used for text on dark. That is what `--ok-text` exists for.

---

## 4. Typography

### 4.1 Families

| Role | Family | Fallback stack |
|---|---|---|
| **Display / serif** | A high-contrast transitional serif — **Playfair Display** | `'Playfair Display', Georgia, 'Times New Roman', serif` |
| **UI / sans** | A neutral humanist grotesque — **Inter** | `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` |

Two families. Never a third.

The serif carries **identity**: the wordmark, client names, page titles, and the single emphasis line that closes a card. Everything else — every label, value, control, chip and body sentence — is the sans.

The serif is never used for body copy, never for form labels, never below 17px except inside the wordmark itself.

### 4.2 Scale

Mobile-first. These are the only sizes.

| Token | Size / line-height | Family | Weight | Use |
|---|---|---|---|---|
| `display-1` | 40 / 1.10 | serif | 600 | Landing hero, quiz route chooser |
| `display-2` | 32 / 1.15 | serif | 600 | Screen title, quiz question |
| `title-1` | 24 / 1.25 | serif | 600 | Client name on a brief card |
| `title-2` | 20 / 1.30 | serif | 600 | Section headline, modal title |
| `heading` | 17 / 1.35 | sans | 600 | Subsection, option card label |
| `body` | 16 / 1.50 | sans | 400 | Default text, spec values |
| `body-sm` | 14 / 1.45 | sans | 400 | Secondary lines, quotes, meta |
| `caption` | 13 / 1.40 | sans | 400 | Timestamps, helper text |
| `micro` | 11 / 1.30 | sans | 600 | **Uppercase, letter-spacing 0.12em.** Eyebrows, spec-row labels, group headers, card kickers |

`micro` is the system's signature. `CLIENT KNOWLEDGE`, `LENGTH`, `TECHNIQUE`, `AT RISK`, `VISUAL REF`, `PLEROMAOS · CLIENT PROFILE` — all `micro`.

Desktop (≥768px) may step `display-1` to 56 and `display-2` to 40. Nothing else changes; this is a phone product.

**Never reduce font size to make copy fit. Cut the copy.** On screens ≤390px, body copy fits in two lines at reading size or it gets rewritten.

### 4.3 Emphasis — the billboard rules

These rules were earned and they are locked.

**Gold marks the single most important word.** Not a phrase, not a clause — the word carrying the meaning.

- ✓ `The data belongs to your business now.` — *data* and *business* are the idea
- ✓ `You know exactly who to reach out to — and why.`
- ✗ Gold on a preposition, connector, or timing word

**Nothing is ever dimmed to create hierarchy.** You make the important word louder; you never make the rest quieter. Both tiers stay fully legible. Muting supporting copy below 65% opacity is a bug, not a style.

**Gold wins the eye's first pass on dark backgrounds regardless of position.** If a gold line sits below a cream line at the same size, it gets read first and the intended order reverses. Two fixes, both required:

- Use a **size build**: small setup line → large gold payoff, with 8px between them. Scale forces the reading order.
- Write the gold line so it **works as a standalone sentence**. If it needs the line above it to make sense, rewrite it. "So did the knowledge" fails. "The knowledge stayed too" passes.

**One emphasis per block.** Two gold words in one sentence is the maximum, and only when they are the same idea ("data" / "business").

---

## 5. Space, shape and depth

### 5.1 Spacing

8px base grid. `4` is permitted only inside a component (chip padding, icon gaps).

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`

| Context | Value |
|---|---|
| Screen side gutter (mobile) | 16 |
| Card padding | 20 |
| Card internal section gap | 20, with a hairline between |
| Between stacked cards | 16 |
| Between label and value in a spec row | 16 horizontal |
| Chip row gap | 8 |
| Between a heading and its content | 12 |
| Between major page sections | 40 |

Be generous. Cramming is a documented violation of this brand.

### 5.2 Radius

| Token | Value | Use |
|---|---|---|
| `r-sm` | 8px | Inputs, small tiles, image thumbnails |
| `r-md` | 10px | Inner panels, option cards, callouts |
| `r-lg` | 14px | **Card default** |
| `r-xl` | 20px | Phone-frame containers, sheets |
| `r-pill` | 999px | Chips, segmented toggles, buttons, avatars |

### 5.3 Borders and depth

**This system has no drop shadows.** Depth is expressed through surface value and hairlines. A shadow on a near-black surface is invisible; a shadow on warm cream looks like a different product.

- Every card: `1px solid var(--line)`
- Every divider: `1px solid var(--line)`, full bleed inside the card padding
- Emphasis dividers and left status rails: `var(--line-strong)` or the status colour
- Status rail on a list row: `3px` solid left border in `--risk` / `--watch` / `--ok`
- Focus ring: `2px solid var(--gold)` with `2px` offset, in both themes

Elevated layers (sheets, modals) step **up** the surface scale (`--surface` → `--surface-2`) and add a full-screen scrim of `rgba(0,0,0,.55)` in dark, `rgba(26,24,22,.35)` in light.

### 5.4 Layout

- Mobile-first. Content column max **420px** for client-facing flows, **720px** for owner dashboard cards, **1120px** for the dashboard shell on desktop.
- Breakpoints: `480` / `768` / `1120`.
- A brief card is a **single column at every width.** It does not become two columns on desktop — the stylist reads it on a phone, and the desktop view must be identical so nothing is learned twice.

---

## 6. Motion

Purposeful only. This product runs on old phones in waiting rooms.

| Motion | Duration | Easing |
|---|---|---|
| State change (hover, press, toggle) | 120ms | `ease-out` |
| Screen advance in the quiz | 220ms | `cubic-bezier(.２,.8,.2,1)` — slide + fade |
| Card or sheet entrance | 260ms | `ease-out` |
| Progress bar fill | 300ms | `ease-in-out` |

Rules:
- Nothing animates longer than 300ms except the deliberate brand intro on the landing page.
- The quiz advances in **one direction**: forward slides left, back slides right. The direction is the only orientation cue the client gets.
- Never animate to attract attention. Animation guides, it does not decorate.
- Respect `prefers-reduced-motion`: replace all movement with a 100ms opacity fade.

---

## 7. Component library

Every component below is specified with its anatomy and its states. States are not optional — a component without its empty, loading and error states is not finished.

### 7.1 Card

The container everything lives in.

- `--surface`, `1px --line`, `r-lg`, padding 20
- Optional **eyebrow** at the top: `micro`, `--ink-3`, with the wordmark lockup and a `·` separator — `PLEROMAOS · CLIENT PROFILE`. Only the `OS` is `--gold-text`.
- Optional **closing line** at the bottom, above a hairline: `body` sans with one or two gold emphasis words, followed by a `caption` in `--ink-3`.

States: default · loading (skeleton bars at `--surface-2`, no spinner) · empty (see 7.18) · error.

### 7.2 Card eyebrow

`micro` uppercase, letter-spacing 0.12em, `--ink-3`. Sits 0px from the card top padding, 16px above the content. Always a two-part construction: product mark `·` screen name.

### 7.3 Section label

The floating label *above* a card — `CLIENT KNOWLEDGE`, `STAFF HANDOFF`, `CLIENT RETENTION`. `micro`, `--gold-text`, centred, 16px above the card.

### 7.4 Group header

Inside a list, dividing it — `AT RISK`, `WATCH`, `ON TRACK`. `micro`, coloured to its group's status token. 24px above, 8px below.

Never repeat a value across every instance. If every header says the same thing it carries no information — name the specific thing instead.

### 7.5 Segmented toggle

Two or three mutually exclusive options. The shape communicates "pick one."

- Track: `--surface-2`, `1px --line`, `r-pill`, padding 4
- Segment: `r-pill`, padding 10/24, `heading` weight 600
- Active: `--gold` fill, `--ink-on-gold` text
- Inactive: transparent, `--ink-2`
- Minimum height 44px

**Never use bare text labels for a choice between options** — including the EN/NL language switch. Plain text reads as body copy, not as a control.

### 7.6 Chip

A short read-only fact. Not a button, not a filter.

- `r-pill`, padding 6/14, `body-sm`
- **Neutral:** `--surface-2` fill, `--line` border, `--ink` text — specs, techniques, preferences
- **Risk:** `--risk-wash` fill, `--risk` border, `--risk-text` text, optional `⚠` — allergies, sensitivities, "No rebooking", "No brief on file"
- **Watch:** `--watch-wash` / `--watch` / `--watch-text` — "Not yet rebooked", "5 wks overdue"
- **Ok:** `--ok-wash` / `--ok` / `--ok-text` — "Rebooked · 12 Aug", "First visit · Jayden", "held"

Chips wrap to multiple rows with 8px gaps. They are never truncated and never scroll horizontally.

**A chip is never tappable.** If it looks like a link or shows a pointer cursor and does nothing, that is a trust failure. Make it work or make it look static.

### 7.7 Spec table

The core of the brief card. A stack of label/value rows.

- Two columns: label at a fixed `104px`, value fills the rest, 16px gap
- Label: `micro`, `--gold-text`
- Value: `body`, `--ink`, wraps freely to as many lines as it needs
- `1px --line` between rows; none after the last
- Row padding: 12 vertical

Labels are domain terms and are fixed: `LENGTH` · `TECHNIQUE` · `COLOUR` · `PRODUCT` · `NEXT VISIT` · `NEXT COLOUR`.

**Raw internal values are never displayed.** `very-short` renders as "Very short". `burst` renders as "Burst fade". Every stored key has a display label.

### 7.8 Status dot

10px circle in `--risk` / `--watch` / `--ok`. Always accompanied by a text label. Never the sole carrier of meaning.

### 7.9 Client row

The unit of every list the owner reads.

```
│ ●  Name                              58% ↓
│    Every 4 wks · [chip] [chip]
│    "quote from the last visit" — source
```

- 3px status rail on the left in the group's colour
- Dot + name (`heading`, `--ink`) on the left, metric on the right
- Meta line: `body-sm`, `--ink-3`, with inline chips
- Optional quote: `body-sm`, *italic*, `--ink-2`, with an em-dash attribution in `--ink-3`
- Full row is tappable → client detail. Minimum height 64px.
- `1px --line` between rows

### 7.10 Metric

The brief match percentage.

- `heading` weight 600, coloured by band: ≥90 `--ok-text` · 75–89 `--ink` · 60–74 `--watch-text` · <60 `--risk-text`
- Optional trend arrow `↓` / `↑` immediately after, same colour
- Optional transition form: `96% → 94%` — the old value in `--ink-3`, arrow in `--ink-3`, new value in its band colour

Label it `BRIEF MATCH`. **Never "accuracy."**

### 7.11 Person tile

Used in the handoff pairing.

- Avatar: `r-pill` circle, 36px, `--surface-3` fill, single initial in `--ink-2`
- Name `heading` `--ink`, status line `caption` `--ink-3`
- Departing person: tile at `--surface-2`, `--line` border, name in `--ink-2`
- Arriving person: tile at `--gold-wash`, `--gold-dim` border, name in `--ink`
- Separator between the two: a `→` in `--ink-3`

A departed stylist appears greyed as **"Former staff."** History stays credited to them; it is never reassigned.

### 7.12 Visual ref frame

The client's photo or rendered preview.

- `r-sm`, `1px --line`, aspect ratio 3:4, object-fit cover
- Caption below, centred: `VISUAL REF` in `micro`, `--ink-3`
- Empty state: `--surface-2` fill with `VISUAL REF` centred in `--ink-3` at 30% — no icon, no placeholder illustration

**Every haircut image is a reference, never a promise.** Where a reference photo shows a style, the caption must name what the client actually chose and flag what differs: `Textured Crop · your sides: high skin fade`. The photo's sides are not the client's decision.

### 7.13 Callout panel

A highlighted block inside a card — the auto-outreach summary, a coaching flag, a mismatch note.

- `--gold-wash` fill, `1px --gold-dim`, `r-md`, padding 16
- Title row: `micro` in `--gold-text`, optional leading icon
- Inline stat group: number in `heading`, label in `caption` `--ink-3`, dot-prefixed
- Quoted body: `body-sm` italic `--ink-2`

Variants swap the wash and border to `--risk-*` or `--watch-*` for warnings.

### 7.14 Buttons

| Variant | Fill | Border | Text | Use |
|---|---|---|---|---|
| **Primary** | `--gold` | none | `--ink-on-gold` | The one action on the screen |
| **Secondary** | transparent | `1px --gold-dim` | `--gold-text` | Alternative action |
| **Tertiary** | transparent | none | `--ink-2`, underlined | Back, skip, cancel |
| **Destructive** | transparent | `1px --risk` | `--risk-text` | Delete photos, delete everything |

- Height 52px for primary actions, 44px minimum for everything else
- `r-pill`, `heading` weight 600, horizontal padding 24
- Full width on mobile for the primary action
- States: default · hover (+6% lightness) · pressed (scale .98) · focus (gold ring) · **disabled** (40% opacity, no pointer) · **loading** (label replaced by three pulsing dots — the button keeps its width)

**A secondary action must look like a button.** Plain text with an arrow is invisible on a phone where there is no hover. It needs a border at minimum.

**One destination, one label.** If two entry points lead to the same place they use identical wording.

**Every CTA answers "what happens next?"** in adjacent copy. A button with no consequence stated is unfinished.

### 7.15 Input

- `--surface-2` fill, `1px --line`, `r-sm`, height 52, padding 16
- Text `body` `--ink`; placeholder `--ink-3`
- Label above in `micro` `--ink-2`; helper below in `caption` `--ink-3`
- Focus: border `--gold`, 2px ring
- Error: border `--risk`, message below in `caption` `--risk-text` — **message states what to do**, not what went wrong
- Email input: `type="email"`, `inputmode="email"`, `autocomplete="email"`, no autocapitalise

### 7.16 Option card — the quiz answer

The single most-used component in the product. One question per screen, tap to answer, auto-advance.

**Text option:**
- Full width, `--surface` fill, `1px --line`, `r-md`, padding 16/20, min-height 56
- Label `heading` `--ink`, left-aligned
- Optional description `body-sm` `--ink-3` on a second line
- Selected: `--gold-wash` fill, `--gold` border, label stays `--ink`
- Stacked with 12px gaps

**Image option (style tiles):**
- 3-column grid on mobile, 12px gutters
- Image `r-sm`, aspect 3:4, then name `body-sm` `--ink` centred below, then a maintenance badge
- Maintenance badge: `micro` chip — Low / Medium / High / Variable
- Selected: `2px --gold` border on the image and a gold check in the top-right corner

**"Barber's choice"** is always the **last** option and always visually de-emphasised — tertiary styling, no fill. It appears only on fade height, fade shape and neckline. Never on line sharpness.


### 7.16b Visual option — the default choice control

How a client picks anything. Text options (7.16) are the exception now, not the
rule.

**Anatomy.** A 1:1 frame, `r-md`, `overflow: hidden`, with the image filling it;
the label beneath in `body-sm`; optionally a `micro` meta line under that for
upkeep level.

**Selection takes three signals at once**, because a thin gold border vanishes
against a photograph of a face:
- the frame border turns `--gold` at 2px
- a filled gold check appears at the top-right of the frame, 28px
- the label turns `--gold-text` and goes 600

**Density is a law, not a preference.**

| Context | Columns | Tile | Cap |
|---|---|---|---|
| **Question** | 2 | 173px | **4 options. Never scrolls.** |
| **Catalogue** (the 21-style grid) | 3 | 111px | unlimited, scrolls |

The arithmetic: 390px screen, 16px gutters, 12px tile gap. Four tiles, header,
question and a Barber's-choice row total 738px in an 844px screen. On a 667px
phone it overflows by about 25px — a small scroll on the oldest hardware, which
is accepted.

A catalogue is not a question. Twenty-one styles will never fit a screen and
must not try.

**Hair texture is the one documented exception at five options.** Straight-fine
and straight-coarse behave differently and may not be merged. The fifth tile
centres itself across both columns at normal size.

**Barber's choice can never be a tile** — there is nothing to photograph. It is
always a full-width text row beneath the grid, which is also how it stays
de-emphasised.

**The reference caveat appears once beneath the grid**, never on every tile.

### 7.16c Image production spec

The tiles are only as good as what goes in them. Shoot and crop the library to
this or the layout falls apart:

- **1:1 square.** Locked. It governs 783 generated images — changing it later
  means re-cropping all of them.
- **Tight head crop.** No shoulders, no chest, no background furniture. The head
  fills the frame. At 111px a loose portrait is unreadable, and the crop matters
  more than the tile size.
- **Consistent angle and lighting** across the whole set, so the grid reads as
  one system rather than a folder of search results.
- The principle is already proven in the render pipeline: `cropReference()`
  crops to the top 55% because less of the other person is better.

### 7.17 Progress indicator

- A 3px bar pinned under the header, `--surface-2` track, `--gold` fill
- Beside it, the **section name** in `micro` `--ink-3` — `STYLE` · `SIDES` · `BEARD` · `REVIEW`
- **Never a screen count.** "7 of 23" makes a client quit. The section name tells them where they are without telling them how far is left.

### 7.18 Empty state

- Centred, `--ink-3`, `body`
- One sentence naming what will appear here and what causes it: *"Briefs appear here as clients complete them."*
- One action if an action exists
- **No illustrations, no icons, no mascots.**

### 7.19 Sheet / modal

- Bottom sheet on mobile, centred dialog ≥768px
- `--surface-2`, `r-xl` top corners, scrim behind
- Drag handle: 40×4px, `--line-strong`, centred, 12px from top
- Title `title-2`, body `body`, actions stacked full-width
- Dismissible by scrim tap and by a visible Cancel. Escape closes it.

### 7.20 Toast

- Bottom, 16px inset, `--surface-3`, `1px --line`, `r-md`, padding 12/16
- `body-sm` `--ink`; a leading 8px status dot when it carries a state
- 4 seconds, dismissible. Never used for errors that need a decision.

---

## 8. Screen pattern — the client quiz

This is the flow a stranger completes on their own phone in a waiting room.

### 8.1 Shape

```
Scan shop QR
  ↓
S0   Gender                    → Male only in v1
S0b  Hair texture              → hard-filters everything that follows
S0c  Skin tone                 → 3 unlabelled faces, skippable
  ↓
SR   Route chooser
     ├─ "Choose a famous style"  → preset grid (21 + "don't see it" upload)
     └─ "Build my own style"     → current style → keep or change → length → alternatives
  ↓
SE   Styling effort            → both routes
  ↓
SIDES   fade type → height → shape → line sharpness → neckline
BEARD   state → patches → density → fading → lines → neckline → style → moustache
  ↓
P1   Preview                   → style reference captioned with the real sides choice
S17  Summary                   → every detail listed, every detail editable
S18  Barber + email            → HARD BLOCK. No email, no brief.
```

### 8.2 Screen anatomy

Every question screen is identical in structure. This consistency is what makes 20 screens survivable.

```
┌────────────────────────────┐
│ ←   ▓▓▓▓▓░░░░░   SIDES     │  header: back, progress, section
├────────────────────────────┤
│                            │
│  How short on the sides?   │  display-2, serif, max 2 lines
│  Pick the closest.         │  body, --ink-3, optional
│                            │
│  ┌──────────────────────┐  │
│  │ Skin fade            │  │  option cards
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ Close fade           │  │
│  └──────────────────────┘  │
│  ...                       │
│                            │
│  Barber's choice           │  de-emphasised, last
└────────────────────────────┘
```

- Back is **always** present and always works. There is no dead end.
- Tapping an option selects it and advances after 220ms. No "Next" button on single-select screens.
- Questions are phrased in plain language a client uses, never in trade vocabulary. "How short on the sides?" — not "Select sides configuration."
- Never more than 6 options on one screen.

### 8.3 Rules the design must enforce

- **Every screen is completed or no brief exists.** There is no skip, no "finish later", no partial state. The only escape is "Barber's choice" where offered.
- **Email is the last thing asked**, after the client has seen their brief, on the same screen as choosing their barber. Never at the start. The copy explains why: *"Enter your email to send your brief to your barber."*
- **Hair texture hard-filters the style catalogue.** Cuts that are impossible for a texture are **hidden, not greyed.** Exception: the "what do you have now" screen shows everything — a client must always be able to describe their own head.
- **Skin tone is presentation only.** Three unlabelled rendered faces, *"Which looks closest to you?"*, skippable, defaults to medium. No ethnic labels, no text categories, nothing stored as ethnicity. Ethnicity is Article 9 data and is deliberately never asked.
- **Current state and goal state are separate things.** A gap between them is a transition plan, not a contradiction. Both appear on the brief when they differ.
- **Long transitions surface on the summary only** — one line: *"This style needs significant growth — this is a longer journey."* Never a mid-flow blocker.
- **Styling-effort mismatch is a note, never a block.** If a high-maintenance style meets a low-effort answer, the brief flags it for the barber. The client is not redirected.
- **Drafts save per screen** and resume on reopen, across devices. Unsubmitted drafts delete after 24 hours.
- **Selfies are special-category data.** Separate explicit consent at capture, in plain language, with a visible deletion option. "Delete my photos and clone" must be separable from "delete everything" — the salon keeps its brief history either way.

### 8.4 Summary screen

Every answer, grouped by section, every line tappable to edit. Uses the spec table component. Shows the transition warning and the effort-mismatch note if either applies. Then the email gate.

---

## 9. Screen pattern — the stylist brief card

The card a stylist opens 30 seconds before a client sits down. The approved Client Profile mockups are the reference.

Order, top to bottom:

1. Eyebrow — `PLEROMAOS · CLIENT PROFILE`
2. Name (`title-1` serif) + visual ref frame, side by side
3. Meta — "Client since March 2024 · 7 visits" / "Last seen: Maya · 3 wks ago"
4. Hairline
5. Chip row — preferences first, then **any risk chip last so it lands on its own line and is unmissable** (allergy, sensitivity)
6. Spec table — the brief itself
7. Hairline
8. Closing line with gold emphasis + provenance caption

**The two data layers must be visually distinct.** *Preferences* persist across visits; *this visit* was asked fresh. The stylist needs to know which is which at a glance — a `micro` divider label between the two groups in the spec table is sufficient. Do not merge them.

Post-visit notes from the client appear as an italic quote, attributed.

---

## 10. Owner dashboard — what must exist

**This section is open. It describes what the dashboard has to do; the design is yours.**

The owner is standing, on a phone, with two minutes. The dashboard's job is to answer one question: **what do I need to do today, and why.** It is not a reporting tool. Numbers only appear when they lead to an action.

### 10.1 Shell

Four destinations, bottom tab bar on mobile, side rail ≥768px:

| Tab | Purpose |
|---|---|
| **Today** | The live queue — briefs submitted right now, waiting to be picked up |
| **Clients** | Retention: who is at risk, who to reach out to, who is on track |
| **Team** | Stylists, brief match by person, coaching flags |
| **Shop** | QR code, staff management, plan and usage, settings |

The header carries the PleromaOS wordmark and the theme toggle. Nothing else. **No refresh button** — a browser function in a product nav reads as a product feature and makes the app feel unstable.

### 10.2 Today

The queue of briefs submitted via the shop QR, newest first, unclaimed at the top. Each entry: client name (or "New client"), chosen barber, time submitted, and a one-line summary of the cut. Tapping opens the full brief card (§9).

Empty state: *"Briefs appear here as clients complete them."* plus the shop QR, because an empty queue usually means the QR isn't out where clients can see it.

### 10.3 Clients — retention

The approved Client Retention mockup is the reference. Grouped `AT RISK` / `WATCH` / `ON TRACK`, each a client row (§7.9) with their cadence, overdue state, rebooking state, brief match, and their last-visit quote.

The quote is the most valuable element on the screen — it is *why* the client is at risk, in their own words. It is never truncated to a single line.

Needs: a filter or sort, a client detail view (brief + full visit history + all past briefs), and an outreach action on an at-risk client.

### 10.4 Team

Per stylist: brief match trend, number of clients, recent visits. Surfaces **coaching flags** — a pattern of low brief match in one skill area — and the **training recommendation** that goes with it.

**The app recommends, the owner decides.** A coaching flag is always owner-initiated. The interface suggests; it never sends, never warns, never disciplines. Language here is careful: this is a small business where the owner and the stylist see each other every day.

### 10.5 Handoff

Triggered when a stylist is marked as leaving. The approved Staff Handoff mockup is the reference: the departing/arriving pair, what transfers (visual ref, specs, visit notes, full history), the auto-outreach summary (sent / opened / confirmed), and the brief match before → after across the new stylist's first visits.

Clients with no brief on file appear at the bottom in risk styling — they are the ones actually at risk of being lost, and that contrast is the whole argument for the product.

### 10.6 Shop

The QR code, large and printable. Staff list. Plan and brief usage.

**The capacity state is a real screen that must be designed.** When the shop passes its monthly brief limit, a soft grace of about ten briefs continues to work while the owner sees an urgent upgrade prompt. After the grace, new briefs are blocked — and **the client never sees an error.** The block surfaces to the owner; the QR page shows the shop as "at capacity." Three states to draw: approaching, in grace, blocked.

---

## 11. Language and copy

### 11.1 Locked vocabulary

These words are decided. Do not substitute synonyms in any interface text.

| Use | Never |
|---|---|
| **Brief** | profile, form, questionnaire, consultation note |
| **Brief match** | accuracy, satisfaction, rating, score |
| **Client retention** | churn, retention rate |
| **Knowledge loss** | staff turnover impact, knowledge transfer |
| **Staff handoff** | transition, onboarding transfer |
| **Founding partner** / **Design Partner** | early adopter, beta user, pilot customer |
| **Post-visit notes** | review, rating, feedback |
| **Coaching flag** | performance review, warning, alert |
| **Training recommendation** | course suggestion, HR action |
| **Maintenance level** | effort level, styling time |
| **Outreach** | notifications, campaign, messages |
| **Barber's choice** | no preference, skip, I don't know |

**Client** always means the end customer. The salon owner is "the salon owner" or, in copy, "you." The owner is never called a client.

### 11.2 Writing rules

- Labels describe their destination accurately. A label and its destination that disagree is a broken sign.
- Trust and capability copy must be universally understandable. Never name third-party software a reader might not use — "Works with any booking system," not "No Fresha needed."
- No gendered pronouns for clients or stylists in generic copy. "A client", "a regular", "they". PleromaOS sells to barbershops and salons equally, and "she hasn't rebooked" excludes half the market in one word.
- No analogue-era references. Salon owners use digital booking — "the calendar", never "the book" or "the diary".
- Error messages say what to do next, not what went wrong.
- Never open defensively or with a negative premise.

### 11.3 English / Dutch

Bilingual from day one, `data-en` / `data-nl` on every user-facing string, auto-detected from the browser, saved locally, with a visible segmented toggle.

**Dutch runs 20–30% longer than English.** This is a layout constraint, not a translation task:

- Every button, chip, label and tab must hold its longest Dutch string without truncating or wrapping awkwardly. Design in Dutch for the tightest components.
- Fixed-width label columns in the spec table must be checked against Dutch terms.
- Never truncate a Dutch label with an ellipsis to make an English layout work. Reflow, or shorten the source term for both languages.
- Domain nouns that are genuinely Dutch in the trade keep their Dutch form with the English meaning beside it on first use.

---

## 12. Accessibility

Non-negotiable, both themes.

- Text contrast ≥ 4.5:1. Verified values in §3.5.
- Touch targets ≥ 48×48px with ≥8px between them.
- Colour is never the only carrier of meaning — every status has a dot, a label and a rail.
- Visible focus on every interactive element: 2px `--gold` ring, 2px offset.
- Full keyboard operability. Logical tab order. Escape closes every overlay.
- Every input has a real `<label>`. Placeholder text is never a label.
- Images carry alt text describing the *style*, not the person.
- `prefers-reduced-motion` replaces all movement with a 100ms fade.
- Type scales with the OS text-size setting; nothing is locked in px at a size that cannot grow.
- The theme toggle is reachable in two taps from anywhere.

---

## 13. Do and don't

**Do**

- Design in dark first, then map to light using the tokens
- Use `micro` uppercase labels generously — they are the system's signature
- Give one screen one job
- Let content breathe; 20px card padding is a floor, not a ceiling
- Make every status readable without colour
- Write the gold word first, alone, and check that it stands by itself
- Show, rather than name, anything the client has to choose
- Use a diagram where the difference is geometric, not photographic
- Design visual screens against real photographs, never grey placeholders

**Don't**

- Introduce a colour that isn't in §3.2
- Use gold as text in light mode
- Use a third typeface
- Add a drop shadow
- Dim text to create hierarchy
- Style something to look tappable when it isn't
- Show a raw internal value
- Show a screen count in the quiz
- Put a browser function in the product nav
- Use an illustration or a mascot in an empty state
- Shrink the font to fit the copy — cut the copy
- Use a text list where a picture would do
- Put more than four options in a visual question
- Rely on a border alone to show a tile is selected
- Make Barber's choice a tile

---

## 14. Deliberately out of scope

Named so nobody designs them by accident:

- **Women's quiz** — men only in v1. Colour is a women's-quiz concern and does not appear in the male brief.
- **Style image library** — being completed separately. Design against placeholders.
- **Social proof, testimonials, counts** — nothing real exists yet.
- **Free-signup and pricing flows** — the model has pivoted to freemium, but that ships after the app is finished. Design the capacity states (§10.6); do not design a checkout.
- **Booking-system connectors** — Enterprise only, built per customer.


---

## Glass (added 2026-09-27, with W36)

A translucent, blurred panel or button with a fine edge. Used only where
something sits over imagery (a photo, the camera); on a flat background it is
just a grey panel and must not be used.

- Panel: `--surface` at 62%, `backdrop-filter: blur(22px) saturate(140%)`,
  1px edge of `--ink` at 18%, top edge `--ink` at 30%.
- Button / tile: `--surface` at 44%, same blur and edge.
- Gold glass button: `--gold` at 82%, text `--ink-on-gold`.
- Built with `color-mix()` from existing tokens, so both themes follow.
- **No shadow** — the no-shadow rule still holds.
- Text on glass must still pass 4.5:1; frost more rather than risk it.
- Keep it to a few panels per screen: blur is costly on old phones.
