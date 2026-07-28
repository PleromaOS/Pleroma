# Pleroma Brand Guidelines

**Pleroma** is AI-powered haircut consultations for barbershops. The brand should feel premium, intentional, warm, and accessible.

---

## Brand Personality

- **Premium but approachable** — Not corporate, not casual. Confident and clear.
- **Warm and inviting** — Barbershop setting requires comfort and trust.
- **Intentional** — Every design decision has purpose. No clutter.
- **Intuitive** — If someone has to ask "how do I use this?" we failed.

---

## Visual Identity

### Logo
The Pleroma logo is a stylized hairline with a gold accent (light reflection). It's circular, suggesting completeness and trust.

- **Primary mark:** Circular hairline with gold dot
- **Lockup:** Logo + "PLEROMA" in Georgia serif
- **Minimum size:** 120px (maintain clarity)

See `design-system/` for source files.

### Color Palette

**Primary colors:**
- **Warm Beige** (`#ede8e0`) — Background, warmth, approachability
- **Gold/Bronze** (`#c9a050`) — Accent, calls-to-action, premium feel
- **Charcoal Brown** (`#1c1a18`) — Text, headings, primary UI
- **Dark Teal** (`#2d4a35`) — Secondary accents, trust/security

**Neutral support:**
- **White** (`#ffffff`) — Clean, content backgrounds
- **Light Gray** (`#f9f7f3`) — Subtle backgrounds, cards
- **Medium Gray** (`#999999`) — Secondary text

See `colors.json` for full specifications.

### Typography

**Headings (Georgia serif):**
- Premium, elegant, memorable
- Logo uses Georgia at 56px with 3px letter-spacing

**Body (System sans-serif):**
- -apple-system, BlinkMacSystemFont, 'Segoe UI'
- Clean, readable, accessible
- 16px base size for body text

**Hierarchy:**
- H1: 56px, Georgia, letter-spacing 3px
- H2: 48px, 600 weight, letter-spacing -0.5px
- H3: 20px, 600 weight
- Body: 16px, 400 weight, line-height 1.7

### Spacing & Rhythm

- **8px grid:** All spacing in multiples of 8 (8px, 16px, 24px, 32px, 48px, 64px, etc.)
- **Section padding:** 100px vertical on desktop, 60px on mobile
- **Gap between elements:** 24–48px (generous, not cramped)

---

## Design Principles

1. **Intuitive first** — Users shouldn't need explanations. Design for clarity.
2. **Warm, not cold** — Color palette is warm. Tone is conversational.
3. **Motion with purpose** — Animations guide attention, not distract.
4. **Accessible** — Color contrast ≥ 4.5:1, touch targets ≥ 48px, readable font sizes.
5. **Mobile-first** — Works beautifully on phones (Clients, Barbers both use phones).

---

## Usage

### For Marketing (Landing Page)
- Use gradient backgrounds (beige → lighter beige)
- Gold accents on buttons and highlights
- Animated elements (floating logo, scroll animations)
- Conversational copy

### For Product (App)
- Clean white content areas
- Gold accents for primary actions
- Teal for secondary messaging (trust, security)
- Minimal motion (performance on older phones)

### For Legal/Compliance
- Dark charcoal text on white background
- Gold for important links/highlights
- Clear, readable typography

---

## Do's & Don'ts

✅ **Do:**
- Use the color palette consistently
- Maintain Georgia serif for headings
- Add whitespace generously
- Use smooth, natural animations
- Test on mobile first

❌ **Don't:**
- Use colors not in the palette (if you need a new color, add it here)
- Use overly bright or neon colors
- Cram content together
- Animate for distraction (only for guidance)
- Assume desktop-only usage

---

## Questions or Updates?

If you're adding new design elements, update this file and `colors.json` so future team members have a single source of truth.
