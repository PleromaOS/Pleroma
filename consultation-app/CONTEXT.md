# Pleroma Consultation Flow

Client-facing web app for a barbershop haircut consultation: a client works through a guided flow on their own phone, and the resulting spec is handed off to their barber.

## Core principle

Every feature in Pleroma should be **intuitive enough that anyone can use it without explanation**. Owner onboarding, Client consultation, Barber workflow, and Admin Dashboard should all be self-documenting. This applies whether Pleroma is set up with in-person help or completely virtually.

## Consultation paths

**Quick Pick**:
Fast, preset-driven consultation. Client browses and taps through predefined style options. Result shown on a generic AI mannequin. Takes ~30-60 seconds. No photo capture required.

**Personalized Consultation**:
Client takes multi-angle photos (hair detail, angles, face if consented). Meanwhile, Client answers preference questions. AI processes in parallel: generates a client-specific AI clone of their head/hair, then applies their selected style to that clone. By the time questions are answered, Client sees the result on their own clone. Requires explicit opt-in for biometric processing. Original photos deleted immediately after clone generation; clone retained in their profile for future visits and can be deleted anytime.

_Critical constraint_: Client is in the chair during this flow. Photo upload + AI processing must complete while preference questions are being answered; total time in chair should feel seamless.

## Language

**Shop**:
A single barbershop business using Pleroma. Owns its own Barbers, Consultations, PIN, and (later) branding/config. Pleroma is built to serve many Shops, not just one.
_Avoid_: Tenant, account, business (when referring to this specifically)

**Barber**:
A named staff member at the shop who cuts hair. The client selects their Barber by name at the start of the flow so results are routed to the right person.
_Avoid_: Staff member, stylist, station, chair

**Client**:
The person going through the consultation flow on their own phone. Identified by email and first name within a Shop (unique per Shop, not globally). On first visit, Client enters first name, email, and optionally sets a PIN (collected screen-by-screen). On return visits, email is used to look up prior Consultations and feedback. No permanent account created — email is just the identifier. Clients are scoped to a Shop.
_Avoid_: User, customer, account

**Return Client**:
A Client who has previously submitted a Consultation at the same Shop. On return visits, they enter their email to look up prior Consultations, view feedback they submitted, and modify preferences for a new Consultation. No PIN or password required — email is the sole identifier.

**Barber PIN**:
A unique 4-digit PIN code per Barber (not shared across the Shop). Used to authenticate to the Staff View and resume the consultation queue if the page is closed. Also used to track individual Barber performance metrics (accuracy per style) and prevent abuse in the pricing model (charge per Barber). Each Barber's PIN is private to them and known only to them and the Shop Owner. When a Barber forgets their PIN or loses their device, they request a new one via email link, which lets them create a new PIN they'll remember (e.g., birthday, anniversary). Weak patterns (sequential 1234, repetitive 1111) are blocked. Old PIN is invalidated immediately when a new one is set.


**Staff View**:
The live, per-Barber queue of incoming Consultations, kept open on a Barber's own phone (or tablet). Real-time and operational — shows what's happening right now, not history. Barbers authenticate with a unique PIN code (not shared; each Barber has their own). If a Barber closes the Staff View, they can return and resume exactly where they left off. When a Barber marks a Consultation done, they must answer three quick tap-only questions (any issues? did you deliver as requested? communication clarity?) before seeing the next Client. This ensures every Consultation gets a **Delivery Report** without adding friction to the workflow.

If AI processing fails to generate a Client preview, the Barber receives a **Fallback Card**: a text-only record of all Client preferences (texture, style, specifics, notes) without a picture. The Barber still executes the haircut and completes their delivery report. Pleroma logs the failure in the backend to diagnose and prevent future errors.

_Avoid_: Admin view, dashboard (when referring to this specifically)

**Admin Dashboard**:
The owner-facing view of Barber performance and Consultation data. Shows, per Barber: accuracy of style execution (which styles does each Barber nail 100%, and which do they struggle with?), Client satisfaction ratings, feedback patterns, and volume trends. The Owner uses this to identify top performers, spot training opportunities, and understand which Barbers reliably deliver Client expectations. Historical/analytical, not real-time operations. Can be accessed on mobile or tablet.
_Avoid_: Staff view, admin view (ambiguous — be specific about which)

**Shop Owner**:
The business operator who has admin access to the Dashboard. Can have multiple Owners per Shop with configurable permission levels. Can add/remove/edit Barbers and their profiles.

**Quick Pick data**:
For the Quick Pick consultation path, captured data includes: haircut choice, hair texture, skin tone, and specific style details. This data is saved for Return Clients, who can change some or all details on their next visit. On return, Client enters email and their Client PIN (optional) to access and modify their Quick Pick profile.

## Purpose

