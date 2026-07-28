# Personalized Consultation with biometric AI clone rendering — not generic models only

Pleroma offers two consultation paths: Quick Pick (fast, generic mannequin) and Personalized (Client-specific AI clone). We considered (a) generic models only (simpler, no data privacy concerns), (b) optional biometric capture for photo output only (easy to build), and (c) biometric capture with AI clone rendering as the core feature.

We chose option (c): capture biometric data and render a Client-specific AI clone overlaid with their selected style.

**Trade-offs:**

**Why biometric AI:**
- **Accuracy**: A style rendered on a Client's actual hair type, hairline, face shape, and growth patterns is dramatically more useful than a generic mannequin. Clients see what they'll actually look like; Barbers gain confidence in execution.
- **Repeat Client value**: The AI clone becomes part of the Client's profile. On return visits, they can review/modify their prior consultation against their own clone, not starting from scratch. This incentivizes returning and deepens engagement.
- **Business owner value**: Accumulated clone data over time shows the Owner what looks each Client requests and how well each Barber delivers them, enabling performance measurement and training.

**Why not generic only:**
Generic models are easier to build and have zero privacy risk, but they don't solve the core problem: Clients can't see what a style will actually look like on them, and Barbers have to guess. This leads to mismatched expectations and poor business outcomes.

**Privacy & consent:**
- Biometric data (photos) is collected only with explicit Client opt-in and clear privacy notice.
- Original photos are deleted immediately after AI clone is generated.
- AI clones are retained in the Client's profile for future consultations.
- Clients can delete their entire profile (including clones) anytime.
- Clones are stored at rest in the Shop's database, never sent to third-party AI services.

**Processing timing (critical constraint):**
Clients are in the chair during Personalized Consultation. The UX must feel seamless:
- Client uploads photo (multiple angles, optionally face).
- AI clone generation starts in the background.
- Client answers preference questions (texture, fade, style details) in parallel.
- By the time questions are done (1-2 min), the clone is generated AND the selected style is overlaid onto it.
- Client sees the preview before paying/leaving.

This requires careful orchestration: photo upload speed, AI processing latency (via external services like Higgsfield, Banana), and question-answering pacing must align so neither blocks the other.

**AI model evolution:**
When Pleroma improves its clone generation algorithm, existing Clients are emailed asking if they'd like their clone re-rendered. If they consent, their clone is re-generated; otherwise it persists as-is.

**Implementation risk:**
If AI processing fails (network timeout, service down, photo too blurry), the Barber receives a text-only Fallback Card with all Client preferences but no preview. The Barber still executes the haircut and completes their delivery report. Pleroma logs the failure to diagnose and prevent future errors.
