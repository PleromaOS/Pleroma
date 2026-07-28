# Pleroma — Project Context

## What is Pleroma?

Pleroma is an AI-powered hair consultation tool for barbershops and salons in the Netherlands. Before a client sits in the chair, they complete a short visual quiz on their phone — tapping through mannequin images that look like them — and the result tells the barber or stylist exactly what the client wants. The owner gets a dashboard showing retention, satisfaction, and per-staff performance data.

**Target market:** Independent barbershops and hair salons in the Netherlands.
**Primary contact:** Bryan (alexanderv071230@gmail.com)

---

## What's been built

### 1. CRM / Outreach Tracker
**File:** `/Users/Bryan/Pleroma/pleroma-crm.html`
**Status:** Complete and functional.
- Apollo.io CSV import (maps by header name: First Name, Last Name, Company, Email, Phone, LinkedIn URL, City, Country, Industry)
- Generic CSV import fallback
- Reply logging per lead (channel, date, outcome, notes)
- Auto-status update based on reply outcome (interested/maybe → responded, waitlist → waitlist, not_interested → dead)
- Waitlist modal with business type options: Barbershop / Women's Hair Salon / Mixed Unisex Salon
- Full lead detail panel with reply history

### 2. Landing Page (new Apple/Tesla-style)
**File:** `/Users/Bryan/Pleroma/product/landing-site/index.html`
**Status:** Structure built, content needs replacing.
- Scroll-driven animations with IntersectionObserver
- Pinned pain section (scrolls through 3 beats)
- Branching quiz state machine (men vs. women paths)
- Netlify waitlist form with click-only validation survey
- Phone mockup images: `mockups/01_splash.png`, `02_question.png`, `03_results.png` — these are PLACEHOLDERS and need to be replaced with real app screenshots
- ⚠️ ALL copy (headline, pain points, how it works, CTA) needs to be rewritten — current messaging is generic

**Old landing page** (ignore): `/Users/Bryan/Pleroma/pleroma-landing.html` — generic B2B page, not in use.

### 3. Consultation App Shell
**File:** `/Users/Bryan/Pleroma/consultation-app/app/index.html`
**Status:** HTML shell exists, app logic NOT fully built.
- Screen structure exists: landing, quick-grid, quick-detail, question, family-picker, results, feedback, show-barber
- Uses mannequin images for visual quiz

### 4. Male Mannequins (complete)
**Location:** `/Users/Bryan/Pleroma/consultation-app/app/images/mannequins/base-characters/`
- `light/base-light.png`, `medium/base-medium.png`, `deep/base-deep.png`
- Photorealistic 3D render style, neutral gray background, bare shoulders, studio lighting
- Each has front/left/right/back angles
- **Origin:** Generated with **Higgsfield Nano Banana Pro** model. This is the model to use for all female mannequin generation.

### 5. Male Haircut Overlays
**Location:** `/Users/Bryan/Pleroma/consultation-app/app/images/haircuts/HC-001 through HC-017+`
- Multiple male styles (HC-001 to HC-017+)
- Each style has: light/medium/deep skin tone × low-fade/mid-fade/high-fade × front/left/right/back
- All male only. No female haircut assets exist yet.

### 6. Google Maps Scraper
**File:** `/Users/Bryan/Pleroma/scrape_nl_salons.py`
**Status:** Complete. Scrapes barbershops and salons across the Netherlands.

---

## What needs to be built (TO-DO LIST)

### PHASE 1 — Female Mannequins (BLOCKER for everything else)

**Goal:** 3 female base mannequins matching the EXACT style of the existing male ones — 3D render aesthetic, gray background, studio lighting, bare shoulders.

**The 3 Dutch nationalities to represent:**
1. Dutch / Northern European — fair skin, light eyes, blonde or light brown hair
2. Moroccan-Turkish Dutch — olive/medium brown skin, dark eyes, dark hair
3. Surinamese Dutch — medium to dark brown skin, dark eyes, varied hair texture

