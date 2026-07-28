# Pleroma remains independent from Fresha — no data sync, no account coupling

Pleroma is sold to barbershops, many of whom already use Fresha (a booking/scheduling platform owned by competitor). We considered (a) integrating with Fresha's API to sync bookings and Client data, (b) requiring shops to use Pleroma alongside Fresha without integration, and (c) building Pleroma as a completely standalone system with only a QR code touchpoint.

We chose option (c): complete independence. No API integration, no data sync, no account coupling.

**Trade-offs:**

**Why independence:**
- **Fresha is a competitor**: They control booking data, Client contact info, payment processing. Syncing our consultation data with them would make us dependent on a competitor's API and terms.
- **Data lock-in risk**: If Fresha changes their API, pricing, or terms, it could break Pleroma for our Shops. Independence insulates us.
- **No friction to adoption**: Shops don't need to migrate from Fresha or change their booking workflow. Pleroma works alongside their existing tool. They just add a QR code in the shop; Clients scan it when they're ready for a consultation.
- **Our data stays ours**: Client consultations, preferences, feedback, and Barber performance data belong to the Shop and Pleroma, not Fresha.

**How it works operationally:**
- Fresha manages bookings (appointments, payment, scheduling).
- When a Client arrives for their appointment, they scan Pleroma's QR code (displayed on a poster or tablet in the shop).
- Pleroma's consultation flow is independent: Client picks Barber, enters phone, does consultation.
- Consultation data flows to that Barber's Staff View; feedback later ties back to the Barber and Admin Dashboard.
- No data leaves Pleroma for Fresha; no data comes from Fresha into Pleroma.

**The constraint this creates:**
Fresha controls when each Client is booked, but Pleroma doesn't know about Fresha bookings. So we can't (yet) send Clients a pre-appointment reminder with a Pleroma link, or auto-trigger the consultation link at booking time. Instead, the touchpoint is in-shop: Clients scan the QR code when they arrive or when the Barber is ready for them. This is acceptable because:
- It's frictionless (one QR scan).
- It ensures Clients and Barbers are both ready.
- It keeps operations simple for shops without requiring Fresha integration.

**Future flexibility:**
This decision doesn't prevent future integrations. If Fresha's terms change or if we partner with other booking systems (Square, Acuity, etc.), we can add integrations later without breaking existing Shops. Independence first keeps us agile.

**Risk:**
Shops may ask "Why can't we sync with our Fresha data?" or "Why do Clients need to enter their phone again if Fresha already has it?" The answer is: Fresha's data stays with Fresha for privacy and independence reasons. We capture only what we need (name, phone) to build our own Client record in Pleroma. This slight duplication is the cost of independence.
