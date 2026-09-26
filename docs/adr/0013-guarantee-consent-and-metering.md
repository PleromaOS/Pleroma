# 13. Guarantee records, consent, metering and render derivatives

Date: 2026-09-26

## Status

Accepted

## Context

ADR 0011 made briefs immutable and versioned. That created a problem it did not
solve: the guarantee chain is a sequence of confirmations that happen *after* a
brief exists — the client confirms the render, the stylist runs the feasibility
check and countersigns, a claim may follow — and none of them can be stamped
onto a row that never changes.

Three further gaps had no home at all: consent for facial data across several
distinct purposes, the shop's consultation allowance, and the fact that the
`feedback` table cannot express brief match as resolved.

## Decision

**A `guarantees` table records state about an immutable brief.** One row per
guaranteed brief, carrying the brief version, the feasibility gate result,
the client's confirmation, the stylist's confirmation and who they were, the
14-day validity, and status. The brief stays frozen; the guarantee is the
mutable record *about* it. Claims reference the guarantee, not the brief.

**A `consents` table, one row per purpose.** Client, purpose, granted at,
withdrawn at, and which version of the wording was agreed. The three purposes
are distinct and may not be bundled: the selfie used to produce a render, the
after photo used as a claim record, and the shop reusing a client's render in
its own marketing. Blanket consent covering unrelated purposes is precisely
what Article 9 treats as invalid.

The third purpose is not hypothetical. Shops will want to repost these renders
on their own social accounts, and without a separate consent the product hands
every customer a way to breach GDPR.

**Metering.** A consultation is consumed at the **first successful render** —
the moment a cost is actually incurred. Abandoned consultations and failed
renders cost the shop nothing. Re-renders inside the same consultation are
free and capped at three, and that cap is what bounds cost per metered unit;
it is margin control, not a UX preference. The allowance resets on the
**calendar month**.

**Two render derivatives from one master.** The **working render** is clean and
is what the stylist uses, because the image is the work instruction (ADR 0012)
and an overlay degrades it. The **shareable render** is generated at delivery
and carries a PleromaOS and shop lockup in a bottom strip, never across the
face. Only the working render is stored.

**Brief match is computed from two authored assessments.** One row per
assessment, each with an author — client or stylist. The score is 60% client,
40% stylist, stored on the visit, and flagged when the two disagree beyond
threshold per ADR 0008. This replaces the `feedback` table rather than
extending it.

## Consequences

Immutability survives. Nothing ever updates a brief; confirmations accumulate
beside it.

The watermark does double duty deliberately: it marks provenance on a leaked
image and it advertises both PleromaOS and the shop when a client shares their
result. It must stay small enough that people still share it — a heavy overlay
produces no marketing at all, because nobody posts a picture with their face
obscured.

Metering at first render means the shop's usage figure and PleromaOS's API bill
move together, which makes a usage dispute answerable from one number.

Calendar-month reset concentrates both API spend and capacity-blocked support
into the first days of each month. Accepted for being easier for an owner to
reason about.

The `feedback` table is superseded and should be dropped rather than migrated;
it holds no rows.
