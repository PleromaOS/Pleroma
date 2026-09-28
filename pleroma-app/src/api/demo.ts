// Demo mode: every door simulated in the browser (add ?demo to the address).
//
// It follows the same rules as the real doors, so the screens can be tried
// end to end, including the refusals. It creates nothing and costs nothing.
// The "render" is a drawn placeholder, not a real image of anyone.

import { DoorError as DemoError } from "./errors";

let state: {
  email?: string; consent?: boolean; photos?: boolean; renders: number; confirmed?: boolean;
  twin?: { id: string; attempt: number; startedAt: number; verdict?: string };
} = { renders: 0 };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let renderStartedAt = 0;

const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'>
    <rect width='300' height='400' fill='#242019'/>
    <ellipse cx='150' cy='180' rx='70' ry='90' fill='#453c30'/>
    <path d='M80 150 Q150 60 220 150 L220 120 Q150 40 80 120Z' fill='#c9a96e'/>
    <text x='150' y='360' fill='#908674' font-family='Inter,sans-serif' font-size='14' text-anchor='middle'>DEMO RENDER</text>
  </svg>`);


// A drawn stand-in for the twin: a head turned the right way, never a real face.
function twinPicture(view: "front" | "left side" | "right side", attempt: number) {
  const dx = view === "front" ? 0 : view === "left side" ? -22 : 22;
  return "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'>
      <rect width='300' height='400' fill='#d8d4cc'/>
      <path d='M40 400 Q150 300 260 400Z' fill='#4a4744'/>
      <ellipse cx='${150 + dx / 3}' cy='185' rx='${view === "front" ? 66 : 58}' ry='86' fill='#8a6a52'/>
      <path d='M${88 + dx / 2} 165 Q150 70 ${212 + dx / 2} 165 L${212 + dx / 2} 135 Q150 55 ${88 + dx / 2} 135Z' fill='#1f1a17'/>
      <circle cx='${150 + dx}' cy='205' r='6' fill='#6d523f'/>
      <text x='150' y='380' fill='#5c5347' font-family='Inter,sans-serif' font-size='13' text-anchor='middle'>DEMO TWIN ${attempt} · ${view.toUpperCase()}</text>
    </svg>`);
}

// A made-up reading: two findings the AI is unsure of (asked as questions),
// the rest shown as "Yes, that's right / Not quite".
const DEMO_READING = "00000000-0000-4000-8000-00000000000a";
const f = (value: string, confidence = 0.9) => ({ value, confidence, ask: confidence < 0.7 || value === "not-visible" });
const DEMO_ITEMS = {
  texture: f("wavy"), density: f("medium"), colour: f("dark-brown", 0.6), grey: f("some", 0.8),
  length_top: f("medium"), sides_now: f("short"), fade_now: f("low", 0.75), parting: f("left", 0.8),
  cowlick: f("none", 0.8), hairline: f("slightly-higher-temples", 0.85), hairline_shape: f("even"),
  crown: f("not-visible", 0.3), bald_spots: f("none"), growth_evenness: f("even"), cut_evenness: f("even", 0.8),
  beard: f("stubble"), beard_patchy: f("not-applicable"), moustache: f("natural", 0.8),
};

