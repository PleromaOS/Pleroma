# Grilling Checklist — Next Session

**Session start:** Pick up at open questions from July 17 session  
**Reference:** See `docs/SESSION-SUMMARY-2026-07-17.md` for full context

---

## 🔴 Priority 1: Rob Peetoom / Booking Connector Framework

**Questions to ask:**
- [ ] What does his booking system API look like? (REST, GraphQL, DB access?)
- [ ] What minimal booking data can Pleroma request? (just today + barber_id?)
- [ ] Is real-time needed, or is 5-10 min polling okay?
- [ ] When does integration timeline? (before/after launch?)
- [ ] Who's the technical contact on his team?

**Decision to make:**
- [ ] Should Pleroma build **BookingConnector framework** from day 1?
- [ ] Or defer connectors to Phase 2, ship MVP with manual barber selection?

**Output:**
- [ ] ADR #0010 (Booking Connector Framework) — if approved

---

## 📋 Priority 2: Return Client Flow

**Status:** Partially clarified (general QR in waiting area, client selects barber)

**Clarification needed:**
- [ ] Should each Barber have their own QR code (at station) for quick re-consultation mid-session?
- [ ] Or only general shop QR (in waiting area)?

---

## ❓ Priority 3: Offline Resilience

**Current claim:** Client auto-saves mid-consultation, resumes if connectivity returns

**Need to clarify:**
- [ ] Auto-save frequency? (every keystroke? every 10 sec? on blur?)
- [ ] Storage mechanism? (IndexedDB? LocalStorage? Service worker cache?)
- [ ] If connectivity never returns — does barber finish with fallback card?

---

## ❓ Priority 4: Barber Deletion

**Current approach:** Soft-delete, consultations remain tied to "Deleted Barber"

**Clarify:**
- [ ] Are consultations re-assignable to new barber? Or stay as historical record?
- [ ] How does Owner see this in Admin Dashboard?

---

## ❓ Priority 5: Quick Pick vs Personalized

**Question:** How does client choose which path?

**Clarify:**
- [ ] UI choice ("Which would you prefer?") or automatic based on context?
- [ ] If client starts Personalized but AI fails, can they fall back to Quick Pick mid-flow?

---

## ❓ Priority 6: AI Clone Deletion

**Question:** Can client delete clone but keep consultation history?

**Clarify:**
- [ ] Confirmation: Yes, separate deletion? Or both-or-nothing?
- [ ] If clone deleted but history remains, how does follow-up consultation work?

---

## 📊 Tracking

- Total ADRs created to date: **9** (0001–0009)
- ADRs pending: **1** (0010 — Booking Connector Framework)
- Decisions locked: **13**
- Decisions open: **6**

---

## 🔗 Quick Links

- Session summary: `docs/SESSION-SUMMARY-2026-07-17.md`
- Privacy policy: `docs/legal/privacy-policy.md`
- Data deletion policy: `docs/legal/data-deletion-policy.md`
- All ADRs: `consultation-app/docs/adr/`
- Rob Peetoom memo: `memory/project_rob_peetoom_opportunity.md`
