# 10. Countersigned result guarantee

Date: 2026-09-18

## Status

Accepted

## Context

PleromaOS was documented purely as a retention and knowledge tool for clients a
shop already has. The acquisition model is different: shops advertise a free
consultation rather than a haircut, the software shows the client their result
and closes them, and the result carries a money-back guarantee.

That collides directly with a resolved decision. The Image Display Decision
states images are "inspiration/reference, not exact selections" and must never
be shown as "this is exactly what you'll get." A money-back guarantee makes the
render precisely that.

It also collides with the renderer's measured state as of 10 Sep 2026: reference
contamination, unresolved framing drift, and zero curly references across the
library while curly is permitted on 14 of 21 styles — curly being the texture
that text-only rendering is documented to fail on.

Guaranteeing an unverified AI output on a physical service, performed by people
PleromaOS does not employ, was not defensible.

## Decision

The guarantee is **countersigned**, never asserted by the software alone.

A brief becomes a **guaranteed brief** only after all of:

1. It passes the **feasibility gate** — an automatic check of current-to-goal
   length gap, texture coverage in the style library, and styling-effort
   mismatch. A render that fails the gate is still shown and still sells, framed
   as a longer journey, but carries no guarantee badge.
2. **Render confirmation** — the client confirms it is their face, their hair,
   and the haircut they want.
3. **Feasibility check** — the stylist reviews the render against the actual
   head, in person, amends what is not executable, explains why, and offers
   alternatives.
4. Both parties confirm the amended result.

The **shop funds the refund**, never PleromaOS. By the time a refund can
trigger, the stylist has personally confirmed the result was executable, so a
refund means the shop failed to deliver something it inspected and agreed to.

The **client decides** whether it matched, **in the chair, before leaving**. The
claim must name which line of the brief was missed rather than express general
dissatisfaction. An after photo is captured against the brief.

The advertisement promises the image. The booking terms state that where the
professional finds the result not executable, they will propose changes, and
only what both parties agree is guaranteed.

## Consequences

The render stops being an unverifiable AI promise and becomes a professionally
countersigned commitment, which is defensible in a way "the AI said so" is not.

The Image Display Decision survives intact: images remain references, and it is
the countersign, not the render, that creates the obligation.

Texture coverage becomes a launch gate with a graceful failure. Curly clients
get the full flow without a badge until references are collected, and the badge
switches on per texture with no code change.

PleromaOS carries no refund liability, but its brand is on a guarantee it does
not fund. A shop that refuses to honour a refund damages PleromaOS.

The claim window closing at the chair limits abuse and keeps the stylist present
to fix the problem, but it will feel restrictive to a client who notices later.

The after photo is Article 9 facial data and needs its own consent at capture
and its own deletion path, separate from the selfie and the clone.

A headline claim qualified by terms carries consumer-law exposure under EU and
Dutch rules on misleading commercial practices. The feasibility gate exists
partly to keep the headline claim true in fact, not only in the terms. The final
wording of the advertisement and the booking terms needs a lawyer's review.
