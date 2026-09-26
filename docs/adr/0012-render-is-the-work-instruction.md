# 12. The render is the work instruction

Date: 2026-09-26

## Status

Accepted

## Context

Advertising a free consultation raises an obvious leak: a client completes the
consultation at one shop's expense, then takes the result to the barber they
already use.

The first proposed mitigation was to withhold the written brief from the client
and send only the render, on the theory that a written specification — length,
technique, fade height, neckline — is what another barber can execute from.

That theory was wrong, and Bryan corrected it. A render of the client's own
face, with their own hair texture, wearing the exact cut is **more** executable
by any barber than a written spec, not less. It is categorically different from
a Pinterest reference, where you can almost never find someone with your face,
your hair and the cut you want. The barber works from the picture; the brief is
a second confirmation.

## Decision

**The render is the work instruction.** The client receives both the render and
the brief. Withholding the brief would cost the client something and protect
nothing.

**Leakage is not prevented, only made unattractive.** A screenshot cannot be
stopped, and any design that tries punishes the honest majority. The guarantee
is the entire moat: another barber can execute from that photo, but cannot
countersign it, so there is no promise and no recourse. The copy therefore
binds the guarantee to the issuing shop by name everywhere it appears.

**Leakage is measured, not assumed** — consultation-to-visit conversion per
shop is the number that says whether it is real.

## Consequences

**Render accuracy stops being a sales feature and becomes the product.** If the
stylist works from the image, a render that cannot hold a texture is not merely
unguaranteeable — it is an unusable work instruction. The library's zero curly
references, against a texture permitted on 14 of 21 styles, moves from blocking
the guarantee badge to blocking the core function.

A client who takes the render elsewhere was, in most cases, never available to
switch. Some share of any advertising budget reaches unavailable people.

Offer validity of 14 days limits how long a leaked render stays current, for an
honest reason rather than an invented one.
