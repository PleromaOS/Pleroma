// Demo mode: every door simulated in the browser (add ?demo to the address).
//
// It follows the same rules as the real doors, so the screens can be tried
// end to end, including the refusals. It creates nothing and costs nothing.
// The "render" is a drawn placeholder, not a real image of anyone.

import { DoorError as DemoError } from "./errors";

let state: { email?: string; consent?: boolean; renders: number; confirmed?: boolean } = { renders: 0 };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let renderStartedAt = 0;

const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'>
    <rect width='300' height='400' fill='#242019'/>
    <ellipse cx='150' cy='180' rx='70' ry='90' fill='#453c30'/>
    <path d='M80 150 Q150 60 220 150 L220 120 Q150 40 80 120Z' fill='#c9a96e'/>
    <text x='150' y='360' fill='#908674' font-family='Inter,sans-serif' font-size='14' text-anchor='middle'>DEMO RENDER</text>
  </svg>`);


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
    case "request-render":
      if (!state.consent) throw new DemoError("selfie_consent_required", 409);
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
    case "booking-handoff":
      return { kind: "pass", code: "4729", shop_name: "Barber Jansen", address: "Eerste van der Helststraat 41" };
  }
  throw new DemoError("unknown_door", 404);
}
