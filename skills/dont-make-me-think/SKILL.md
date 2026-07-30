# UX Principles: Don't Make Me Think

## How This Skill Works

**Before every audit or design session:**
Read `/Users/Bryan/Pleroma/ux-context.md` — this is the evolving memory file. It contains principles reinforced from real work on PleromaOS and grows with every session. Incorporate its contents into your review before saying anything.

**After every audit or design session:**
Propose 1–3 additions to `ux-context.md` based on what you found. Write the proposed additions in the format already used in that file. Do not add them silently — show them to the user and ask if they should be saved.

**When saving additions:**
Use the Edit tool to append them to `/Users/Bryan/Pleroma/ux-context.md` under "Principles Reinforced" and move the relevant items off the "Open Issues" list.

This skill evolves. Every project teaches something. If you discover a new violation pattern that isn't in `ux-context.md` yet, propose it.

---

## The Prime Directive

**Eliminate cognitive load that doesn't serve the user's goal.**

Every time a user has to stop and think — "What does this mean?", "Where does this go?", "Is that clickable?" — they spend willpower they could spend on their actual task. Question marks erode trust and energy. Your job is to get rid of them.

A page should be *self-evident*. If it can't be self-evident, it must at least be *self-explanatory*. If it genuinely requires instructions, redesign it — because most users won't read instructions anyway.

---

## How Users Actually Behave

**1. Users scan, they don't read.**
They're hunting for the word or phrase that matches their goal and ignoring everything else. Design for billboard speed. If something important only reveals itself after careful reading, most users will never see it.

**2. Users satisfice, they don't optimize.**
They click the first thing that looks *reasonable*, not the best option. Make the right choice obvious and prominent, not just available.

**3. Users muddle through, they don't figure things out.**
Most people use things with partially wrong mental models and still get by. They don't read instructions. Design for this reality.

---

## Designing for Scanning

**Use conventions.** Logo top-left, nav at top, search top-right. Conventions exist because they work. Only deviate when you genuinely improve on the convention.

**Create visual hierarchy.** More important = more prominent (bigger, bolder, higher, more contrast, more space). A strong hierarchy lets the eye do preprocessing so the brain doesn't have to.

**Break pages into clearly defined areas.** Users should be able to scan a page and instantly categorize each region: navigation, content, utility, promotional.

**Make clickable things obviously clickable.** On mobile (no hover state): shape and color must signal clickability alone — users cannot discover affordances by mousing around. Ghost links (plain text + arrow) are invisible on mobile. Secondary CTAs need a visible outlined shape.

**Kill noise.** Three kinds:
- *Shouting* — everything competing for attention means nothing gets it
- *Disorganization* — no grid, no alignment
- *Clutter* — too much stuff; low signal-to-noise buries the signal

---

## Words and Copy

**Omit needless words.** Cut half the words on every page, then half again.

**Kill happy talk.** Introductory text that welcomes users or explains what they're about to see — delete it. Users skip it and it signals the product is more interested in itself than the user.

**Write specific taglines.** "We bring your dream to life" means nothing. A tagline should tell a complete stranger exactly what the product does and why it matters, in one phrase.

**Billboard coloring.** In sentences carrying high emotional weight, rank words by importance using color:
- **Gold** = highest-weight words (consequence, fear, loss, the specific pain)
- **White** = standard readable text, everything else
- Nothing gets dimmed. Both tiers are fully legible. The hierarchy is about elevation, not suppression. You make important words louder — you do NOT make other words quieter.

---

## Traffic Sign Logic

Every major section transition needs a signpost that matches what the user is about to see.
A CTA or link label must describe its destination accurately — not what you wish it were.

**Broken sign pattern:** A button says "See how it works →" but leads into a problem section. The user expected a feature demo. The sign lied.

**Rule:** Label = destination. Always. No exceptions.

Section narrative order matters too. Within each beat:
1. **Problem copy first** — the pain, stated clearly in words
2. **Solution diagram second** — what PleromaOS gives you instead

