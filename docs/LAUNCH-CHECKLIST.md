# Before the first shop goes live

Everything here must be done before a real shop is onboarded and real clients
use the app. None of it blocks building and testing in the "Pleroma test" shop.

Tick an item only when it is done and tested, and add the date.

## Must have

- [ ] **Email.** Connect an email provider with EU data hosting and set up the
      sending domain properly (SPF, DKIM, DMARC) so mail does not land in spam.
      Emails needed:
  - [ ] the render, brief and pass code, sent right after the client confirms
  - [ ] the unbooked-render follow-up after 24 hours
  - [ ] a link for the client to withdraw consent and delete their data
- [ ] **Staff logins and access rules.** Stylists and owners sign in; row-level
      security rules so a shop sees only its own clients. Needed for the chair
      (feasibility check, countersign, claims) and the dashboard.
- [ ] **Paid Supabase plan with daily backups.** The free plan keeps no backups.
      On 2026-09-26 two old tables were deleted and could not be recovered. That
      must never be possible with real client data.
- [ ] **Deleting a client.** Decide what survives a GDPR deletion request: the
      guarantee and refund record must stay defensible, but the personal details
      must go. Right now the database refuses to delete a client who has a
      brief, visit or consent.
- [ ] **Facial data clean-up.** The dormancy sweep that deletes selfies and
      renders after a period of no contact. Also decide the period.
- [ ] **Legal review** of the advertisement wording, the booking terms and the
      guarantee terms (EU and Dutch rules on misleading commercial practices).
- [ ] **Privacy notice and a data processing agreement** with each shop; check
      Google's terms for sending client photos to Gemini.
- [ ] **Remove the development functions** `gemini-test`, `dev-seed` and `tryon`.
      They are open to the public.
- [ ] **Host the client app** (`pleroma-app/`) on a web address with https,
      one link per shop (`/<shop-slug>` for adverts, `/<shop-slug>/in-shop`
      for the QR code). A phone camera only works on https.
- [ ] **Retire the old quiz app** in `consultation-app/app/`. It saves to table
      shapes that no longer exist.

## Should have

- [ ] **Reference photos** for every style and texture pair that has none. Without
      a checked photo that pair can never show the guarantee badge. Curly is the
      biggest gap; coily is missing on some styles too. Run the coverage query
      in `docs/` (or ask Claude) for the current list.
- [ ] **The shareable render** (ADR 0013): the watermarked copy with the Pleroma
      and shop lockup, made when the client takes the image away.
- [ ] **A human check on the landing page** (for example Cloudflare Turnstile) if
      bots get past the rate limits.
- [ ] **Pass codes are 4 digits per shop** (W24 design). Fine until a shop has
      thousands of open passes; then clear expired passes or move to 5 digits.
- [ ] Fix the two old database functions Supabase warns about
      (`touch_renders_updated_at`, `pick_style_reference`: search path not fixed).

## Already done

- [x] 2026-09-26 Data model: 11 tables with shop separation, frozen briefs,
      guarantees, consents
- [x] 2026-09-26 Client-facing doors 1–8, tested end to end with a real render
- [x] 2026-09-26 Renderer locked to doors only; rendered faces on private links
- [x] 2026-09-26 Feasibility gate: texture coverage, length gap, effort mismatch
- [x] 2026-09-26 Spam protection: rate limits per connection, hourly clean-up of
      empty consultations
- [x] 2026-09-26 Client app (React) campaign flow, all screens wired to the doors,
      clicked through end to end in demo mode
