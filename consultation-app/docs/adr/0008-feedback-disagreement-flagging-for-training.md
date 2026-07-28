# Flag and surface Client/Barber feedback disagreements for Owner visibility

When a Client submits feedback on a haircut, they rate whether the Barber delivered what they asked for (accuracy). Simultaneously, the Barber submits a Delivery Report rating their own execution. These two signals sometimes disagree. We considered (a) averaging them for an overall accuracy score, (b) trusting only Client feedback, or (c) flagging disagreements and surfacing them to the Owner for investigation.

We chose option (c): flag disagreements and make them visible in the Admin Dashboard.

**Trade-offs:**

**Why flag disagreements:**
- **Training signal**: Disagreements reveal where Barbers and Clients are misaligned. A Barber who consistently says "I nailed it" but Clients say "partial" or "no" signals overconfidence or communication breakdown — a training opportunity.
- **Quality control**: Owner gets visibility into where expectations diverge. Is the Barber underselling their work? Overselling? Is the Client being unrealistic?
- **Accountability**: Forces Owner to investigate, not ignore. A simple accuracy % can hide these patterns.
- **Ownership improvement**: Disagreements often point to fixable issues (Barber didn't ask clarifying questions, Client expectations weren't managed, etc.).

**Why not just average:**
Averaging (Yes + Partial = 75%) obscures the real issue. A Barber with five "partial" ratings average to 60%, same as one with one "no" and one "yes" — but the patterns are different and require different interventions.

**Why not trust only Client:**
Clients are the ultimate judge, but Barbers' self-assessment also matters. A Barber who says "I delivered perfectly" but Client says "partial" is different from a Barber who says "partial" and Client says "no." The former is overconfidence; the latter is honest self-assessment matching Client doubt.

**Implementation:**

- **Disagreement definition**: Consultation is flagged if Barber's `delivery_match` does not exactly match Client's `accuracy_rating` (both use Yes/No/Partial scale).
- **Dashboard display**: Admin Dashboard matrix cells show accuracy % alongside flagged count. Example: "95% (2 flagged)" = 95% of Consultations match between Client and Barber; 2 have disagreements.
- **Drill-down**: Owner can click a cell to see underlying Consultations, including flagged ones with both Client and Barber feedback side-by-side.
- **Severity**: No severity weighting for now (Barber "yes" vs Client "no" is same weight as Barber "partial" vs Client "yes"). Owner interprets the pattern.

**Future opportunity:**
Over time, if Owner sees patterns (e.g., Barber Marcus always undersells, or Style "Undercut" consistently disagrees), that data informs targeted training or process changes.
