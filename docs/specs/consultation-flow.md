# Consultation flow — the floor plan

**18 September 2026.** The rooms and their order. Not the furnishing.

Companion to `docs/adr/0010-countersigned-result-guarantee.md` and the glossary
in `CONTEXT.md`. Widget IDs refer to `ui/REGISTRY.md`.

There are three flows. Two entries that converge on one chair.

---

## A. Campaign entry — a stranger from an advertisement

The shop paid for this click. Everything here is built to get from the ad to a
booking with the fewest possible moments where someone can leave.

```
  ad
   │
 1 LANDING                          W20
   the offer, the shop, the guarantee
   one CTA: see yourself with the haircut
   │
 2 EMAIL GATE                       W20
   "Enter your email to see yourself with this haircut."
   the render is the reward for the email — this is the spend boundary
   │
 3 HAIR TEXTURE                     straight-fine · straight-coarse · wavy · curly · coily
   hard-filters the style catalogue for everything that follows
   │                                NO skin tone question — the selfie provides the face
   │
 4 STYLE GRID                       W02 · Route A only
   21 presets, texture-filtered, maintenance badge on every tile
   "Don't see what you want?" → photo upload
   picking a preset auto-fills every brief detail
   │
 5 STYLING EFFORT                   low · medium · high
   a mismatch against the style's maintenance level is flagged, never blocked
   │
 6 SELFIE + CONSENT                 new
   "To show you the result, we need a photo."
   Article 9 consent on this screen, in plain language, with deletion named
   consent is separate from everything else and can be withdrawn
   │
 7 THE WAIT                         30–60s · new
   not a spinner. shows the brief being assembled, line by line.
   the wait buys them something: they watch their brief being written
   │
 8 RENDER REVEAL            ★★      W21 — THE ANCHOR
   their own face, with the haircut
   PASSES the feasibility gate → guarantee badge
   FAILS the gate → no badge, framed as a longer journey, with a plan
   render counter visible: "2 of 3 left" — never a surprise
   │
   ├── 9a  REFINE → sides, fade height, beard → re-render (costs one)
   │        loops back to 8
   │
   └── 9b  RENDER CONFIRMATION      W22
           "Is this you? Is this the cut you want?"
           client-side half of the countersign
   │
10 CLOSE
   ├── shop has online booking  → BOOKING HANDOFF        W23
   │     deep link, service pre-selected, NO barber — shop assigns
   │     their calendar owns availability, so no double-booking
   │
   └── walk-in shop            → CONSULTATION PASS       W24
         render + brief + code, by email. "Show this at the shop."
   │
11 EMAIL                            render + brief + pass code, immediately
   │
12 NO BOOKING AFTER 24h             unbooked render follow-up
   shows them their own render again, returns them to step 10
```

**Rooms: 12. Screens before the payoff: 6.**

---

> **Changed again 2026-09-26 (Bryan, option "B: scan first") — applies to BOTH
> flows and replaces the "email before selfie" note below.** The consultation
> now opens with a three-photo scan (front + both sides), right after the
> landing page: Landing → why + consent switch → scan → email → questions →
> render. The consent switch is tapped before the camera opens; the photos stay
> on the phone until the email is given; the email step then records the
> consent (consent must belong to a known person) and only after that does any
> photo leave the phone. A refresh before then clears the photos and the client
> rescans (answers and email are kept).

## B. Shop entry — someone already in the building

> **Changed 2026-09-26 (Bryan):** in the shop flow the email now comes **before
> the selfie**, as in the campaign flow ("Where should we send your result?").
> A selfie needs consent, and consent must belong to a known person so it can be
> proven and withdrawn. The quiz questions themselves are unchanged. Step 9 below
> is therefore the barber choice only; the email hard block moves before step 7.
> Both flows also gain a **current length** question (feeds the length-gap check
> in the feasibility gate).

Unchanged from the resolved spec. They are waiting anyway, so depth is free and
the full brief is worth capturing.

```
  QR in the waiting area
   │
 1 GENDER → 2 TEXTURE → 3 SKIN TONE (skippable, avatar may be used)
   │
 4 ROUTE CHOOSER          "choose a famous style" | "build my own style"
   │
   ├── Route A → preset grid → styling effort
   └── Route B → current style → keep or change → length → alternatives → styling effort
   │
 5 SIDES        fade type → height → shape → line sharpness → neckline
 6 BEARD        state → patches → density → fading → lines → neckline → style → moustache
   │
 7 PREVIEW      avatar, or selfie where consent is given
 8 SUMMARY      every detail listed, every detail editable
 9 BARBER + EMAIL                   HARD BLOCK — no email, no brief
   │
   brief posts to the shop's live queue
```

---

## C. The chair — both entries converge

This is where the guarantee is actually created. Nothing before this point is
guaranteed, whatever the advertisement said.

```
  client sits down
   │
 1 STYLIST OPENS THE APPOINTMENT
   the brief is already there — matched by email, or pulled from a pass code
   │
 2 FEASIBILITY CHECK        ★★      W25 — THE OTHER ANCHOR
   render and brief, against the head actually in front of them
   │
   ├── executable as briefed  → countersign
   │
   └── not executable         → amend the brief
         state what isn't possible and why
         offer alternatives
         client confirms the amendment
   │
 3 BOTH CONFIRMED → guaranteed brief
   only now does the guarantee exist
   │
 4 THE CUT
   │
 5 AFTER PHOTO                      own consent, own deletion path
   │
 6 DOES IT MATCH?
   ├── yes → pay → brief and visit stored against the client
   └── no  → CLAIM                  W26
         client names WHICH LINE of the brief was missed
         claim window closes when they leave the chair
         shop refunds — shop funds it, never PleromaOS
```

---

## The four moments this flow lives or dies on

**The email gate (step 2).** Asking before the render is what bounds the shop's
spend to identified people. It is also the first thing that can lose them. The
line has to make the trade obvious: an email for a picture of yourself.

**The wait (step 7).** Sixty seconds on a cold click is an eternity. Showing the
brief assembling is the difference between dead time and anticipation.

**The render reveal (step 8).** Everything upstream exists to produce this
moment and everything downstream depends on it landing. This is the anchor
widget and it deserves the full variation budget.

**The feasibility check (C.2).** The stylist is being asked to do something new,
in front of a client, under time pressure. If this screen is slow or awkward
they will skip it, and if they skip it the guarantee has no foundation.

---

## Known gaps — not blocking the drawing

- After-photo consent flow is named but not specified
- Whether a consultation that never books creates a durable client record, and
  for how long it is kept
- The advertisement and booking terms need legal review
- Curly has zero reference coverage, so curly clients get no badge until the
  library is collected