Pleroma centralizes **Client expectations** so the business owner is not dependent on individual Barbers' memory. When a Barber leaves, the Owner retains a complete record of what each Client wanted and how well each Barber delivered. This lets the Owner assign returning Clients confidently to a new Barber without losing context.

## Relationships

- A **Shop** has many **Barbers** (primary key: barber_id per Shop).
- A **Client** exists per **Shop** and is uniquely identified by email within that Shop (email is not globally unique; same email can exist at different Shops as separate Client records). A **Client** can have **Consultations** with multiple **Barbers** at the same **Shop**.
- A **Consultation** is owned by **Shop** (Consultation.shop_id) and routed to a **Barber** (Consultation.barber_id). Consultations are immutable after submission; if a Client wants to change something, they submit a new Consultation.
- A **Return Client** queries by email to retrieve their prior **Consultations** (across all Barbers at that Shop). When returning, they can view all prior history, see feedback they gave, and start fresh (their choice). If switching Barbers, they can see what their prior Barber delivered and use that as context.
- **Feedback** links to both **Consultation** (Feedback.consultation_id) and **Barber** (Feedback.barber_id, denormalized). This enables fast Admin Dashboard queries: "What was Barber Marcus's accuracy for Fades?"
- When a **Barber** leaves/is deleted, their record is soft-deleted (marked inactive). Their historical **Consultations**, **Delivery Reports**, and **Feedback** remain in the database for Owner analysis.
- The **Admin Dashboard** aggregates across all of one **Shop's** **Barbers'** **Consultations** — it is not filtered to one Barber, but it never crosses **Shops**. The Owner uses this to (a) see what each Client expects, (b) measure how well each Barber delivers those expectations by style, and (c) understand which Barbers are reliably meeting Client goals.

## Example dialogue

> **Dev:** "Does the Client pick a Barber by scanning a chair-specific QR code, or by choosing a name?"
> **Domain expert:** "By choosing a name — one shared link for the whole shop. First screen is 'Who's cutting your hair today?'"
>
> **Dev:** "Is 'admin visibility' the same screen the Barbers use?"
> **Domain expert:** "No — Barbers get a live per-Barber Staff View. I get a separate Admin Dashboard with aggregate stats, not a live feed."

## Consultation Schema

**Table: consultations**

| Field | Type | Required? | Notes |
|-------|------|-----------|-------|
| consultation_id | UUID | Yes | Primary key |
| shop_id | UUID | Yes | Foreign key to shops |
| barber_id | UUID | Yes | Foreign key to barbers (soft-delete safe: can be NULL if Barber deleted) |
| client_id | UUID | Yes | Foreign key to clients |
| consultation_type | ENUM | Yes | `quick_pick` \| `personalized` |
| style | VARCHAR(50) | Yes (for Personalized), Optional (Quick Pick) | E.g., "Fade", "Undercut", "Pompadour" |
| texture | ENUM | Yes (for Personalized), Optional (Quick Pick) | `straight` \| `wavy` \| `curly` \| `coily` |
| skin_tone | ENUM | Yes (for Personalized), Optional (Quick Pick) | `light` \| `medium` \| `dark` |
| specifics | TEXT | No | Free-text preferences, max 500 chars (e.g., "tight fade on sides, leave 1 inch on top") |
| photo_ids | ARRAY[VARCHAR] | No | Only for Personalized. Array of uploaded photo identifiers. Empty if AI processing failed and Fallback used. |
| ai_clone_id | VARCHAR | No | Only for Personalized. Reference to generated AI clone (or NULL if failed). |
| ai_processing_status | ENUM | No | Only for Personalized. `pending` \| `success` \| `failed`. NULL for Quick Pick. |
| fallback_card_created | BOOLEAN | No | True if AI processing failed and Fallback Card was generated instead. |
| status | ENUM | Yes | `submitted` \| `in_progress` \| `completed` \| `feedback_received` |
| created_at | TIMESTAMP | Yes | When Client submitted |
| completed_at | TIMESTAMP | No | When Barber marked done (status → completed) |
| feedback_received_at | TIMESTAMP | No | When Client submitted feedback (status → feedback_received) |

**Validation Rules**:
- **Quick Pick**: Client must select barber_id. style, texture, skin_tone, specifics are optional, but UX encourages completion (fast flow, so people willing to answer).
- **Personalized**: All fields (style, texture, skin_tone) required. Photos required (or Fallback Card generated). Specifics optional.
- Status transitions: submitted → in_progress (when Barber sees it) → completed (when Barber submits Delivery Report) → feedback_received (when Client submits feedback).

## Delivery Report Schema

Submitted by the Barber immediately after marking a Consultation done. Mandatory — the Staff View does not advance to the next Consultation until all three questions are answered. Immutable after submission. Owner-visible only; Client never sees a Barber's self-assessment.

**Table: delivery_reports**