Never show a diagram before describing the problem it solves. The user has no frame of reference.

---

## Diagrams Must Show the Solution

Diagrams placed after problem copy should show the *solution state* — what things look like when the product is working. The problem was already described in words. The diagram is the answer, not the question repeated visually.

**Violation pattern:** Showing a diagram of fading clients (problem) after already writing copy about fading clients (problem). The diagram added nothing.

---

## Visual Metaphors Cannot Block Content

Fades, gradients, and overlays used as metaphor are only valid if all content remains fully readable.

**Rule:** A metaphor that hides content is not a metaphor — it's an error. Use color coding and opacity on individual elements (dots, text weight) instead of overlaying a dark gradient on the whole block.

---

## Fake Interactivity Destroys Trust

Any element that looks interactive but does nothing is a violation. `cursor:pointer`, arrow icons, link-style color — these all promise interaction. If nothing happens, the user feels tricked.

**Rule:** Either make it work or make it look static. Never halfway.

---

## Choices and Clicks

**Mindless clicks beat hard clicks.** The number of clicks matters far less than the difficulty of each click. Never make users figure out which category they fall into before they can proceed.

**When choices are unavoidable, provide just-in-time guidance** — brief, placed exactly where it's needed.

---

## Navigation

Every page must silently answer: *Where am I? Where can I go? How do I get back?*

**Language selectors need affordance.** Never use bare text labels — they look like body copy. Use a segmented pill toggle (shape communicates "pick one") or a globe icon + current language chip.

**Progress indicators must be wired correctly.** Clicking a dot or navigation element must update scroll state consistently. Bypassing the scroll controller desynchronizes state and causes directional errors.

**Section labels must be specific.** Repeating "The problem" three times in a row adds noise after the first instance. Make each label describe what *that* section is actually about.

---

## The Home Page

The value proposition must be immediately legible — visible without scrolling, without reading anything carefully. If a new visitor can't explain what the product does after 5 seconds, the home page has failed.

---

## Forms

- Every field label must be visually tied to its input
- Never ask for information that isn't needed right now
- Error messages must specify what went wrong and how to fix it
- Inline validation beats form-level validation

---

## Mobile

- Affordances must be visible without hovering — shape and color signal what's tappable
- Simplify aggressively: don't port the full desktop experience to a small screen
- Mobile text density: body copy on screens ≤ 390px should fit in 2 lines. If it can't, cut the copy — not the font size. Smaller fonts cause abandonment.

---

## Trust and Goodwill

**Build goodwill by:**
- Surfacing information users need before they have to hunt for it
- Making errors easy to recover from
- Treating the user as intelligent and their time as valuable

**Destroy goodwill by:**
- Hiding required information
- Browser-native functions (like refresh) appearing as product UI
- Insider language in trust signals — only meaningful to users of that specific software
- Trust signals at opacity below readable threshold — they cannot be read and therefore cannot build trust

---

## When Reviewing Any Design — Run This Checklist

Flag every violation, not just the ones asked about. Then read `ux-context.md` and check for project-specific patterns too.

1. **Cognitive load:** What makes users stop and think unnecessarily?
2. **Scanning:** Can someone understand this in 3 seconds without reading carefully?
3. **Visual hierarchy:** Does the most important thing look the most important?
4. **Traffic signs:** Does every label match its destination? Is there a signpost before every major section transition?
5. **Clickability:** Is it obvious what's tappable, especially on mobile? Do any static elements look interactive?
6. **Noise:** What can be cut without losing real information?
7. **Copy:** Is there happy talk, vague taglines, or insider language?
8. **Navigation:** Can a stranger tell where they are and where they can go?
9. **Diagrams:** Do they show the solution state, not the problem state? Do they come after the problem is described?
10. **Billboard coloring:** Are the highest-weight words visually elevated in gold? Is everything still fully legible?
11. **Mobile:** Does body copy fit in 2 lines? Are affordances visible without hover?
12. **Trust:** Are trust signals fully visible? Does every interactive promise get fulfilled?
