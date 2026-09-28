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
- [ ] **Remove the development functions** `gemini-test`, `dev-seed`, `tryon`
      and `edit-lab` (a test-only tool, 28 Sep). They are not part of the app.
- [ ] **Host the client app** (`pleroma-app/`) on a web address with https,
      one link per shop (`/<shop-slug>` for adverts, `/<shop-slug>/in-shop`
      for the QR code). A phone camera only works on https.
- [ ] **Retire the old quiz app** in `consultation-app/app/`. It saves to table
      shapes that no longer exist.
- [ ] **Guaranteed AI capacity (decided by Bryan, 28 Sep).** Today the pictures
      go through Google's public door to its image AI, which everyone shares:
      on 28 Sep it answered "busy" for minutes at a time, and the goatee test
      could not run at all. Before shops are onboarded:
  - [ ] move the image AI and the checker to the same Google models through
        Google Cloud (Vertex AI), which has its own capacity, in an EU region
  - [ ] reserve capacity there ("provisioned throughput", a monthly fee), sized
        to the number of shops, so a client is never put in a queue
  - [ ] keep the public door as the automatic second route if Cloud is busy
  Not chosen: a backup image AI from another company (drawings differ, and
  each would need its own truth-check testing on real faces).

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

- [ ] **Automatic screen brightness for the selfie light** needs an installed
      app (a thin native wrapper around the web app). Websites are not allowed to
      change screen brightness, so today the scan turns the screen white and asks
      the client to turn brightness up themselves.

- [ ] **Legal check on the scan-first consent timing.** The client turns on
      the photo consent switch before the camera opens, but our server records
      it a minute later, when they give their email (no photo leaves the phone
      before that). Confirm this is fine, and review the new wording (version
      selfie-2026-09-v2: three photos, used for the render AND the barber's brief).

- [ ] **How long raw scan photos are kept.** Today they stay until the client
      asks for deletion (the persistent AI clone decision in CONTEXT.md needs
      them). Decide a limit for clients who never come back, and make the
      deletion flow remove the files in storage too, not just the table rows.
      Three 25-byte fake test files from the door test sit in client-photos
      under 0ff1680d…/51e38ccb…/ (the database won't delete storage files
      directly; remove them with the Storage API or the dashboard).

- [ ] **A proper privacy and support inbox.** For now every privacy,
      deletion and support address in the app is bryan@pleromaos.nl
      (docs/specs/intro-copy.md). Before launch: a dedicated address (for
      example privacy@pleromaos.nl) that more than one person can read, with
      a written process and response time for deletion requests.
- [ ] **Confirm billing is on for the Gemini key** before the intro says
      "your photos are never used to train AI" (only true on the paid tier).

- [ ] **Measure the hair analyser's accuracy** before launch: run it on scans
      your team can judge (different hair types, lighting, beards) and compare
      with what the clients confirm (`hair_readings.confirmations`). Decide
      the confidence level below which a finding is asked (now 0.7).

## Already done

- [x] 2026-09-26 Private photo storage: door 9 (save-photos) stores the three scan
      photos per consultation after email + consent; renders draw on the stored front photo

- [x] 2026-09-26 Data model: 11 tables with shop separation, frozen briefs,
      guarantees, consents
- [x] 2026-09-26 Client-facing doors 1–8, tested end to end with a real render
- [x] 2026-09-26 Renderer locked to doors only; rendered faces on private links
- [x] 2026-09-26 Feasibility gate: texture coverage, length gap, effort mismatch
- [x] 2026-09-26 Spam protection: rate limits per connection, hourly clean-up of
      empty consultations
- [x] 2026-09-26 Client app (React) campaign flow, all screens wired to the doors,
      clicked through end to end in demo mode
