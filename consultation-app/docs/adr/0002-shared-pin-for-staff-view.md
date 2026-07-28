# Per-Barber PIN for Staff View — not shared PIN or full accounts

The Staff View exposes Client hair preferences, so it can't be a fully open unlisted link. We considered (a) a single shared PIN (everyone with it sees all Barbers' queues), (b) full per-Barber accounts (login, session mgmt, password recovery — expensive to build), and (c) per-Barber PINs (each Barber has a unique PIN, remembered locally on their device).

We chose per-Barber PINs. Trade-offs:

**Why per-Barber, not shared:**
- **Privacy**: Each Barber sees only their own Clients' preferences, not colleagues' work.
- **Performance tracking**: PINs tie to individual Barber profiles, enabling accurate measurement of each Barber's execution accuracy per style. Shared PIN would prevent this.
- **Pricing model enforcement**: Pleroma charges per Barber. A shared PIN would let multiple Barbers bypass this using one PIN; per-Barber PINs prevent abuse.
- **Session resumption**: Each Barber can close and reopen their Staff View, and resume exactly where they left off, without affecting others.

**Why not full accounts:**
Too much complexity for the mobile/frictionless UX we're targeting. PIN is good enough — it's remembered locally on the device, so Barbers don't type it every session.

**Limitation:** If a Barber forgets their PIN or loses their device, they need the Shop Owner to reset/issue a new one. This is acceptable friction for a small-team tool.
