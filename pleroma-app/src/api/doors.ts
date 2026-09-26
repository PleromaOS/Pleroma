// The app's side of the doors (ADR 0014).
//
// One function per door. Each sends the consultation id and ticket, and turns
// the door's answer into either data or a DoorError the screens can explain.
// This file is the ONLY place the app talks to the backend about a consultation.

import { IS_DEMO, SUPABASE_URL } from "../config";
import { demoDoor } from "./demo";
import { DoorError } from "./errors";

export { DoorError };

export type Ticket = { consultation_id: string; ticket: string };

async function knock<T>(door: string, body: Record<string, unknown>): Promise<T> {
  if (IS_DEMO) return demoDoor(door, body) as Promise<T>;

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/${door}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new DoorError("offline", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new DoorError(data.error ?? "unknown", res.status);
  return data as T;
}

// 1
export const startConsultation = (shop: string, entry: "campaign" | "shop") =>
  knock<Ticket & { shop_name: string }>("start-consultation", { shop, entry });

// 2
export const giveEmail = (t: Ticket, email: string) =>
  knock<{ ok: true }>("give-email", { ...t, email });

// 3
export const saveAnswers = (t: Ticket, answers: Record<string, unknown>) =>
  knock<{ answers: Record<string, unknown> }>("save-answers", { ...t, answers });

// 4
export const giveConsent = (t: Ticket, purpose: "render_selfie" | "after_photo", wording_version: string) =>
  knock<{ ok: true }>("give-consent", { ...t, purpose, wording_version });

// 5
export const requestRender = (t: Ticket, photo_base64?: string) =>
  knock<{ render_id: string; renders_left: number }>(
    "request-render", photo_base64 ? { ...t, photo_base64 } : { ...t });

// 6
export type RenderStatus = {
  status: "queued" | "running" | "succeeded" | "failed";
  image_url?: string;
  guarantee_eligible?: boolean;
  renders_left: number;
};
export const renderStatus = (t: Ticket, render_id: string) =>
  knock<RenderStatus>("render-status", { ...t, render_id });

// 7
export const confirmRender = (t: Ticket, render_id: string, terms_version: string) =>
  knock<{ brief_id: string; guarantee_eligible: boolean; valid_until: string }>(
    "confirm-render", { ...t, render_id, terms_version });

// 8
export type Handoff =
  | { kind: "booking"; url: string; shop_name: string }
  | { kind: "pass"; code: string; shop_name: string; address: string | null };
export const bookingHandoff = (t: Ticket) => knock<Handoff>("booking-handoff", { ...t });