| Field | Type | Required? | Notes |
|-------|------|-----------|-------|
| delivery_report_id | UUID | Yes | Primary key |
| consultation_id | UUID | Yes | FK to consultations (1:1 — one Delivery Report per Consultation) |
| barber_id | UUID | Yes | Denormalized from Consultation for fast per-Barber Admin Dashboard queries |
| shop_id | UUID | Yes | Denormalized for multi-tenant isolation and per-Shop aggregations |
| style | VARCHAR(50) | Yes | Denormalized from Consultation — enables per-Style breakdown without a join |
| issues_flag | BOOLEAN | Yes | Any issues with this Consultation? (Yes / No) |
| delivery_match | ENUM | Yes | `yes` \| `no` \| `partial` — Did Barber deliver what the Client asked for? |
| communication_clarity | ENUM | Yes | `yes` \| `no` \| `partial` — Were the Client's preferences clear and actionable? |
| submitted_at | TIMESTAMP | Yes | When Barber submitted; triggers Consultation status → `completed` |

**Design notes:**
- `barber_id`, `shop_id`, and `style` are denormalized (same pattern as Feedback.barber_id). The Admin Dashboard can compute per-Barber and per-Style accuracy breakdowns with a single-table scan — no Consultation join required for aggregate views.
- Consultation status transitions to `completed` when Delivery Report is submitted.

## Feedback Mechanism

**Flow**:
1. **Client submits Consultation** → shown message: "Your Barber [Name] received your details. Come back after your haircut to compare and let us know how it went!"
2. **Barber marks Consultation done** → submits Delivery Report, Consultation status → completed
3. **Client gives feedback** (at home or anytime via email link) → sees "How did your haircut go?" screen → can rate & add notes. Email reminder sent 1 day after appointment if no feedback submitted yet.
4. **Next visit** → Client sees message: "We noted your feedback from last time: [summary]. Same style, or try something new?"

**Feedback Fields**:
- **Accuracy rating**: "How accurately did your Barber match the preview/preferences?" (Yes / No / Partial)
- **Satisfaction rating**: "How satisfied are you with the result?" (1-5 stars or Satisfied / Neutral / Unsatisfied)
- **Notes** (optional): "Any feedback for next time?" (free text, max 200 chars)

**Privacy**: Feedback is private from Barber (they don't see Client feedback until much later in aggregate analytics, if at all). This encourages honest feedback.

**Owner Analytics**: Admin Dashboard shows aggregate Feedback per Barber per Style to measure accuracy and identify training needs. When Client feedback and Barber Delivery Report disagree on whether the cut matched expectations, that consultation is flagged. Dashboard displays flagged disagreements alongside accuracy % (e.g., "95% (2 flagged)") so Owner can drill down and understand where alignment breaks down — signals for training or 1:1 conversations.

## Independence from Fresha

Pleroma is completely independent from Fresha (the booking system many shops use). Fresha controls their own booking database, client data, and contact info. Pleroma does not sync with Fresha or share data. The only connection point is the QR code in the barbershop: Clients scan it to enter Pleroma when they're ready for a consultation. Pleroma must work smoothly without any friction from the Fresha integration (or lack thereof). This allows Pleroma to remain a standalone system shops can adopt without replacing their existing booking software.

## AI model improvement

When Pleroma improves its AI clone generation algorithm, existing Clients are sent an email asking if they'd like their stored clone re-rendered with the improved algorithm. If they consent, their clone is re-generated; if not, their old clone persists.

## Offline resilience

Client Consultations auto-save in real-time as the Client fills out answers. If a Client loses connectivity mid-consultation, their answers are persisted. When connectivity returns, they resume exactly where they left off. If connectivity cannot be restored, the Barber can finish the Consultation using the text-only Fallback Card and the Client's saved answers.

## Multi-owner access control

A Shop can have multiple Owners. The primary Owner can grant/restrict access to secondary Owners (e.g., limited to view-only, or edit Barbers only). This lets larger shops distribute admin responsibilities without sharing a single login.

## Flagged ambiguities & decisions

- "admin visibility" initially conflated the Barber's real-time **Staff View** with the owner's historical **Admin Dashboard** — resolved: these are two separate pages serving two different audiences.
- Feedback collection channel: email first, with fallback to return-visit collection (not SMS, to avoid per-message costs and privacy concerns).
- Return Client identification: resolved with exact email lookup + optional Client PIN for extra security. Email is the sole Client identifier — no phone number collected. Fuzzy phone-number matching was considered and dropped. Client PIN is bcrypt-hashed in the database; forgotten PINs are recovered via email reset link (no Owner intervention).
- Admin Dashboard workflow: resolved with matrix view (Barbers vs. Styles, with accuracy % per cell). Allows Owner to spot which Barbers excel at which styles and where to focus training.
- **ADR #0002 revision needed**: Original ADR #0002 describes a shared PIN protecting the Staff View (all Barbers see all queues). This is now superseded by per-Barber PINs, which isolates each Barber's queue and enables individual performance tracking and pricing model enforcement.
