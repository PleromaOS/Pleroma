// _shared/door.ts — what every door has in common (ADR 0014).
//
// A door is a small server function with one job. The browser knocks with the
// consultation id and its ticket; the door checks the ticket, does its one job
// with the master key, and answers. The browser never touches a table.

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

// Handles the browser's pre-flight check and anything that is not a POST.
export function gatekeep(req: Request): Response | null {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });
  return null;
}

// ---- Spam protection -------------------------------------------------------
// The caller's internet address is turned into a salted fingerprint straight
// away. The address itself is never stored or logged by us.
export async function callerFingerprint(req: Request): Promise<string> {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  return await fingerprint(ip + "|" + masterKey());
}

// Returns a refusal if this caller has knocked on this door too often,
// otherwise records the knock and returns null.
export async function tooManyKnocks(
  client: SupabaseClient, req: Request, door: string, limit: number, windowSeconds: number,
): Promise<Response | null> {
  const { data, error } = await client.rpc("knock", {
    p_door: door,
    p_caller: await callerFingerprint(req),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  // If the counter itself fails we let the request through: a broken spam
  // filter must not take the whole funnel down.
  if (error) return null;
  return data === false ? reply(429, { error: "slow_down" }) : null;
}

export async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" && !Array.isArray(b) ? b : null;
  } catch {
    return null;
  }
}

// The master key lives only here, on the server.
export function masterKey(): string {
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}

export function db(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, masterKey(), {
    auth: { persistSession: false },
  });
}

export async function fingerprint(ticket: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ticket));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function normaliseEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase();
  // Deliberately loose: something@something.something, no spaces, sane length.
  // Real proof that an address works comes from the email we send to it.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254 ? e : null;
}

export type Consultation = {
  id: string;
  shop_id: string;
  client_id: string | null;
  entry: "campaign" | "shop";
  status: "in_progress" | "completed" | "abandoned";
  answers: Record<string, unknown>;
  created_at: string;
  pass_code: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Every door after the first starts here. Wrong id, wrong ticket and missing
// ticket all get the same answer, so a stranger learns nothing by guessing.
export async function openConsultation(
  client: SupabaseClient,
  body: Record<string, unknown>,
): Promise<{ c: Consultation } | { refused: Response }> {
  const id = typeof body.consultation_id === "string" ? body.consultation_id : "";
  const ticket = typeof body.ticket === "string" ? body.ticket : "";
  if (!UUID.test(id) || ticket.length < 20) {
    return { refused: reply(401, { error: "ticket_invalid" }) };
  }
  const { data, error } = await client
    .from("consultations")
    .select("id, shop_id, client_id, entry, status, answers, created_at, pass_code")
    .eq("id", id)
    .eq("client_token_hash", await fingerprint(ticket))
    .maybeSingle();
  if (error) return { refused: reply(500, { error: "lookup_failed" }) };
  if (!data) return { refused: reply(401, { error: "ticket_invalid" }) };
  return { c: data as Consultation };
}

// ---- The answer vocabulary -------------------------------------------------
// Every answer that feeds the renderer must use the renderer's own words.
// Anything else would reach the prompt as nonsense. These lists are copied
// from hair-transfer/build-request.ts and must change together with it.

export const TEXTURES = ["straight-fine", "straight-coarse", "wavy", "curly", "coily"];
export const SIDES = ["skin-fade", "close-fade", "shadow-fade", "taper", "undercut", "natural"];
export const FADE_HEIGHTS = ["low", "mid", "high", "drop"];
export const BEARDS = ["none", "stubble", "short", "medium", "full"];
export const EFFORTS = ["low", "medium", "high"];
export const LENGTHS = ["very-short", "short", "medium", "medium-long", "long"];
export const STYLE_IDS = Array.from({ length: 21 }, (_, i) => String(i + 1).padStart(2, "0"));

// The rest of the quiz is still being settled, so it is accepted as short text.
export const FREE_TEXT_ANSWERS = [
  "fade_style", "line_sharpness", "neckline", "moustache_style",
  "length_direction", "adjustments",
];

// Answers that describe the person rather than this visit. They pre-fill the
// next consultation (client_preferences, ADR 0011).
export const STANDING_ANSWERS = [
  "hair_texture", "sides_treatment", "fade_style", "line_sharpness",
  "neckline", "beard_style", "moustache_style",
];
