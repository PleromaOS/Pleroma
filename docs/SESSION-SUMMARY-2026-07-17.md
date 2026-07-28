# Session Summary — July 17, 2026

**Focus:** Grilling Pleroma domain model, organizing codebase, designing landing page, legal compliance

---

## ✅ Completed Today

### 1. Landing Page (pleromaos.nl)
- ✓ Created multi-section scroll journey (Hero → Problem → Solution → Benefits → CTA → Footer)
- ✓ Integrated brand colors (#ede8e0, #c9a050, #2d4a35, #1c1a18)
- ✓ Added animations (fade-in, floating, scroll-triggered)
- ✓ Email signup form with Netlify Forms integration
- ✓ Deployed to Netlify: [lambent-florentine-1c4503.netlify.app](https://lambent-florentine-1c4503.netlify.app)
- ✓ Domain pointed to Netlify (DNS via nameservers)
- ⚠️ **Status:** DNS propagation in progress (5-30 min typical)

### 2. Codebase Reorganization
- ✓ Created proper folder structure: `docs/`, `brand/`, `product/`
- ✓ Moved scattered files to correct locations:
  - `landing.html` → `product/landing-site/index.html`
  - `pleroma-design-system.html` → `brand/design-system/`
  - Specs → `docs/specs/`
  - Business plan → `docs/research/`
  - Database file → `product/consultation-app/docs/`
  - Logos → `brand/logos/`
  - Mockups → `brand/mockups/`
- ✓ Deleted redundant files (example-design, .DS_Store, temp files)
- ✓ Created `.gitignore`
- ✓ Updated root README with new paths
- ✓ Created `brand/README.md` and `brand/colors.json`

### 3. Legal & Compliance
- ✓ Created `docs/legal/privacy-policy.md` (GDPR-compliant, comprehensive)
- ✓ Created `docs/legal/data-deletion-policy.md` (90-day anonymization approach)
- ✓ Resolved: Client data deletion → anonymize consultations, delete PII immediately
- ✓ **ADR #0009:** GDPR-compliant data deletion with anonymization

### 4. Domain Grilling (ADRs Created)
- ✓ **ADR #0007:** Barber PIN self-reset via email (barbers create own PIN, not owner-issued)
- ✓ **ADR #0008:** Feedback disagreement flagging (dashboard shows "95% (2 flagged)")
- ✓ **ADR #0009:** GDPR deletion with anonymization (immediate PII deletion, 90-day anonymized retention)

### 5. Domain Decisions Locked
- ✓ Email-only return client identification (no PIN)
- ✓ Removed Client PIN feature entirely
- ✓ Feedback timing: email reminder sent 1 day after appointment (not 2-3 days)
- ✓ Fallback card: includes original images + text, staff-only visibility
- ✓ Consultation still submitted to barber queue when AI fails (with fallback)
- ✓ Weak PIN patterns blocked (sequential 1234, repetitive 1111, etc.)
- ✓ Feedback disagreements flagged and surfaced to Owner in dashboard

---

## ⏳ Open Questions (Unresolved) — CONTINUE TOMORROW

### 1. **Return Client Flow** ⚠️
**Status:** Partially clarified  
**Context:** Fresha handles bookings, clients already chose barber. Pleroma is ONLY about consultation, not barber selection.

**Current approach:**
- General shop QR in waiting area
- Client enters email
- Client selects "Who's cutting your hair today?" (dropdown of barbers)
- Consultation goes to that barber's queue

**Open question:** Should we have per-Barber QRs at barber stations for quick re-consultation during session?

---

### 2. **Booking System Integration** 🔴 **CRITICAL / ENTERPRISE**
**Status:** High-priority discovery  
**Context:** Rob Peetoom (10+ salons) is a warm lead with in-house booking system. This unlocks enterprise opportunity.

**Decision needed:** Should Pleroma include a **booking connector framework** from day 1?

**Framework concept:**
```
BookingConnector (Abstract Interface)
├── authenticate(credentials)
├── getBookingsForToday() → [{email, barber_id, barber_name, time_slot}]
├── getBarbers() → [{id, name}]

Implementations:
├── RobPeetoomConnector (priority #1)
├── FreeshaConnector (if API available)
├── GenericRESTConnector (custom shops)
```

**Unresolved sub-questions:**
1. Phase timing: Does this delay MVP? Or buildable in parallel?
2. Rob Peetoom API: What does their API look like? (REST, GraphQL, DB access?)
3. MVP scope: Just framework + RobPeetoom? Or multiple connectors day 1?
4. Timeline: When can you connect with Rob to discuss integration specs?

**Next step:** ADR #0010 (Booking Connector Framework) — pending answers above

---

### 3. **Offline Resilience** ❓
**Status:** Mentioned in CONTEXT.md but never grilled  
**Question:** How exactly does auto-save work during consultation? (Client loses connectivity mid-flow)

**Current CONTEXT.md claim:**
> "Client Consultations auto-save in real-time as the Client fills out answers. If a Client loses connectivity mid-consultation, their answers are persisted. When connectivity returns, they resume exactly where they left off."

**Need to clarify:**
- Is auto-save every keystroke? Every 10 seconds? On blur?
- What happens if connectivity never returns? Can barber finish with text-only fallback?
- Where is it stored locally? (IndexedDB, LocalStorage?)

---

### 4. **AI Clone Deletion** ❓
**Status:** Partially clarified  
**Question:** Can a Client delete their AI clone but keep consultation history?

**Current approach:** Yes, separate deletion. But need to clarify:
- What does a follow-up consultation look like if clone is deleted but history remains?
- Should barber still see prior results even if clone is gone?

---

### 5. **Barber Deletion/Departure** ❓
**Status:** Mentioned, not grilled  
**Current CONTEXT.md:**
> "When a Barber leaves/is deleted, their record is soft-deleted (marked inactive). Their historical Consultations, Delivery Reports, and Feedback remain in the database for Owner analysis."

**Need to confirm:**
- Are consultations re-assignable to new barber? Or stay with "Deleted Barber"?
- How does Owner see this in Admin Dashboard?

---

### 6. **Quick Pick vs Personalized Trigger** ❓
**Status:** Not yet grilled  
**Question:** How do clients choose which consultation path (Quick Pick vs Personalized)?

**Current design:**
- Quick Pick: fast, preset styles, generic mannequin (~30-60 sec)
- Personalized: upload photo, AI clone, their own look (1-2 min)

**Need to clarify:**
- Is this a UI choice ("Which would you prefer?") or automatic?
- What if client starts Personalized but AI fails — can they fall back to Quick Pick mid-flow?

---

## 📋 Tomorrow's Grilling Agenda

**Priority order:**

1. **Rob Peetoom / Booking Connector Framework** 🔴 (highest priority — enterprise opportunity)
   - Get answers on API, timeline, phase scope
   - Draft ADR #0010

2. **Return Client Flow** (clarify QR strategy, per-barber QRs)

3. **Offline Resilience** (auto-save mechanics)

4. **Barber Deletion** (soft-delete, re-assignment)

5. **Quick Pick vs Personalized** (trigger & fallback)

6. **AI Clone Deletion** (partial vs full)

---

## 🔗 Key Documents Created/Updated

**New:**
- `docs/legal/privacy-policy.md` (GDPR-compliant)
- `docs/legal/data-deletion-policy.md` (90-day anonymization)
- `docs/specs/` folder (moved specs here)
- `brand/README.md` (brand guidelines)
- `brand/colors.json` (color palette)
- `.gitignore`
- `docs/SESSION-SUMMARY-2026-07-17.md` (this file)

**ADRs (New):**
- `0007-barber-pin-self-reset-via-email.md`
- `0008-feedback-disagreement-flagging-for-training.md`
- `0009-gdpr-compliant-data-deletion-with-anonymization.md`

**Updated:**
- `README.md` (root, with new folder paths)
- `CONTEXT.md` (removed Client PIN, updated feedback flow, clarified deletion policy)

---

## 🚀 Next Steps

1. **Tomorrow morning:** Review this summary, identify any missed details
2. **Continue grilling:** Start with Rob Peetoom booking connector question
3. **Draft ADR #0010** when framework decision is locked
4. **Update memory:** Add any new decisions to project memory file

---

**Session ended:** July 17, 2026 (time not recorded)  
**Next session:** Pick up at "Booking Connector Framework" question
