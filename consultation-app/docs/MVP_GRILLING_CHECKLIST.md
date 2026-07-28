# Pleroma MVP Grilling Checklist

**Purpose**: A comprehensive checklist of every design decision, flow, edge case, and implementation detail that needs to be grilled for a serious startup MVP in proof-of-concept phase.

**Status**: Active — use this as your roadmap from grilling → design → implementation.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [P0: Critical (Blocking MVP)](#p0-critical-blocking-mvp)
3. [P1: Important (Needed for Launch)](#p1-important-needed-for-launch)
4. [P2: Nice-to-have (Phase 2)](#p2-nice-to-have-phase-2)
5. [How to Use This Checklist](#how-to-use-this-checklist)
6. [Critical Unknowns to Address First](#critical-unknowns-to-address-first)

---

## Quick Start

**Total items**: 94  
**P0 (Critical)**: 27 items — foundation, blocking MVP  
**P1 (Important)**: 40 items — launch-ready, production quality  
**P2 (Phase 2)**: 14 items — polish, analytics, customization  

**Recommended approach**:
1. Grill P0 items first (1 per conversation turn, mark as in_progress)
2. Update CONTEXT.md & ADRs as new domain knowledge emerges
3. Move to P1 after P0 is solid
4. Defer P2 until after launch

---

## P0: Critical (Blocking MVP)

### P0 — Data Model & Schema (8 items)

The foundation. Without a solid schema, you'll rebuild mid-project. These items define the database structure and relationships.

**P0.1**: Grill data model relationships  
- Shops → many Barbers, Clients, Consultations  
- Clients → many Consultations (across different Barbers and visits)  
- Barbers → many Consultations, Delivery Reports  
- **Questions to resolve**:
  - Can a Client have Consultations with multiple Barbers at the same Shop?
  - When a Barber is deleted, what happens to their Consultations?
  - Do Consultations have a "primary Barber" (the one who cuts) or can they be reassigned?
  - Is there a Shop → Admin relationship? Can Owners have access control per Barber?

**P0.2**: Grill Consultation schema — fields and validation  
- **Quick Pick fields**: style_name, texture, skin_tone, specific_details, created_at, shop_id, barber_id, client_id, status  
- **Personalized fields**: above + photo_ids (array), ai_clone_id, ai_processing_status (pending/success/failed), fallback_card_created  
- **Shared fields**: consultation_type (quick_pick | personalized), submitted_at, feedback_id (null until feedback given)  
- **Validation**:
  - Is style_name required? Can Client skip?
  - Is photo_ids required in Personalized? What if upload fails?
  - What's the max size of specific_details (text)?
  - Can a Consultation be edited after submission, or is it immutable?

**P0.3**: Grill Feedback schema  
- **Fields**: consultation_id (FK), rating (1-5 or "Satisfied", "Neutral", "Unsatisfied"?), expectations_match (Yes/No/Partial), submitted_at, client_id (denormalized for privacy?), created_by_email_link  
- **Validation**:
  - Is both rating AND expectations_match required?
  - If Client doesn't submit feedback, is there a reminder?
  - Can Feedback be edited after submission?
  - How long is the feedback email link valid? (24 hours? 7 days?)
  - Is there a Client comment field (open text)?

**P0.4**: Grill Delivery Report schema ✅ GRILLED 2026-07-16
- **Mandatory**: Yes — Staff View does not advance until all 3 questions answered.
- **Immutable**: Yes — cannot edit after submission.
- **Visibility**: Owner-only. Client never sees it.
- **Schema**: See CONTEXT.md → Delivery Report Schema section.
  - `issues_flag` BOOLEAN
  - `delivery_match` ENUM (yes/no/partial)
  - `communication_clarity` ENUM (yes/no/partial) — "Were the Client's preferences clear?"
  - Denormalized: `barber_id`, `shop_id`, `style` — supports per-Barber AND per-Style Admin Dashboard breakdowns without joins.

**P0.5**: Grill Client PIN schema ✅ GRILLED 2026-07-16
- **Storage**: bcrypt hash in database (NOT browser LocalStorage). Works cross-device.
- **Generation**: 4-digit, user-set (Client chooses their own PIN on first Consultation).
- **Required**: Optional — Client can skip. No PIN = still gets access via email lookup alone.
- **Retrieval**: Client enters email (exact match) → if PIN was set, prompted to enter it → validated against DB hash.
- **Reset / recovery**: Client requests reset on return visit → reset link sent to email on file → Client sets new PIN. No Owner intervention needed.
- **Lockout**: 5 wrong attempts → lock for 10 min (to prevent brute-force on 4-digit space).
- **Client identifier**: Email only. Phone number is NOT collected. Fuzzy phone-matching dropped.

**P0.6**: Grill Barber PIN schema  
- **Storage**: LocalStorage on Barber's device (not in database)?  
- **Generation**: Random 4-digit, or Owner-assigned?  
- **Rotation**: Can Barber/Owner rotate PIN? How often?  
- **Reset flow**: Barber lost device → Owner generates new PIN → how to deliver it (email, in-person, phone)?  
- **Tiering**: Is there a PIN for each Shop they work at (if they work at multiple), or one PIN per Barber globally?  
- **Questions**:
  - Should PIN be memorable (XXXX) or cryptographically strong?
  - Is PIN stored in database and hashed, or only in browser LocalStorage?
  - Can Owner see all Barber PINs for audit, or are they hidden?

**P0.7**: Grill AI Clone schema  
- **Fields**: client_id (FK), shop_id (FK), ai_clone_id (unique ID), algorithm_version (e.g., "v1.0", "v2.0"), created_at, deleted_at (soft delete?), consent_given (boolean), photo_ids_deleted (after processing)  
- **Storage location**: database BLOB, S3, GCS, or external AI service?  
- **Lifetime**: 
  - Deleted when Client profile deleted?
  - Re-renderable if algorithm improves? (versioning strategy)
  - Retained indefinitely unless explicitly deleted?
- **Questions**:
  - Can Client see all their past clones, or just the most recent?
  - If algorithm improves, do you re-render old clones automatically or ask for consent?
  - Are clones associated with a specific Consultation or just a Client profile?

**P0.8**: Grill Fallback Card schema  
- **Triggered when**: AI processing fails, timeout, photo too blurry, external service down  
- **Fields**: consultation_id (FK), barber_id (FK), error_reason (string), created_at, original_consultation_snapshot (all Client preferences in text)  
- **Display**: Barber sees text-only card with Client preferences (no AI preview)  
- **Barber action**: Still completes Consultation and Delivery Report  
- **Backend**: Error logged for diagnostics (what failed? when? which AI service?)  
- **Questions**:
  - How long do you retain Fallback Cards in the database?
  - Can Owner/support view Fallback Card history to see error patterns?
  - Does Fallback Card trigger any automatic retry of AI processing?

---

### P0 — Client Flows (4 items)

These are the user journeys. If you haven't grilled every screen and interaction, you haven't grilled the flow.

**P0.9**: Grill Client consultation entry flow  
**Flow**: QR scan → Shop page → Barber selection → Name/Phone entry → Consultation type choice → Start flow  

- **QR code landing page**:
  - What does Client see? Just "Pick your Barber"?
  - Is Shop name shown? Shop logo? (future, not MVP)
  - Can Client pick "I don't see my Barber"? (error handling)

- **Barber selection**:
  - List of all Shop Barbers (names only)?
  - Can Client see Barber photos, ratings, specialties? (MVP: no)
  - What if Shop has only 1 Barber? Still show selection screen or skip?

- **Name/Email entry** _(phone dropped — email is sole Client identifier)_:
  - Order: name first or email first?
  - Name: first name only or full name?
  - Email: standard format validation (RFC 5322); no fuzzy matching — exact email lookup only.
  - Labels/help text clear (not technical)?
  - Validation in real-time or on submit?

- **Email lookup (Return Client)**:
  - Client enters email → exact match lookup → if found, prompt for optional PIN.
  - If no match, proceed as new Client (create new Client record under this email).
  - No fuzzy matching on email (phone fuzzy-matching was dropped with phone as identifier).

- **Consultation type choice**:
  - Button/screen: "Quick Pick (30 sec) vs. Personalized (2 min)"?
  - Explanation visible on screen so Client understands difference?
  - Can Client switch mid-flow? (MVP: no)

**P0.10**: Grill Quick Pick flow  
**Data captured**: style, texture, skin_tone, specifics  

- **Style selection**:
  - List of predefined styles (Fade, Undercut, Pompadour, etc.)?
  - How many? (5, 10, 20?)
  - Can Client search/filter?
  - Styles shown as text, photos, or both?

- **Texture selection**:
  - Options: Straight, Wavy, Curly, Coily, Other?
  - Single-select or multi-select?
  - Photos to show hair types?

- **Skin tone selection**:
  - Why capture this? (AI rendering accuracy)
  - Options: Light, Medium, Dark, Other?
  - Inclusive? (show range of actual skin tones, not color scale)

- **Specific details**:
  - Free text or preset options? (MVP: probably text for flexibility)
  - Examples: "Fade line, tight around edges, fade from #2 to #0.5"
  - Max length? Required field?
  - Rich text or plain text only?

- **Preview**:
  - Show selected style on generic mannequin?
  - Refresh as selections change?
  - Text summary of choices ("Fade, straight hair, medium skin tone")?

- **Submission**:
  - Button label: "Done", "Submit", "Send to Barber"?
  - Confirmation screen or immediate send?
  - What does Client see after? "Your consultation is on the way to [Barber Name]"?

- **Return Client Quick Pick**:
  - Show prior Quick Pick preferences?
  - "Edit your last pick" vs. "Start fresh"?
  - Can change one field or rebuild from scratch?

**P0.11**: Grill Personalized flow  
**Critical constraint**: Client in chair, photo + questions must feel seamless (1-2 min total)  

- **Photo capture**:
  - How many angles? (front, left, right, back? — or just front?)
  - Instructions on screen? (e.g., "Show full head, good lighting")
  - Single upload or multiple uploads in sequence?
  - Face capture: optional or required?
  - If face: consent form before capture ("Your face will be used to...")
  - Photo quality validation: too small, too blurry, wrong format (JPEG/PNG only?)

- **Parallel preference questions** (while AI processes):
  - Same as Quick Pick? (style, texture, skin tone, specifics)
  - Or different questions? (e.g., "What's your daily routine?" for more context)
  - Form validation: required fields, format checks
  - Progress bar? ("Question 2 of 4")
  - Time estimate shown? ("This takes ~1 minute")

- **AI processing timing**:
  - When does processing start? (after first photo upload, or after form submitted?)
  - Expected latency: 30 sec? 1 min? 2 min? (UNKNOWN — must test with Higgsfield/Banana)
  - What if processing takes longer than form completion?
    - Show spinner: "Generating your preview..."?
    - Show text preview while AI processes?
    - Accept partial results (clone generated, style not yet overlaid)?

- **Preview display**:
  - When Client sees their AI clone with selected style overlaid
  - Can Client see 360° view or just front?
  - "This is how you'll look" caption?
  - Option to go back and modify style or questions?
  - Or is preview final and locked before submission?

- **Submission**:
  - Client reviews and taps "Send to Barber"
  - Or automatic submit when form complete + AI done?
  - Confirmation: "Your Barber [name] received your consultation"?

- **Return Client Personalized**:
  - Show prior Personalized clone?
  - Can re-render with new style?
  - Or do new photos/re-clone? (MVP: probably skip, use old clone)

- **Error handling** (covered in P0.25):
  - If photo upload fails, AI times out, etc. → Fallback Card

**P0.12**: Grill Return Client flow  
**Trigger**: Client enters phone number, system detects prior Consultation(s)  

- **Lookup & verification**:
  - Phone entered → fuzzy match → if match, ask: "Did you mean [number] for [name]?"
  - Client confirms match
  - Client enters 4-digit PIN they set on first visit
  - PIN validated against stored hash or local storage (where is it stored exactly?)

- **Prior Consultations display**:
  - Show all prior Consultations at this Shop (across all Barbers)?
  - Or just with current Barber?
  - List view: date, barber name, style chosen, feedback rating (if given)
  - Tap on Consultation → detail view (show all fields, feedback, barber's delivery report visible to Client?)

- **Modification flow**:
  - "View" prior Consultation or "Modify & re-submit"?
  - If modify, which fields can change? (all? or just style?)
  - Can change Barber? (same or different?)
  - Can change path? (Quick Pick → Personalized or vice versa?)
  - If Personalized, new photos or reuse AI clone?

- **New Consultation vs. Modify**:
  - Is this a new Consultation record or update to old one?
  - (Likely: new record, prior one stays for history)
  - Feedback on prior Consultation still shows, not overwritten

- **Return Client who didn't give feedback**:
  - When they look up prior Consultation, prompt: "Feedback sent, but we didn't hear from you. Want to rate your last cut?" (Yes → feedback form, No → skip)

---

### P0 — Barber Workflows (2 items)

Every Barber interaction must feel fast and frictionless. They're in the middle of a busy shop.

**P0.13**: Grill Barber Staff View interface  

- **Authentication**:
  - Barber enters PIN on first visit
  - PIN saved in browser LocalStorage (not re-entered each time)
  - What if Barber logs out? Or uses different device?
  - Session timeout? (probably not — assume they keep it open)

- **Queue display**:
  - List of pending Consultations for this Barber
  - Ordered: newest first or FIFO?
  - Showing: Client first name, Consultation type (Quick Pick or Personalized), preview/summary, timestamp
  - Scrollable if many Consultations (scroll to load more? or all in view?)

- **Consultation card layout**:
  - **Personalized with AI success**: Client photo preview or AI clone? Where?
  - **Personalized with AI failure (Fallback)**: Text-only card, all preferences listed
  - **Quick Pick**: Text summary of choices
  - Card size: full screen or card-based (thumbnail)?
  - Tappable? Expandable? Full-screen overlay?

- **Session resumption**:
  - Barber closes Staff View (browser tab, app)
  - Later reopens Staff View, taps PIN again
  - Resume exactly where they left off (same queue position, same Consultation card expanded?)
  - How is state persisted? (browser localStorage, server session, API call on re-open?)

- **Real-time updates**:
  - New Consultation appears in queue while Barber is viewing
  - Does queue update automatically (WebSocket push) or on poll (refresh every 5 sec)?
  - Is there a visual indicator ("New consultation from [Client]")?
  - Sound notification? (probably not MVP, but consider)

- **Navigation**:
  - How does Barber move between Consultations in queue?
  - Up/down buttons? Swipe? Tap card to dismiss?
  - Can Barber skip a Consultation and come back? (probably yes, don't force FIFO)

- **Device considerations**:
  - Phone (5.5-6.5"): is queue readable, cards tappable?
  - Tablet (10"): layout different? Landscape vs. portrait?
  - Accessibility: font size, color contrast, touch targets

**P0.14**: Grill Barber delivery workflow  

- **After selecting "Done" on a Consultation**:
  - Screen locks (cannot dismiss without completing)
  - Shows 3 quick questions (tap-only, <10 seconds total):
    1. **Any issues?** (Yes / No)
    2. **Did you deliver as requested?** (Yes / No / Partial)
    3. **Communication clarity?** (1-5 star scale or Yes/No?)
  - After answering, taps "Done" or auto-proceeds to next card

- **Question wording clarity**:
  - "Any issues?" → issues with what? (Consultations, Client preferences unclear, difficult hair type?)
  - "Did you deliver as requested?" → Barber's subjective assessment of whether they nailed what Client asked for
  - "Communication clarity?" → how clear were the Client's preferences?

- **Visual design**:
  - Large buttons/stars for touch
  - No text input, only taps
  - Confirmation after answering? ("Got it!" then next card auto-appears)

- **Next card**:
  - After Delivery Report submitted, queue refreshes
  - Next Consultation in queue appears (if any)
  - If no more, show: "You're all caught up" or "Tap to refresh"

- **Fallback Card flow** (if AI processing failed):
  - Card shows text-only: Client's preferences, style, texture, specifics, notes
  - Barber still taps "Done" and answers Delivery Report
  - Same 3 questions, same flow

- **Barber cannot see Feedback**:
  - Delivery Report is Barber's view, Feedback is from Client (private)
  - Barber doesn't know Client's satisfaction or rating (maybe later in batch reports, not real-time)

---

### P0 — Admin Dashboard & Performance (3 items)

The Owner's view into business health. Must be fast and scannable.

**P0.15**: Grill Admin Dashboard matrix view  

- **Matrix structure**:
  - **Rows**: Barbers (sortable by name, by overall accuracy %, or by any column)
  - **Columns**: Hair styles (Fade, Undercut, Pompadour, Taper, etc. — ordered alphabetically or by popularity?)
  - **Cells**: Accuracy % (e.g., 95%, 73%, "—" if no data)
  - **Color coding** (optional): green (80%+), yellow (60-79%), red (<60%), gray (no data)

- **Data sources**:
  - Accuracy % = consensus between Client Feedback ("did I get what I asked for?") and Barber Delivery Report ("did I deliver as requested?")
  - If Client says "Yes" and Barber says "Yes" → 100% accuracy
  - If Client says "Yes" but Barber says "Partial" → 75% accuracy (split the difference)
  - If Client says "No" → 0% accuracy (regardless of Barber's self-assessment)
  - If no Feedback received → unknown (cell shows "?" or empty)

- **Sorting & filtering**:
  - Sort rows by Barber name (A-Z)
  - Sort rows by overall accuracy % (highest first)
  - Sort rows by # Consultations (busiest first)
  - Filter columns by style popularity (show only Fade, Taper, etc., hide rare styles)
  - Filter by date range (last week, last month, all-time)
  - Filter by Barber name (search)

- **Drill-down**:
  - Click a cell → see all Consultations for that Barber/Style combo
  - Show: Client name (first name only), date, Feedback rating, Barber's Delivery Report, AI clone preview (if Personalized)
  - Can scroll through list of raw Consultations to spot patterns

- **Summary row/column** (optional):
  - Bottom row: "Overall accuracy" across all Barbers per Style
  - Right column: "Overall accuracy" per Barber across all Styles

- **Performance metrics**:
  - # Consultations per Barber (total, or per week)
  - Average feedback rating per Barber (1-5 scale, if captured)
  - Repeat Client % (if Client returns, likely happy with Barber)

- **Visual design**:
  - Tablet landscape primary (Owner viewing on iPad)
  - Mobile portrait secondary (smaller shops, Owner checking on phone)
  - Horizontally scrollable if many Styles (not ideal, but acceptable)
  - Table borders, clear headers, readable fonts

**P0.16**: Grill Admin Dashboard performance  

- **Database queries**:
  - Query needs to: get all Consultations for a Shop in date range, join with Feedback (may be missing), join with Delivery Reports, aggregate accuracy per Barber per Style
  - Large shops: 100+ Consultations/day, 10+ Barbers, 20+ Styles → matrix has 200+ cells to calculate
  - Latency target: <1 second to load Dashboard (not <100ms, but <1s acceptable for an admin tool)

- **Indexing strategy**:
  - Indexes needed: (shop_id, created_at), (barber_id, style), (consultation_id, feedback_id)
  - Test query performance with 10,000 Consultations per Shop

- **Caching**:
  - Is Dashboard cached? (e.g., "last updated 5 min ago")
  - Cache invalidation: when new Feedback arrives or Delivery Report submitted, invalidate?
  - Or recalculate on-demand?

- **Pagination**:
  - If matrix is huge (50 Barbers × 50 Styles), can Owner view all at once or paginated?
  - Probably show top N and hide rare combos (click "Show all styles" to expand)

**P0.17**: Grill Admin Dashboard Barber management  

- **Add Barber**:
  - Form: Barber name, (email? — for PIN delivery)
  - System generates random 4-digit PIN
  - PIN displayed or emailed to Owner (how to deliver to Barber?)
  - Barber record created in database with shop_id, barber_id (unique), pin_hash, created_at

- **Edit Barber**:
  - Can change name (does this affect historical Consultations? — likely no, denormalize old name)
  - Can (re)generate new PIN (old PIN invalidated? or both work?)

- **Remove Barber**:
  - Soft delete (barber_id marked inactive, historical Consultations remain)
  - Hard delete (impossible in production, too much data loss)
  - What happens to in-flight Consultations? (Staff View shows error? Consultations rerouted?)

- **View Barber**:
  - Owner taps Barber name → see their performance trends, upcoming/pending Consultations, Delivery Reports submitted, Feedback received
  - Maybe: click to drill into matrix row (Barber's accuracy per Style)

---

### P0 — Multi-tenancy (1 item)

Non-negotiable. If you don't get this right, you have a critical data leak.

**P0.18**: Grill multi-tenant data isolation  

- **Every query must scope by shop_id**:
  - When Barber authenticates with PIN, system knows which Shop (but how? PIN lookup includes shop_id?)
  - When Owner logs in, system knows Shop
  - Every query filters by shop_id: `SELECT * FROM consultations WHERE shop_id = X`
  - If a query is missing shop_id, it risks leaking data across Shops

- **Testing**:
  - Create 2 test Shops: Shop A and Shop B
  - Barber from Shop A tries to access Shop B's Consultations (PIN won't match, correctly denied)
  - Owner from Shop A tries to view Shop B's Dashboard (auth check, correctly denied)
  - API endpoints: manual testing that shop_id is enforced

- **Shared PIN risk**:
  - Original ADR #0002 worried about shared PIN. Now using per-Barber PIN, so much safer.
  - But per-Shop PIN would still be risky (one PIN sees all Barbers' queues).
  - Per-Barber PIN is correct: Barber A's PIN doesn't give access to Barber B's queue (if they work at same Shop)

---

### P0 — API Endpoints (4 items)

The glue between frontend and backend. Spec these out precisely.

**P0.19**: Grill API endpoint: Consultation submission  

```
POST /api/v1/consultations
Headers: Content-Type: application/json
Body: {
  shop_id: "shop_123" (from QR code URL),
  client_id: "client_456" (or null for new Client),
  barber_id: "barber_789",
  consultation_type: "quick_pick" | "personalized",
  client_name: "Jason",
  client_phone: "555-1234",
  client_pin: "1234" (optional, null for new Client),
  
  // Quick Pick fields:
  style: "Fade",
  texture: "Straight",
  skin_tone: "Medium",
  specifics: "Tight fade, leave on top",
  
  // Personalized fields (if type == personalized):
  photo_ids: ["photo_1", "photo_2"],  // URLs or IDs from file upload
  face_consent: true,
  
  // Shared metadata:
  client_ip: "1.2.3.4",  // for abuse detection
  user_agent: "..."  // for device tracking
}

Response 200 OK: {
  consultation_id: "cons_999",
  status: "received",
  message: "Your consultation is on the way to Jason",
  ai_processing_status: "pending" (if personalized),
  estimated_completion: "2024-07-16T14:30:00Z" (if personalized)
}

Response 400 Bad Request: {
  error: "validation_error",
  details: [
    { field: "client_phone", message: "Invalid phone format" }
  ]
}

Response 429 Too Many Requests: {
  error: "rate_limited",
  message: "Too many consultations from this IP. Try again in 60 seconds."
}
```

- **Validation on server**:
  - shop_id valid (exists)?
  - barber_id exists in this Shop?
  - client_phone format (accept multiple formats?)
  - Fuzzy match: if client_phone is close to existing, ask for PIN confirmation (or return 409 "Ambiguous client"?)
  - style, texture valid enum values?
  - specifics not >500 chars?
  - photo_ids not null for personalized?

- **Return values**:
  - consultation_id so Client can (theoretically) track status
  - AI processing status & ETA for Personalized (helpful for Client waiting in chair)
  - Error details helpful for debugging

- **Rate limiting**:
  - Per IP: max 10 Consultations per minute (abuse prevention)
  - Per Shop: max 1000 Consultations per day (sanity check)

**P0.20**: Grill API endpoint: Barber Staff View  

```
GET /api/v1/staff_view/{barber_id}
Headers: Authorization: Bearer {barber_pin}  // or PIN in header?

Response 200 OK: {
  barber_id: "barber_789",
  barber_name: "Marcus",
  shop_name: "Icon Barbershop",
  consultations: [
    {
      consultation_id: "cons_999",
      client_name: "Jason",
      consultation_type: "personalized",
      ai_clone_preview_url: "https://...",  // or null if failed
      fallback_card: null,  // or { preferences: {...} } if AI failed
      created_at: "2024-07-16T14:25:00Z"
    },
    ...
  ],
  last_updated: "2024-07-16T14:30:00Z",
  next_poll_in_seconds: 5  // if polling-based, tells Client how often to refresh
}

Response 401 Unauthorized: {
  error: "invalid_pin",
  message: "PIN incorrect or expired"
}
```

- **Authentication**:
  - How is PIN passed? (Bearer token, header, query param?)
  - How to prevent PIN from being exposed in logs? (log "***" instead of PIN)
  - PIN validated on each request, or session-based?

- **Real-time vs. polling**:
  - WebSocket (maintains connection, pushes new Consultations): complex, requires infrastructure (Socket.io, ws server)
  - Long polling (Client requests, server holds response until new data, then responds): simpler, more battery-intensive
  - Short polling (Client refreshes every 5 sec): simplest for MVP, but slower feedback (up to 5 sec delay)
  - **MVP decision**: short polling, next_poll_in_seconds tells Client how often to refresh

- **Data included**:
  - AI preview URL (if available) — how to generate? How long valid?
  - Fallback card (if AI failed) — full text of preferences
  - Timestamp for cache validation (if polling)

**P0.21**: Grill API endpoint: Delivery Report submission  

```
POST /api/v1/consultations/{consultation_id}/delivery_report
Headers: Authorization: Bearer {barber_pin}
Body: {
  barber_id: "barber_789",
  issues_flag: true | false,
  delivery_match: "yes" | "no" | "partial",
  communication_clarity: 1 | 2 | 3 | 4 | 5,  // or "yes" | "no"?
}

Response 200 OK: {
  delivery_report_id: "report_111",
  consultation_status: "completed",
  message: "Delivery report saved. Next consultation ready.",
  next_consultation: { ... }  // queue refresh
}

Response 400 Bad Request: {
  error: "validation_error",
  details: [...]
}

Response 404 Not Found: {
  error: "consultation_not_found",
  message: "This consultation doesn't exist or belongs to another Barber"
}
```

- **Validation**:
  - Consultation exists and belongs to authenticated Barber?
  - Issues_flag is boolean?
  - Delivery_match is enum?
  - Communication_clarity is 1-5 (or yes/no)?

- **Return**:
  - Delivery report ID for auditing
  - Consultation marked as "completed"
  - Next Consultation in queue (for convenience, so Barber doesn't have to re-fetch)

**P0.22**: Grill API endpoint: Admin Dashboard matrix  

```
GET /api/v1/admin/dashboard/matrix?start_date=2024-07-01&end_date=2024-07-16&styles=fade,undercut
Headers: Authorization: Bearer {owner_token}

Response 200 OK: {
  shop_id: "shop_123",
  shop_name: "Icon Barbershop",
  date_range: { start: "2024-07-01", end: "2024-07-16" },
  matrix: {
    barbers: [
      { barber_id: "b1", name: "Marcus", accuracy_overall: 92 },
      { barber_id: "b2", name: "Alex", accuracy_overall: 78 },
    ],
    styles: [
      { style_name: "Fade", count: 42, accuracy_avg: 89 },
      { style_name: "Undercut", count: 18, accuracy_avg: 76 },
    ],
    data: [
      { barber_id: "b1", style: "Fade", accuracy_pct: 95, count: 23 },
      { barber_id: "b1", style: "Undercut", accuracy_pct: 85, count: 5 },
      { barber_id: "b2", style: "Fade", accuracy_pct: 82, count: 19 },
      ...
    ]
  },
  last_calculated: "2024-07-16T14:30:00Z"
}

Response 401 Unauthorized: {
  error: "invalid_auth",
  message: "Owner must be logged in"
}
```

- **Caching**:
  - Data calculated when? (on-demand, cached for 5 min, or batch-calculated nightly?)
  - Last_calculated timestamp helps Owner know if data is stale

- **Filtering**:
  - start_date, end_date: filter by date range
  - styles: optional, filter which Styles to include
  - barbers: optional, filter which Barbers to include

- **Performance**:
  - For large Shops, this query is expensive (join Consultations, Feedback, Delivery Reports, aggregate)
  - Must be indexed and cached

---

### P0 — AI Processing Pipeline (5 items)

This is your riskiest technical area. Get it right in MVP.

**P0.23**: Grill AI processing pipeline  

**Flow**:
1. Client uploads photo(s) in Personalized flow
2. Server receives photos, validates (size, format, quality)
3. Server initiates call to external AI service (Higgsfield, Banana, or similar)
4. AI service processes: generates face/hair clone
5. Clone returned to server, stored
6. While AI processes, Client answers preference questions in parallel
7. When both done: style overlaid onto clone, preview returned to Client
8. If AI fails (timeout, error): Fallback Card created instead

**Decisions to make**:

- **Photo upload**:
  - Server receives photos via multipart/form-data
  - Validate: size (max 10MB each?), format (JPEG/PNG only?), resolution (min 1024×1024?)
  - Scan for EXIF data: remove for privacy
  - Generate unique photo_id for tracking
  - Store temporarily (S3, GCS, or database BLOB?)

- **AI service call**:
  - Which service? (Higgsfield, Banana, RunPod, or build custom?)
  - API call: pass photos + desired angles (front, left, right, back?) + optional face consent
  - Response: clone data (image or model? vector or raster?)
  - Latency: expected 30 sec? 1 min? 2 min? **MUST TEST**

- **Style application**:
  - After clone ready, apply selected style
  - Another API call to AI service? Or client-side CSS/WebGL?
  - Latency: seconds or minutes?

- **Storage**:
  - Store clone in S3/GCS with versioning (if algorithm improves, can re-generate)
  - Store clone_id in database (linked to Client, Consultation, algorithm_version)

- **Fallback on failure**:
  - Timeout: if AI processing takes >2 min, trigger Fallback Card
  - Error: if AI service returns error, trigger Fallback Card
  - Log failure: error_reason, which AI service, timestamp, consultation_id (for diagnostics)

**P0.24**: Grill AI service integration choice  

- **Options**:
  - **Higgsfield**: web service for AI cloning, how much does it cost? Latency? Uptime SLA?
  - **Banana**: serverless GPUs, run custom model, cheaper? Faster?
  - **Replicate**: run open-source models (like Stable Diffusion for hair), cost model?
  - **Custom**: train model yourself (expensive, slow)

- **Evaluation criteria**:
  - **Cost**: per photo, per request, or monthly subscription?
  - **Latency**: 30 sec is acceptable, 2 min is not (Client in chair)
  - **Quality**: realistic clones? Good for Client confidence?
  - **Uptime**: 99.9% SLA?
  - **Documentation**: API docs, code examples, support?
  - **Scalability**: can handle 1000 Shops × 100 Consultations/day?

- **Fallback strategy**:
  - If primary service down, is there a backup? (different provider? manual process?)

**P0.25**: Grill Fallback Card triggering  

- **Scenarios**:
  1. Photo upload fails (too large, network error): Fallback immediately
  2. AI service timeout (>2 min): Fallback
  3. AI service returns error: Fallback
  4. Photo too blurry/low quality: Fallback (detection by AI? or manual?)
  5. Face consent given but face fails: Fallback (skip face, use hair only)

- **Barber notification**:
  - Consultation appears in Staff View as Fallback Card (text-only)
  - Card clearly marked: "Preview unavailable" or "Text-only consultation"
  - Barber still completes Delivery Report

- **Client experience**:
  - Client sees: "We couldn't generate your preview, but [Barber Name] has all your preferences and will take great care of you"
  - Option to retry later? (probably not MVP)

- **Error logging**:
  - Log: consultation_id, error_type (timeout/invalid_photo/service_down), error_message, timestamp
  - Aggregate: "How many Fallback Cards per day?" "Which AI service failures most common?"
  - Support dashboard: view Fallback Card error logs

**P0.26**: Grill Barber PIN reset flow  

- **Trigger scenarios**:
  1. Barber lost device (need new PIN for new device)
  2. Barber forgot PIN (can't access Staff View)
  3. Barber's PIN exposed (security breach, need new PIN)
  4. Owner suspects abuse (manually reset)

- **Reset process**:
  - Owner logs into Admin Dashboard → Barber management → click [Reset PIN]
  - System generates new 4-digit PIN
  - PIN delivered to... (how?)
    - **Email**: Owner's email, Owner forwards to Barber (not ideal, but simple MVP)
    - **SMS**: Barber's phone (requires storing phone number, cost per SMS)
    - **In-person**: Owner tells Barber (simplest for small shops)
    - **QR code**: Owner generates QR code with new PIN, Barber scans (secure, works offline)

- **Old PIN invalidation**:
  - Does old PIN stop working immediately?
  - Is there a grace period? (e.g., both old and new PIN work for 1 hour)
  - Can multiple PINs be active? (if Barber works multiple devices)

- **Questions**:
  - Is PIN reset tracked (audit log of who reset, when)?
  - Can Barber self-reset, or only Owner?

**P0.27**: Grill Client PIN forget/reset ✅ RESOLVED 2026-07-16 (see P0.5)
- **Decision**: email reset link. Client enters email on return visit → clicks "Forgot PIN?" → reset link sent to email on file → sets new PIN. Old Consultations remain linked to email (not orphaned). No Owner involvement.
- Phone-number identity was dropped; email is the sole identifier, so email-based reset is natural.

---

## P1: Important (Needed for Launch)

### P1 — Email & Notifications (4 items)

Your only out-of-band notification channel. Must be reliable.

**P1.1**: Grill email system  

- **Provider choice**:
  - SendGrid: $0.001 per email, 100K/month free tier, good reputation
  - Mailgun: similar pricing
  - AWS SES: cheapest ($0.0001 per email), but less support
  - Custom SMTP: your own mail server (not MVP)

- **Email authentication**:
  - SPF, DKIM, DMARC configured for your domain
  - Prevents emails landing in spam

- **Bounce handling**:
  - Hard bounce (invalid email): log, mark Client as "bad email", don't retry
  - Soft bounce (temporary, mailbox full): retry 3 times over 24 hours
  - Complaint (Client marks as spam): log, unsubscribe Client

- **Unsubscribe**:
  - Every email includes unsubscribe link (legal requirement in some regions)
  - Client clicks → adds to suppression list → no more emails sent to them
  - But Consultations still submitted (just no feedback email sent)

**P1.2**: Grill Feedback email flow  

- **When sent**:
  - Immediately after Consultation submitted? (no, Client hasn't received service yet)
  - 30 min after Consultation submitted? (gives Client time to leave shop, think about it)
  - Next day? (too long, Client forgets)
  - **Decision**: 30 min after submission (compromise)

- **Email content**:
  - Subject: "How was your haircut at [Shop Name]? [Barber Name] would love to know"
  - Body: brief intro, feedback link (private URL, not querystring with Client ID to avoid tracking)
  - Unsubscribe link
  - Shop branding (logo, colors, contact info — Phase 2, not MVP)

- **Feedback link**:
  - URL: `https://pleroma.co/feedback/{token}` where token is random, signed JWT or similar
  - Token valid for 7 days (enough time for Client to respond)
  - Token single-use? (once feedback submitted, token expires) or reusable (Client can change their answer)?
  - Clicking link opens feedback form in browser (mobile-optimized)

- **Tracking**:
  - Can Owner see open rate? (email service provides this)
  - Can Owner see click rate? (Owner sees how many Clients clicked feedback link)
  - Privacy: no tracking pixels if GDPR applies

**P1.3**: Grill AI model improvement notification  

- **When sent**:
  - When Pleroma improves AI clone generation algorithm
  - Email to all Clients with Personalized clones: "We've improved our technology. Want us to re-generate your preview?"

- **Email content**:
  - Explanation of improvement (better accuracy, faster, etc.)
  - Opt-in link: "Yes, improve my preview"
  - Unsubscribe option

- **Re-generation flow**:
  - Client clicks → re-generates clone with new algorithm
  - New clone stored, old clone versioned (can optionally view old)
  - Shows comparison? (before/after) or just new version?

**P1.4**: Grill Barber PIN reset notification  

- **Scenario**: Owner resets Barber's PIN, needs to tell Barber the new PIN

- **Delivery method**:
  - **Email**: simplest, but requires Barber to read email
  - **SMS**: requires Barber phone number, costs $, but more immediate
  - **QR code**: Owner generates, Barber scans with phone (secure, no email needed)
  - **In-person**: Owner just tells them (best for small shops, scales poorly)

- **MVP decision**: probably email (simplest), or in-person for first PIN

---

### P1 — Offline Resilience & Session Management (4 items)

Mobile and barbershop wifi can be flaky. Must handle it.

**P1.5**: Grill offline data persistence  

- **Client Consultation flow**:
  - Client fills out Quick Pick or Personalized preferences
  - Browser auto-saves to LocalStorage after each field change
  - Connection lost mid-form → Client continues typing
  - When connection regained → auto-sync to server, show "Saved" confirmation

- **Implementation**:
  - LocalStorage schema: `{ shop_id, barber_id, consultation_type, draft_data: {...}, last_synced_at }`
  - Sync logic: after field change, wait 500ms, then sync (debounce to avoid too many requests)
  - Conflict resolution: if Client modified draft locally but server has newer version, which wins? (probably client, they're still in the chair)

- **Barber Staff View**:
  - Barber's queue position persisted locally (which Consultation card they were viewing)
  - If connection drops and restores, resume at same position

**P1.6**: Grill Client mid-consultation network loss  

- **Scenario 1: Client loses connection, regains quickly**
  - Auto-save in LocalStorage
  - On reconnect, sync to server
  - UX: show "Reconnecting..." then "Saved to Barber [Name]"

- **Scenario 2: Client loses connection, doesn't regain before leaving chair**
  - Draft persisted in LocalStorage on their phone
  - Later, Client taps "Submit my consultation" → syncs late (30 min? 1 hour?)
  - Server timestamps might be off (Consultation appears to have been submitted later than actual time)
  - Is this a problem? (probably not, Owner cares about Consultation, not exact timestamp)

- **Scenario 3: Server never sees Consultation (connection never regains in time)**
  - Barber doesn't receive it
  - Client can see in their browser that it's still "unsaved" (draft indicator)
  - Option to clear draft or retry
  - If Client closes browser without syncing, Consultation lost (accept this MVP trade-off)

- **Barber fallback**:
  - If Client's Consultation never reaches server but Client is still in chair, Barber could manually enter the details
  - Or: Client hands phone to Barber, Barber submits from their phone (different network?)
  - Probably out of scope for MVP

**P1.7**: Grill Barber Staff View persistence  

- **Session state**:
  - Which Consultation card is Barber viewing? (expanded, full-screen, or list)
  - Queue scroll position
  - PIN saved in LocalStorage (so not re-entered on each page load)

- **Restore on reopen**:
  - Barber closes tab → later opens Staff View again
  - Taps PIN (remembered? or enter again?)
  - Fetches latest queue from server
  - Resumes at same scroll position or last viewed Consultation card

- **Questions**:
  - If new Consultations arrived while Barber was away, do they appear at top or bottom of queue?
  - If a Consultation Barber was viewing was completed by someone else (different Barber? — shouldn't happen), what happens?

**P1.8**: Grill error logging & diagnosis  

- **What to log**:
  - Consultation submission: client_id, barber_id, consultation_type, submission timestamp, server received timestamp
  - AI processing: consultation_id, photo_ids, ai_service_called, start_time, end_time, result (success/timeout/error)
  - Fallback Card: trigger_reason (timeout/invalid_photo/service_error), error_message, consultation_id
  - Delivery Report: consultation_id, barber_id, answers submitted, timestamp
  - Feedback: consultation_id, rating, expectations_match, timestamp, ip_address (to spot spam)

- **Storage**:
  - Logs in database (easy to query, slow)
  - Logs in external service (Datadog, ELK, Sentry, LogRocket) — better for analytics and alerting

- **Access**:
  - Owner can view error log? (probably not MVP, too complex)
  - Support team can view error log? (yes, support portal)
  - Automatic alerts: if >10% of Consultations result in Fallback Cards, alert support

- **Retention**:
  - How long to keep logs? (30 days? 6 months? 1 year?)
  - GDPR: logs containing Client data must be deleted when Client profile deleted

---

### P1 — Edge Cases & Error Flows (6 items)

These are the "what if"s that kill products in production.

**P1.9**: Grill duplicate Client detection  

- **Scenario**: Client enters phone "555-1234", system finds "555-1235" in database (off by 1 digit)

- **Fuzzy matching algorithm**:
  - Levenshtein distance: max distance 1 (edit distance of 1 = 1 character difference)
  - If match found, show: "Did you mean 555-1235 for Jason?" with Yes/No buttons
  - If Yes → Client enters PIN → accesses prior Consultations
  - If No → proceed as new Client

- **False positive risk**:
  - "555-1234" and "555-1235" might be different people (siblings with similar numbers)
  - If Client accidentally pins to someone else's account, they see that person's hair history
  - Mitigated by: requiring PIN (and name match) to confirm

- **Questions**:
  - Should match also compare name? (phone match + name match = high confidence, no PIN required?)
  - What if multiple matches? (e.g., "555-1234" matches both "555-1235" and "555-1234" — shouldn't happen, but edge case)

**P1.10**: Grill concurrent Consultations  

- **Scenario**: Client scans QR code, starts Quick Pick, never submits. Later scans again, starts another Quick Pick.

- **Same session?**:
  - Browser LocalStorage cleared between sessions? (no, persists)
  - If Client has unsaved draft from earlier, and starts new Consultation, which one is submitted?
  - Likely: user sees "You have an unsaved consultation. Continue or start fresh?"

- **Different devices**:
  - Client starts Personalized on Barber's tablet, then QR code on their phone
  - Two Consultations submitted to same Barber, same Client (or different Client ID?)
  - Probably OK (Barber deals with 2 queue items from same Client)

- **Race condition**:
  - Client submits Consultation, server is processing, Client submits again before first completes
  - Server should accept both (two separate Consultations, not deduped)
  - But Client might think it failed and resubmit (normal re-try behavior)

**P1.11**: Grill Consultation with deleted Barber  

- **Scenario**: Consultation submitted to Barber A, Barber A is fired/removed from system, Client's Consultation orphaned

- **Options**:
  1. Barber is soft-deleted (barber_id marked inactive, historical Consultations still linked)
  2. Consultation reassigned to another Barber (messy, who decides?)
  3. Consultation orphaned, never shown to anyone (bad, Client's Consultation lost)

- **MVP decision**: soft-delete Barbers (keep historical Consultations, mark Barber as inactive)

- **Impacts**:
  - Admin Dashboard: inactive Barber still shows in matrix? (probably yes, for historical record)
  - Staff View: inactive Barber's PIN no longer works (can't re-access Staff View)
  - Client Return lookup: if Client's prior Consultation was with deleted Barber, still shows in history

**P1.12**: Grill incomplete feedback  

- **Scenarios**:
  1. Client opens feedback email, answers rating (e.g., 5 stars), doesn't answer "expectations match"
  2. Client opens feedback email but page times out, no submission
  3. Client clicks feedback link multiple times (does form reset each time or pre-fill?)

- **Handling**:
  - Both rating and expectations_match required fields? (yes, or feedback incomplete)
  - If incomplete, show error: "Please rate both how satisfied you were and whether we met your expectations"
  - Form can be submitted multiple times (latest answer wins, overrides prior feedback)
  - Timeout: form remains valid for 7 days

**P1.13**: Grill photo upload edge cases  

- **File size**:
  - Client uploads 50MB photo (mobile camera RAW?) — reject with error: "Photos must be under 10MB"
  - Client uploads 100x100 pixel photo (too small) — reject: "Photo too small, please retake"

- **File format**:
  - Client uploads PDF, EXE, or other non-image — reject
  - Accept: JPEG, PNG, WEBP

- **Image quality**:
  - Blurry photo (detected by AI or manual review?) — Fallback Card
  - Dark photo (underexposed) — could still work or flag as poor quality?

- **EXIF data**:
  - Camera EXIF includes location, timestamp, camera model — strip for privacy
  - Some shops might not want location embedded

- **Multiple retries**:
  - If upload fails, Client can retry
  - Max retries? (probably unlimited, but debounce to avoid spam)

**P1.14**: Grill AI processing timeout  

- **Latency targets**:
  - Photo upload + initial validation: <1 sec
  - AI clone generation: target 30 sec, max 2 min before Fallback
  - Style application: target 30 sec
  - Total time Client waits: preference questions should complete in 1-2 min, AI should complete by then

- **Timeout logic**:
  - Start AI call immediately after photo upload
  - Set timeout: 120 seconds (2 min)
  - If no response after 120 sec, trigger Fallback Card

- **Client experience**:
  - "Generating your preview..." spinner while waiting
  - If timeout, show: "We couldn't generate your preview in time, but [Barber] has your preferences and will take great care of you"

- **Retry**:
  - Client can optionally retry? (probably not MVP, too complex)
  - Or: Pleroma retries silently in background, shows updated preview if successful?

---

### P1 — Security & Privacy (8 items)

Regulatory risk + trust risk. Get this right.

**P1.15**: Grill GDPR compliance  

- **Data subject rights**:
  - Right to access: Client can request their data (name, phone, Consultations, feedback, AI clones)
  - Right to rectification: Client can correct their phone number, delete old data
  - Right to erasure ("right to be forgotten"): Client can request all data deleted
  - Right to data portability: Client can request export of data in machine-readable format

- **Consent**:
  - Biometric consent: explicit checkbox before photo upload ("I consent to my photo being used to create my preview")
  - Feedback email: implicit opt-in (Client receives it; if they don't want, they unsubscribe)
  - Marketing: no marketing emails (focus on functional notifications only)

- **Data retention**:
  - Photos: deleted immediately after AI clone generated (or within 24 hours)
  - AI clones: retained indefinitely (part of Client's profile) unless deleted
  - Consultations/Feedback: retained indefinitely for business analytics
  - Delivery Reports: retained indefinitely for Barber performance tracking
  - Logs: retained 30 days then purged

- **Privacy policy**:
  - Explain data collection: name, phone, photos (optional), Consultations, feedback
  - Explain use: generate AI clone, route to Barber, show Admin Dashboard, measure performance
  - Explain retention: photos deleted, clones kept, Consultations kept for history
  - Explain rights: access, rectification, erasure, portability
  - GDPR compliant template (consult lawyer)

**P1.16**: Grill PII handling  

- **What is PII**:
  - Name: collected, stored in database
  - Phone: collected, stored in database, used as Client ID
  - Email: not collected (except if Client provides for PIN reset — Phase 2)
  - Photos: collected, stored temporarily, deleted after AI clone
  - AI clone: not PII (it's a generated model, not their actual photo)

- **Storage**:
  - Database: encrypted at rest? (depends on provider, e.g., AWS RDS encryption)
  - Photos (S3/GCS): encrypted in transit (HTTPS) and at rest
  - LocalStorage (browser): not encrypted (XSS vulnerability if attacker injects JS)

- **Audit trail**:
  - Who accessed Client data? (not applicable for MVP, maybe Phase 2)
  - When was data deleted? (log deletion timestamp)

- **Deletion cascade**:
  - When Client requests profile deletion:
    - Delete Client record
    - Delete all Consultations linked to Client
    - Delete all Feedback linked to Consultations
    - Delete AI clones linked to Client
    - Delete all logs mentioning Client
    - Redact Delivery Reports (keep report, anonymize Client name?)

**P1.17**: Grill Client profile deletion workflow  

- **Trigger**:
  - Client requests deletion (via support, or self-service in app — Phase 2)
  - Owner initiates deletion (e.g., client asked to remove, GDPR request)

- **Soft delete vs. hard delete**:
  - Soft delete: mark client_id as deleted, hide from all queries, retain data for compliance audit
  - Hard delete: remove all references, purge from database (risky if audit needed)
  - **MVP**: soft delete (safer, no accidents)

- **Data retention after deletion**:
  - Client record: marked deleted, not visible to Owner
  - Consultations: redacted (client_name → "Deleted", client_phone → null)
  - Feedback: redacted (similarly)
  - AI clones: deleted
  - Logs: redacted

- **Audit trail**:
  - Log: who requested deletion, when, reason (if provided)

**P1.18**: Grill PIN storage security  

- **Barber PIN**:
  - Stored in browser LocalStorage (plain text? or hashed?)
  - **Risk**: XSS attack injects JS, steals PIN from LocalStorage
  - **Mitigation**: strict Content Security Policy, no inline JS, sanitize all user input
  - Alternative: store PIN in browser's SessionStorage (cleared on tab close) — but then need to re-enter on reopen
  - **Decision**: LocalStorage plain text is acceptable if XSS is mitigated

- **Client PIN**:
  - Set during first consultation, stored locally
  - On return visit, Client enters PIN manually (not auto-filled)
  - Server-side: validate against what? (stored hash? previous submission?)

- **Server storage**:
  - If PIN stored in database: hash it (bcrypt, Argon2)
  - Never log actual PINs (log "***" instead)
  - Rotate algorithm if compromised

**P1.19**: Grill API authentication  

- **Client Consultation submission**:
  - No authentication needed (public endpoint, anyone can submit)
  - Rate limiting prevents abuse (max 10 requests per IP per minute)
  - shop_id validates endpoint is for correct Shop
  - **Risk**: spam Consultations to a Shop (mitigated by rate limiting)

- **Barber Staff View**:
  - PIN required (passed in header or bearer token?)
  - PIN validated against database hash
  - Server looks up which Barber this PIN belongs to, returns their Consultations

- **Owner Admin Dashboard**:
  - Login required (username + password, or OAuth?)
  - Session token (JWT? Session cookie?)
  - Token includes shop_id (ensures Owner can only see their Shop's data)

- **Questions**:
  - Who logs in as Owner? Email-based login?
  - How do Owners create accounts? Signed-up by you during onboarding, or self-serve?
  - Password reset flow?

**P1.20**: Grill rate limiting  

- **Per IP**:
  - Max 10 Consultations per minute (abuse prevention)
  - Max 1000 Consultations per day (sanity check)
  - Sliding window or fixed bucket?

- **Per Shop**:
  - Max 1000 Consultations per day (if a Shop tries to spam themselves)

- **Feedback submission**:
  - Max 100 feedback submissions per hour (abuse prevention)

- **PIN validation**:
  - Max 5 incorrect PIN attempts per hour (brute-force prevention)
  - Lock account for 10 minutes after 5 failures

- **Implementation**:
  - Redis for fast rate limit checks
  - Return 429 Too Many Requests with Retry-After header

**P1.21**: Grill photo encryption  

- **In transit**:
  - HTTPS/TLS (standard for all web traffic)
  - Enforced? (yes, no HTTP fallback)

- **At rest**:
  - S3/GCS: server-side encryption enabled by default
  - Client-side encryption? (encrypt on browser before upload? — complex, probably not MVP)

- **Key management**:
  - Who manages encryption keys? (AWS/Google manages, or custom key management?)
  - Key rotation? (handled by cloud provider)

**P1.22**: Grill multi-owner access control  

- **Scenario**: Shop "Icon Barbershop" has 2 Owners: Marcus (founder) and Alex (manager)

- **Access levels**:
  - **Full access**: Can view Dashboard, manage Barbers, view all Consultations/Feedback
  - **Limited access**: Can view Dashboard for certain Barbers only, cannot manage Barbers
  - **Read-only**: Can view Dashboard, cannot make changes

- **UI**:
  - Owner login: Marcus or Alex enters credentials
  - Session: includes shop_id and access_level
  - Dashboard: queries filtered by access_level and barber_ids

- **Invitation**:
  - Marcus invites Alex: sends email with link to join Shop
  - Alex clicks → creates account (or links existing) → granted access
  - Marcus specifies access level during invitation

- **MVP scope**:
  - Probably too complex for MVP
  - Defer to Phase 2: first MVP assumes single Owner per Shop

---

### P1 — Performance & Scalability (4 items)

Your product is unusable if it's slow.

**P1.23**: Grill database indexing  

- **High-traffic queries**:
  - `SELECT * FROM consultations WHERE shop_id = X AND created_at > Y`
  - `SELECT * FROM delivery_reports WHERE barber_id = X AND created_at > Y`
  - `SELECT * FROM feedback WHERE consultation_id = X`

- **Indexes needed**:
  - `(shop_id, created_at)` on consultations
  - `(barber_id, created_at)` on delivery_reports
  - `consultation_id` on feedback (likely foreign key index, automatic)
  - `(shop_id, barber_id)` on consultations (for Staff View queries)

- **Testing**:
  - 10,000 Consultations per Shop
  - Query time: <100ms for simple queries, <1s for aggregations

**P1.24**: Grill caching strategy  

- **Admin Dashboard matrix**:
  - Expensive query: join Consultations, Feedback, Delivery Reports, aggregate accuracy per Barber per Style
  - Cache for how long? (5 min, 1 hour, 1 day?)
  - Cache invalidation: when new Feedback/Delivery Report arrives, invalidate Dashboard cache for that Shop
  - Alternative: calculate nightly in background job, serve pre-calculated results

- **Staff View queue**:
  - Barber fetches their queue frequently (polls every 5 sec)
  - Cache: Barber's queue in Redis, key = `staff_view:{barber_id}`
  - Invalidate: when new Consultation arrives for this Barber
  - TTL: 10 minutes (if Barber stops polling, drop cache)

- **AI clone preview**:
  - Preview image cached in CDN (CloudFlare, CloudFront)
  - Long TTL (1 year), since clones don't change (except re-render on algo update)

**P1.25**: Grill photo storage  

- **Options**:
  - **S3**: $0.023 per GB stored, $0.0007 per GET request
  - **GCS**: similar pricing
  - **Database BLOB**: cheaper (included in database storage), but slower, less scalable

- **Lifecycle**:
  - Photos uploaded → stored in S3
  - AI processes → clone generated
  - Photo deleted (immediately or after 24 hours?)
  - Clone stored in S3 (or database?)
  - Clone persists until Client deletes profile

- **Cost projection**:
  - 1000 Shops × 100 Consultations/day = 100K Consultations/day
  - Assume 20% Personalized (photos)  = 20K photos/day
  - Photos deleted after 24 hours, clones kept for 1 year
  - Storage: 20K * 365 * size_of_clone
  - If clone is 2MB: 20K * 365 * 2MB = 14.6 TB/year = ~$336/month (S3 standard)
  - Affordable? (yes, for a barbershop subscription product)

**P1.26**: Grill real-time updates  

- **Barber Staff View new Consultations**:
  - Option 1: WebSocket (Barber connects, server pushes new Consultation instantly)
  - Option 2: Long polling (Barber requests, server holds response until new data)
  - Option 3: Short polling (Barber refreshes every 5 sec)

- **MVP choice**: Short polling (simplest, next_poll_in_seconds = 5)
  - Latency: up to 5 seconds between Consultation submitted and Barber seeing it
  - Acceptable? (probably yes for barbershop workflow)

- **Admin Dashboard**:
  - Dashboard matrix doesn't need real-time (Owner can refresh manually)
  - Or: cached, refreshes every 5 minutes automatically

---

### P1 — Testing Strategy (2 items)

You ship broken code without tests.

**P1.27**: Grill testing strategy  

- **Unit tests** (business logic):
  - Test accuracy calculation: given Feedback (yes) and Delivery Report (yes), expect 100% accuracy
  - Test fuzzy phone matching: given phone "555-1234", match "555-1235"? (yes), "555-1236"? (no)
  - Test PIN validation: correct PIN → accept, wrong PIN → reject, 5 failures → lock for 10 min
  - Test Consultation submission validation: missing fields → error

- **Integration tests** (API flows):
  - Client submits Quick Pick Consultation → stored in database → appears in Barber's Staff View
  - Barber completes Delivery Report → updates Consultation status → appears in Admin Dashboard
  - Client submits Feedback → linked to Consultation → Admin Dashboard accuracy updated

- **E2E tests** (full user journeys):
  - Happy path: QR scan → Barber selection → Quick Pick → submit → Barber sees queue → completes → Admin Dashboard reflects
  - Error path: AI processing fails → Fallback Card created → Barber sees text-only → still completes

- **Load testing**:
  - 100 Consultations submitted concurrently → all succeed without errors
  - Admin Dashboard query time <1s with 10K Consultations

**P1.28**: Grill AI mocking for tests  

- **Why mock**: AI service might be slow, unreliable, or cost $ per call (bad for tests)
- **Mock strategy**:
  - In test environment, replace AI service call with stub that returns fake clone in <100ms
  - Test success path: AI returns clone, Client sees preview
  - Test failure path: AI returns error, Fallback Card created
  - Test timeout path: AI sleeps 3 seconds, Client times out, Fallback Card created

---

### P1 — Deployment & Monitoring (3 items)

You'll go live. Be ready.

**P1.29**: Grill deployment strategy  

- **Environments**:
  - **Dev**: local development, database reset frequently
  - **Staging**: clone of production, test all changes before production push
  - **Production**: live for real Shops

- **Database migrations**:
  - Version control schema changes
  - Test migrations in staging before production
  - Rollback strategy if migration fails

- **Secrets management**:
  - API keys (email service, AI service), database password stored in environment variables or secret manager (AWS Secrets Manager, etc.)
  - Never commit secrets to git

- **Rollback**:
  - If new deploy breaks production, revert to previous version
  - Keep previous version running in parallel until new version stable

**P1.30**: Grill monitoring & alerting  

- **Metrics**:
  - Uptime: target 99.5%
  - Error rate: target <0.1%
  - API latency: target <500ms p95
  - AI processing failures: target <1%
  - Email delivery rate: target >99%

- **Alerts**:
  - Uptime <99%: page on-call engineer
  - Error rate >1%: notify engineering team (Slack)
  - AI failures >10%: notify engineering team
  - Database disk usage >80%: notify ops

- **Dashboards**:
  - Real-time dashboard: uptime, error rate, latency (Grafana, Datadog, etc.)
  - Business dashboard: # Consultations today, # Feedback received, # Shops active

**P1.31**: Grill error tracking  

- **Service**: Sentry, LogRocket, or similar
- **What to log**:
  - Exceptions/errors in code (uncaught, caught and logged)
  - API errors (500, 502, etc.)
  - AI service failures
  - Email delivery failures
- **Triage**:
  - Error severity: critical (users can't use product), high (feature broken), medium (minor UX issue), low (rare edge case)
  - Auto-group errors by type (same error from 100 users = 1 error issue, not 100)
  - On-call assigns priority and owner

---

### P1 — Onboarding Flows (4 items)

First-time user experience makes or breaks adoption.

**P1.32**: Grill Shop onboarding flow  

- **Step 1: Owner creates account**
  - Email + password
  - Verify email (click link)

- **Step 2: Enter Shop details**
  - Shop name, address, phone (optional)

- **Step 3: Add Barbers**
  - List of Barbers at Shop (can add now or later)
  - Form: Barber name (required)
  - System generates PIN
  - Owner sees: "Give this PIN to [Barber Name]: XXXX"

- **Step 4: Generate QR code**
  - System generates QR code for Shop
  - Owner can print, display in shop
  - QR links to Shop consultation flow

- **Step 5: Test consultation**
  - Owner scans QR, picks a Barber, does Quick Pick test
  - Sees Barber Staff View (PIN required)
  - Completes Delivery Report
  - Reviews Admin Dashboard
  - Ready to go!

- **Guidance**:
  - Help text on each screen
  - Example: "Barber name as clients will see it (first name or nickname)"
  - No jargon (not "PIN", maybe "4-digit code")

**P1.33**: Grill Barber first-login flow  

- **Receive PIN**:
  - Owner tells Barber (in-person): "Your code is XXXX"
  - Or: Owner emails Barber: "Click here to set up your Barber Staff View"

- **First login**:
  - Barber opens Staff View link (or app)
  - Enters PIN
  - PIN saved in browser LocalStorage
  - Sees Staff View (empty, no Consultations yet)
  - Brief tutorial: "You'll see consultations here" (optional, skip-able)
  - Ready to work

- **Device setup**:
  - Barber should access on the device they'll use in the shop (phone or tablet)
  - Can access on multiple devices (each with PIN saved)

**P1.34**: Grill Client first-consultation  

- **Step 1: Scan QR**
  - Barber/owner points out QR in shop: "Scan this to tell us what you want"
  - Client scans → lands on Shop page

- **Step 2: Pick Barber**
  - "Who's cutting your hair today?"
  - List of Barbers
  - Single tap to select

- **Step 3: Enter name and phone**
  - "What's your first name?" → Jason
  - "Your phone number?" → 555-1234
  - Help text: "(so you can see your previous cuts next time)"

- **Step 4: Choose consultation**:
  - "Quick preview (30 sec) or detailed preview (2 min)?"
  - Brief explanation of each
  - Single tap to choose

- **Step 5: Consultation flow**:
  - Quick Pick or Personalized (see P0.10 and P0.11)

- **Step 6: Confirmation**:
  - "Your consultation is on the way to [Barber Name]"
  - Button: "We're ready, come over" (Barber taps in Staff View to get Client)
  - Or: automatic, no button

**P1.35**: Grill pricing tracking  

- **Requirement**:
  - Pleroma charges per Barber (e.g., $X/month per Barber)
  - Must verify Shop isn't adding fake Barbers to avoid paying

- **Enforcement**:
  - Each Barber has unique PIN
  - Each PIN tied to barber_id
  - Monitor: # of active PINs used in last 30 days = # of active Barbers
  - If # Barbers in database ≠ # active PINs, investigate fraud

- **Reporting**:
  - Billing dashboard: show # Barbers per Shop, monthly charge

---

### P1 — API Documentation & Testing (1 item)

**P1.36**: Grill API documentation  

- **Format**:
  - OpenAPI/Swagger spec (machine-readable, can generate client SDKs)
  - Or: simple markdown (faster to write)

- **Content**:
  - Each endpoint: method, path, auth, request body, response body, error codes
  - Examples: curl commands, response JSON
  - Rate limits, retry logic

- **Hosting**:
  - Swagger UI (auto-generates interactive API explorer)
  - Or: GitHub README

- **Testing**:
  - Provide Postman collection (pre-built requests for each endpoint)
  - Or: curl examples

---

## P2: Nice-to-have (Phase 2)

### P2 — Analytics & Reporting (2 items)

Once you're stable, understand your users.

**P2.1**: Grill advanced analytics  

- **Consultation volume**: trends over time (graph: consultations per week)
- **Client satisfaction**: average rating over time
- **Barber performance**: ranking, trends
- **Repeat Client %**: what % of Clients return?
- **AI success rate**: what % of Personalized Consultations generate AI preview (vs. Fallback)?

**P2.2**: Grill Owner analytics dashboard  

- **Separate from Barber matrix**: high-level business dashboard
- **Metrics**: total Consultations, total feedback, avg satisfaction, # Barbers, # Shops (if multi-shop)
- **Export**: CSV download of Consultation history

---

### P2 — Customization & Branding (2 items)

Let Shops brand Pleroma as their own (future upsell).

**P2.3**: Grill branding & customization  

- **Logo**: Owner can upload Shop logo (appears in feedback email, Client consultation page)
- **Colors**: Owner can set primary color (appears in buttons, headers)
- **Custom message**: Owner can add tagline or message to consultation page
- **Feedback email template**: Owner can customize subject, body (within guardrails)

**P2.4**: Grill QR code generation & printing  

- **Owner generates QR codes**:
  - Admin Dashboard → QR codes section
  - Generate PDF with QR code (ready to print)
  - Customize size, add Shop name/logo to PDF
  - Order multiple QR codes (one per chair? one per iPad?)

---

### P2 — Integrations & Future (3 items)

Build the roadmap, don't implement yet.

**P2.5**: Grill Fresha integration (future)  

- **Current state**: Pleroma independent from Fresha
- **Future**: if terms allow, could sync bookings from Fresha
- **Challenge**: Fresha is competitor, unlikely to give API access
- **Plan**: monitor Fresha's API, revisit if opportunity arises

**P2.6**: Grill payment processing  

- **Current**: Pleroma's pricing model TBD (who pays, how much?)
- **Future**: integrate payment processing (Stripe, Square)
- **For now**: manual invoicing (Owner pays via email/bank transfer)

**P2.7**: Grill multi-language support  

- **MVP**: English only
- **Phase 2**: Spanish, French, Portuguese (if Pleroma expands to other markets)
- **Approach**: i18n library, translation keys, crowdsourced translations

---

### P2 — Compliance & Support (3 items)

Legal and customer success (can't skip, but not MVP-blocking).

**P2.8**: Grill Terms of Service & Privacy Policy  

- **Consult lawyer** (non-negotiable)
- **TOSs coverage**: data ownership, liability, dispute resolution, GDPR requirements
- **Privacy Policy**: data collection, use, retention, Client rights
- **Templates**: GDPR-compliant templates (Iubenda, Termly, etc.)

**P2.9**: Grill photo consent forms  

- **Downloadable PDF**: Barber prints, Client signs before Personalized consultation
- **Content**: "I consent to photos of my hair being used to generate a preview, which will be securely stored in my account"
- **Retention**: Owner keeps signed forms (legal protection if Client later disputes)

**P2.10**: Grill customer support workflows  

- **Support channel**: email? Slack? Ticketing system (Intercom, Zendesk)?
- **FAQ**: common questions (how to reset PIN, how to add Barber, etc.)
- **Onboarding support**: dedicated person helps first few Shops launch
- **Ongoing support**: respond to issues within 24 hours

---

### P2 — Testing & Quality (2 items)

Polish before scaling.

**P2.11**: Grill load testing  

- **Scenario**: 100 Consultations submitted concurrently
- **Expectations**: all succeed, no errors, latency <1s
- **Tool**: k6, Locust, or Apache JMeter

**P2.12**: Grill security audit  

- **Third-party pentest**: hire security firm to audit code, find vulnerabilities
- **Checklist**: OWASP Top 10, GDPR compliance, API security
- **Timeline**: before first production deployment

---

## How to Use This Checklist

### Phase 1: Grilling (Current)

1. **Start with P0 items** — one per conversation turn
2. **Mark as in_progress** when you start grilling
3. **Update CONTEXT.md & ADRs** as you learn new domain knowledge
4. **Resolve ambiguities** with specific questions (not vague "seems okay")
5. **Move to next item** when current one is grilled

**Output from each grilled item**:
- Domain terminology updated in CONTEXT.md
- Decision documented (new ADR, or updated existing ADR)
- Specific design choice captured (e.g., "Admin Dashboard matrix view, not leaderboard")

### Phase 2: Design (After P0 complete)

1. **Sketch UI/UX flows** for each P0 user journey (Client, Barber, Owner)
2. **Design database schema** based on P0 data model grilling
3. **Draft API specs** for P0 endpoints
4. **Update this checklist** with design decisions

### Phase 3: Implementation (After P1 decided)

1. **Start with P0 features** (core data model, critical flows)
2. **Add P1 features** in parallel (security, resilience, error handling)
3. **Defer P2** until after MVP launch

### Phase 4: Launch & Beyond

1. **Mark P0 & P1 items complete** as you ship
2. **Monitor production** (use P1.30 monitoring setup)
3. **Plan Phase 2** (P2 items + customer feedback)

---

## Critical Unknowns to Address First

Before implementation, resolve these high-risk areas:

### 1. **AI Processing Latency** (P0.24)

**Why critical**: If Higgsfield/Banana take >2 min, your "parallel processing" flow breaks. Client in chair gets frustrated.

**Action**: Test with real service now
- Set up sandbox account with Higgsfield or Banana
- Upload sample photos, measure end-to-end latency (photo upload + processing + download)
- Test with different photo qualities (good lighting, bad lighting, blurry, different angles)
- **Decision deadline**: before you start implementation

### 2. **Payment & Pricing Model** (P1.40)

**Why critical**: Affects every Shop interaction (how many Barbers can they add?) and your revenue model.

**Options**:
- Per-Barber/month (e.g., $50/Barber/month) — easy to enforce, scales with Shop size
- Per-Consultation fee (e.g., $0.50 per Consultation) — aligns with usage, but hard to predict revenue
- Freemium (first 2 Barbers free, then $50/Barber/month) — lowers barrier to entry

**Action**: Decide within 2 weeks, affects schema design (need to track # active Barbers)

### 3. **Email Service & Cost** (P1.1, P1.2)

**Why critical**: Feedback emails are your only notification channel. Must be reliable and affordable.

**Action**: Pick provider (SendGrid, Mailgun, AWS SES), set up test, verify cost at scale

### 4. **Photo Storage & Costs** (P1.25)

**Why critical**: If you're storing millions of photos/clones, storage costs compound quickly.

**Action**: Calculate projected costs for 1000 Shops × 100 Consultations/day over 1 year

### 5. **Barber PIN Reset Delivery** (P1.4)

**Why critical**: First Barber onboarding blocker. If you can't securely deliver PINs, Barbers can't access Staff View.

**Options**:
- Email (requires Barber email)
- In-person (Owner tells them)
- SMS (requires Barber phone, costs $)
- QR code (Owner generates, Barber scans)

**Action**: Decide + implement by MVP launch

---

## Checklist Completion Tracking

Use this section to track progress:

```
P0: 6/27 grilled  — P0.1 (data model), P0.2 (consultation schema), P0.3 (feedback schema), P0.4 (delivery report), P0.5 (client PIN), P0.27 (PIN reset)
P1: 0/40 grilled
P2: 0/14 grilled (deferred)

Critical Unknowns Resolved: 0/5
```

Update as you grill each item.
