// Where the app finds Pleroma's backend.
//
// Both values are PUBLIC by design. The publishable key only lets a browser do
// what the database's security rules allow for strangers, which is: read the
// style catalogue and the reference photo list. Everything else goes through
// the doors, which check the ticket. The master key is never in this app.

export const SUPABASE_URL = "https://eusyxqguevqgrnnjqhut.supabase.co";
export const PUBLISHABLE_KEY = "sb_publishable_u_qqfoYHcfx6O2ZT2Vgq_A_WfcV0RRY";

// Wording versions. When the text of a consent or the guarantee terms changes,
// bump the version here, so the database records which words each client saw.
// v2 (2026-09-26): three photos, used for the render AND the barber's brief.
export const SELFIE_CONSENT_VERSION = "selfie-2026-09-v2";
export const GUARANTEE_TERMS_VERSION = "guarantee-2026-09-v1";

// Demo mode: add ?demo to the address. Every door is simulated in the browser,
// so you can click through the whole flow without creating records or
// spending a render. Nothing leaves the phone.
// A preview build (npm run build:preview) is demo-only and never talks to the backend.
export const PREVIEW_BUILD = import.meta.env.VITE_PREVIEW_BUILD === "1";
export const IS_DEMO = PREVIEW_BUILD || new URLSearchParams(window.location.search).has("demo");
