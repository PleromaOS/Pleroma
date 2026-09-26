# 11. Data model shape

Date: 2026-09-26

## Status

Accepted

## Context

The live schema held four tables — `consultations`, `renders`, `feedback`,
`style_references` — all at zero rows. It had no shop, no client, no staff, no
visit, and no email anywhere, while `CONTEXT.md` states that email is the
client's permanent identifier and ADR 0003 states multi-tenant from day one.
The code contradicted a decision already made.

Everything commercial resolved in the September grilling — consultation
capacity per shop, the shop funding the refund, the per-shop booking deep link,
the per-shop QR — requires a tenant that did not exist.

## Decision

**Tenancy.** A `shops` table. Every client, consultation, brief, visit, render
and staff row carries `shop_id`, enforced by row-level security. A client
belongs to exactly one shop; the same person at two shops is two rows. This
matches the product's own positioning — the data belongs to that business — and
keeps a deletion request inside one tenant.

**Consultation and brief are separate.** `consultations` is the event: shop,
client, entry type, status, abandoned or completed. `briefs` is the output
spec. An abandoned consultation produces no brief. This also places the two
meters where they belong — consultations measure advertising volume, briefs
measure appointment volume.

**Briefs are immutable and versioned.** Each brief freezes both layers as they
stood that visit. A separate `client_preferences` row holds the mutable current
state that pre-fills the next one. A stylist's amendment writes a new version
with a parent link and a reason; the original is retained. The guaranteed brief
is whichever version both parties countersigned.

**Visits.** One `visits` table with status `booked → arrived → completed →
no_show`. The brief link is nullable, because a campaign brief exists before
any booking does, and walk-ins start at `arrived`.

**Staff are users with a role**, soft-deleted as former with a leaving date.
Past visits stay credited to whoever performed them and are never reassigned.

**Two clocks.** Offer validity is 14 days from the consultation. The claim
window is in the chair, before leaving. Neither moves the other.

**Retention.** Facial data is kept while the relationship is live, removed by a
dormancy sweep after a defined period of no contact, and deletable by the
client at any time.

## Consequences

A refund is always measured against a row that still says what it said on the
day it was countersigned. Normalising preferences and joining them at read time
would have silently rewritten history and destroyed that record.

Immutability costs duplication: standing preferences are copied into every
brief. That is the price of an honest audit trail and it is worth paying.

**Staff as users reverses ADR 0002 and ADR 0007**, which chose a shared PIN and
email self-reset specifically to keep authentication out of the MVP. Logins,
invitations and password resets now arrive earlier than those decisions
assumed.

`renders.expires_at` currently defaults to 24 hours, which kills the render
exactly when the unbooked follow-up needs it. The dormancy model replaces that
default.

`renders.model` still defaults to `seedream_v5_pro`, a model `CONTEXT.md`
rejected for failing to hold curl. It should be `gemini-3-pro-image`.

The `feedback` table holds a single 0–100 rating with no author, which cannot
express brief match as resolved: 60% client post-visit note, 40% stylist
self-assessment. It needs replacing, not extending.