**Why this is blocked:**
AI image generators (tried: Higgsfield Soul V2, nano_banana_2) produce beauty photography, not 3D renders. The male mannequins have a specific CGI render look that AI cannot match without a reference image.

**Resolution path:**
- **First:** Find out where the male mannequins came from (Bryan needs to answer this). If they came from a 3D tool, commission matching female versions the same way. If AI generated, find the original prompt/model/settings.
- **Alternative if AI:** Upload a male mannequin as a reference image in Higgsfield and use img2img to generate female versions in the same style. (Note: the sandbox cannot upload to Higgsfield's S3 directly — must use the Higgsfield browser upload widget so the user selects the file manually.)
- **Higgsfield account:** Plan is Plus (upgraded from grace period). 1,200 credits. Daily cap removed.

**Female hairstyles needed (6 styles × 3 nationalities = 18 images):**
1. Lob (long bob) — shoulder length
2. Long natural — collarbone+ length, loose
3. Classic bob — chin length, blunt
4. Curtain bangs + length — face-framing bangs with medium length
5. Long layers — long with movement
6. Textured shag — layered, lived-in

### PHASE 2 — App Demo Screens (3 screens)

**Goal:** 3 polished, finished-looking phone screens that show the consultation flow. These replace the placeholder PNGs in `landing-site/mockups/`.

**Screen 1 — Welcome/Splash**
"Who's cutting your hair today?" — barber selection, clean Pleroma branding.

**Screen 2 — Visual Quiz**
The core UX. Client sees mannequins that look like them and taps to choose a hairstyle. Should show actual mannequin images, clean UI, progress indicator.

**Screen 3 — Result**
"Here's your look" — shows the selected style on the mannequin, summary of choices, ready for barber to see.

**Note:** Women and men paths are both needed eventually, but build one gender first (men, since assets exist).

### PHASE 3 — Owner Dashboard Mockup

**Goal:** A designed mockup showing what the owner sees — retention rate, consultation count, satisfaction score, client table with last visit and style preference. Used on the landing page.

**Can be built as:** Polished HTML mock, or a designed image.
**Key metrics to show:** Retention %, avg consultation time, satisfaction score, top styles, client list.

### PHASE 4 — Landing Page Copy Rewrite

**Goal:** Replace ALL current text with owner-focused, insider-voice copy. The page speaks to the business operator, not the stylist. Gender-neutral throughout.

**Confirmed page structure (7 sections):**

**S1 — HOOK (above fold)**
The problem is a data gap, not a craft gap:
> "Language can't transfer a mental image."
> "That gap — between what your clients picture and what they get — is creating churn you can't see and can't fix."

**S2 — PAIN (pinned scroll, 3 beats — owner's POV)**
- Beat 1 — The churn you can't see:
  *"A client stops coming in. You don't know if they were unhappy, moved away, or just got busy. Your business has no way to tell the difference."*
- Beat 2 — The knowledge you don't own:
  *"Your best stylist knows exactly what 30 clients want. That knowledge lives in their head. Not in your business."*
- Beat 3 — The loyalty that was never yours:
  *"When they leave, the clients go with them. You built the space, the brand, the reputation. The relationships? Those always belonged to one person."*

**S3 — REVEAL (mood shift, page goes light)**
> "It doesn't have to start with a guess."
> "Pleroma gives every appointment a precise brief — and gives your business the data it's never had."

**S4 — HOW IT WORKS (3 steps)**
1. **Scan** — Client scans a QR code in your waiting area. No app. No login.
2. **Choose** — 60 seconds of guided questions. They build their brief themselves.
3. **Receive** — Your stylist sees it on screen before the client sits down. Your business keeps it forever.

**S5 — THE DEMO (phone screens)**
Three clean phone mockups showing the actual flow. White minimal UI. Real mannequin images. This is where Phase 2 assets live.

**S6 — OWNER DASHBOARD**
What the owner gets back: retention numbers, client history, which stylists have the highest match rate. Phase 3 dashboard mockup goes here.

**S7 — CTA (team credibility + waitlist)**
Third-person credibility drop — experience-first, not a personal bio:
> "Built by people who've spent over a decade in this industry — as stylists, and running multiple salons at the same time. We built Pleroma because we lived this problem on both sides."
Key facts to name-drop: 11+ years in the industry, experience running 3 salons simultaneously, both sides of the chair (stylist and owner).
Then the waitlist survey.

**Voice:** Insider, not startup pitch. Owner as the hero. The product is the mechanism — not the star.

### PHASE 5 — Product Demo Video

**Goal:** Short Higgsfield video showing the quiz UI in motion — a client tapping through mannequin options on their phone. Used in the landing page product section.

**Depends on:** Phase 2 (app screens must exist first).
**Tool:** Higgsfield video generation (Kling or Seedance models).

### PHASE 6 — Wire everything into the landing page

**Goal:** Final landing page with all real assets in place.

- Replace `mockups/01_splash.png`, `02_question.png`, `03_results.png` with Phase 2 screens
- Insert Phase 5 video into product demo section
- Insert Phase 3 dashboard mockup into owner section
- Replace all placeholder copy with Phase 4 copy
- Test scroll animations, form submission, mobile responsiveness

---

## Key decisions & constraints

- **Netherlands market:** Men's styles focus on hair on top (length, movement, texture) — NOT fade-heavy like American barbershops. Dutch men wear longer hair. Less emphasis on fade level as the primary choice.
- **Women's path:** Needs to be separate quiz path from men's — different question set, different mannequins, different styles.
- **Booking system:** Pleroma is 100% independent of Fresha (common NL booking system). No integration, no sync.
- **Language:** The product domain uses precise terms — always use: Shop, Barber, Client, Staff View, Admin Dashboard. Never: user, customer, tenant, admin view.
- **Higgsfield:** Connected via MCP. Account is Plus plan (upgraded July 2026). 1,200 credits. Upload widget must be used for reference images (sandbox cannot reach Higgsfield's S3 upload endpoint).
- **CRM outreach:** Leads sourced from Apollo.io. Top targets: barbershops in Amsterdam, Rotterdam, Den Haag, Utrecht.

---

## File map

```
/Users/Bryan/Pleroma/
├── CONTEXT.md                          ← this file
├── pleroma-crm.html                    ← CRM (complete)
├── pleroma-landing.html                ← OLD landing page (ignore)
├── scrape_nl_salons.py                 ← Google Maps scraper (complete)
├── product/
│   └── landing-site/
│       ├── index.html                  ← NEW landing page (needs copy + real assets)
│       └── mockups/
│           ├── 01_splash.png           ← PLACEHOLDER — replace with real screen
│           ├── 02_question.png         ← PLACEHOLDER — replace with real screen
│           └── 03_results.png          ← PLACEHOLDER — replace with real screen
└── consultation-app/
    ├── CONTEXT.md                      ← detailed domain model (barber/client/consultation schema)
    └── app/
        ├── index.html                  ← app shell (not fully built)
        └── images/
            ├── mannequins/
            │   └── base-characters/
            │       ├── light/          ← male base (complete)
            │       ├── medium/         ← male base (complete)
            │       └── deep/           ← male base (complete)
            │       └── [female/]       ← MISSING — Phase 1 deliverable
            └── haircuts/
                └── HC-001 to HC-017+  ← male only, all angles (complete)
                └── [female haircuts/]  ← MISSING — needed after Phase 1
```

---

## Immediate next session starting point

**Male mannequins were generated with Higgsfield Nano Banana Pro.** Use the same model for female versions.

Upload `base-medium.png` via the Higgsfield browser upload widget as a style reference, then generate female versions with nano_banana_pro using img2img. (Sandbox cannot reach Higgsfield's S3 upload endpoint — must use the widget so the user selects the file manually in the browser.)

Once female mannequins exist → build 3 app screens (Phase 2) → owner dashboard mock (Phase 3) → rewrite copy (Phase 4) → video (Phase 5) → final page assembly (Phase 6).
