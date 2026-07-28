# Barber PIN reset: self-chosen via email, not owner-issued

When a Barber forgets their PIN or loses their device, they need to reset it. We considered (a) having the Shop Owner generate and communicate a new PIN manually, (b) auto-generating a random PIN and emailing it, and (c) letting the Barber create their own PIN via an email link.

We chose option (c): Barber self-resets by creating a new PIN they choose.

**Trade-offs:**

**Why self-chosen, not owner-issued:**
- **Cognitive load**: Barbers use their PIN daily. A random PIN they didn't choose is extra memory burden. A self-chosen one (birthday, anniversary, favorite number) they already know means zero friction.
- **Ownership & intentionality**: Aligns with Pleroma's core principle: "intuitive enough that anyone can use it without explanation." Self-chosen feels intentional; owner-issued feels bureaucratic.
- **No owner bottleneck**: Owner doesn't need to be involved. Barber resets independently via email link in seconds.
- **Faster adoption**: Barber clicks email link → sets PIN → done. Zero handoff delay.

**Why self-chosen, not auto-generated:**
- Auto-generated is more secure (random), but at the cost of memorability. A PIN Barber must consciously memorize is harder to retain and more likely to be written down or forgotten.
- Self-chosen trades some entropy for usability. Mitigated by blocking weak patterns (sequential 1234, repetitive 1111).

**Why not owner-issued:**
Too much friction. Barber forgets PIN → emails owner → owner generates new PIN → owner communicates it → Barber memorizes it. This creates support work, delays, and friction in a small-team tool where self-service is the goal.

**Implementation:**

- **Email link**: Barber receives link that expires after 24 hours (one-time use).
- **PIN creation form**: Link shows a form where Barber enters a new 4-digit PIN.
- **Validation**: Reject sequential (1234, 4321, 2345, etc.), repetitive (1111, 0000), and other weak patterns. Allow custom numbers they remember.
- **Invalidation**: Old PIN is immediately invalidated when new one is set. Barber is logged out of Staff View.
- **Recovery**: Barber logs back in with new PIN.

**Security note:**
Self-chosen PINs are weaker than auto-generated. Mitigated by:
1. Blocking weak patterns reduces the attack surface.
2. PINs are 4-digit (10,000 combinations), good enough for a small-team tool with physical shop proximity (not a global service).
3. If Barber loses device, they reset via email link — no one else can do it without access to their email.