export async function demoDoor(door: string, body: Record<string, unknown>): Promise<unknown> {
  await wait(350);
  switch (door) {
    case "start-consultation":
      state = { renders: 0 };
      return { consultation_id: "00000000-0000-4000-8000-000000000000", ticket: "demo-ticket-demo-ticket", shop_name: "Barber Jansen" };
    case "give-email":
      state.email = String(body.email);
      return { ok: true };
    case "save-answers":
      return { answers: body.answers };
    case "give-consent":
      if (!state.email) throw new DemoError("email_required_first", 409);
      state.consent = true;
      return { ok: true };
    case "save-photos":
      if (!state.email) throw new DemoError("email_required_first", 409);
      if (!state.consent) throw new DemoError("selfie_consent_required", 409);
      state.photos = true;
      return { ok: true };
    case "request-render":
      if (!state.consent) throw new DemoError("selfie_consent_required", 409);
      if (!state.photos) throw new DemoError("photo_required", 400);
      if (state.renders >= 4) throw new DemoError("no_renders_left", 429);
      state.renders++;
      renderStartedAt = Date.now();
      return { render_id: `demo-${state.renders}`, renders_left: 4 - state.renders };
    case "render-status": {
      const done = Date.now() - renderStartedAt > 9000;
      return done
        ? { status: "succeeded", image_url: PLACEHOLDER, guarantee_eligible: true, renders_left: 4 - state.renders }
        : { status: "running", renders_left: 4 - state.renders };
    }
    case "confirm-render":
      state.confirmed = true;
      return { brief_id: "demo-brief", guarantee_eligible: true, valid_until: new Date(Date.now() + 14 * 864e5).toISOString() };
    case "read-hair": {
      if (!state.photos) throw new DemoError("photos_required", 409);
      // Add &unreadable to the address to see the "couldn't read" path.
      if (new URLSearchParams(window.location.search).has("unreadable")) {
        return { reading_id: DEMO_READING, status: "unreadable", findings: { readable: false, unreadable_reason: "too-dark", items: {}, notes: "" } };
      }
      await wait(4000); // roughly what the real reading takes
      return { reading_id: DEMO_READING, status: "succeeded", findings: { readable: true, unreadable_reason: "none", items: DEMO_ITEMS, notes: "" } };
    }
    case "confirm-finding":
      return { confirmations: { [String(body.key)]: { value: body.value } } };
    // The AI twin, simulated: the front after 6 seconds, the sides after 11
    // (the real one takes about a minute each). Add &twinfail to the address to
    // see a twin that could not be made.
    case "make-twin": {
      if (!state.photos) throw new DemoError("photos_required", 409);
      if (state.twin && state.twin.verdict !== "not-quite") return { twin_id: state.twin.id, attempt: state.twin.attempt, status: "succeeded" };
      const attempt = state.twin ? state.twin.attempt + 1 : 1;
      if (attempt > 2) throw new DemoError("no_twin_attempts_left", 409);
      state.twin = { id: `00000000-0000-4000-8000-00000000007${attempt}`, attempt, startedAt: Date.now() };
      return { twin_id: state.twin.id, attempt };
    }
    case "twin-status": {
      const t = state.twin;
      if (!t) return { status: "none", attempts_left: 2 };
      const age = Date.now() - t.startedAt;
      const left = 2 - t.attempt;
      if (new URLSearchParams(window.location.search).has("twinfail") && age > 6000) return { status: "failed", twin_id: t.id, attempt: t.attempt, attempts_left: left };
      if (age < 6000) return { status: "running", twin_id: t.id, attempt: t.attempt, attempts_left: left };
      if (age < 11000) return { status: "running", twin_id: t.id, attempt: t.attempt, image_url: twinPicture("front", t.attempt), attempts_left: left };
      return { status: "succeeded", twin_id: t.id, attempt: t.attempt, image_url: twinPicture("front", t.attempt),
        side_a_url: twinPicture("left side", t.attempt), side_b_url: twinPicture("right side", t.attempt), verdict: t.verdict ?? null, attempts_left: left };
    }
    case "twin-verdict": {
      const t = state.twin;
      if (!t || t.id !== body.twin_id) throw new DemoError("twin_not_found", 404);
      t.verdict = String(body.verdict);
      if (t.verdict === "looks-like-me") return { next: "use-twin" };
      return { next: t.attempt < 2 ? "try-again" : "use-own-photo" };
    }
    case "my-photos":
      return {}; // demo photos live in the phone's memory only
    case "booking-handoff":
      return { kind: "pass", code: "4729", shop_name: "Barber Jansen", address: "Eerste van der Helststraat 41" };
  }
  throw new DemoError("unknown_door", 404);
}
