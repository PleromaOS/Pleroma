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
// The render uses the stored front photo (door 9); no photo is sent again.
export const requestRender = (t: Ticket) =>
  knock<{ render_id: string; renders_left: number }>("request-render", { ...t });

// 6
export type RenderStatus = {
  status: "queued" | "running" | "succeeded" | "failed";
  image_url?: string;
  side_a_url?: string | null;   // the new cut from the sides (drawn on the AI twin only)
  side_b_url?: string | null;
  sides_pending?: boolean;      // the sides follow the front by about a minute
  on_twin?: boolean;
  guarantee_eligible?: boolean;
  renders_left: number;
};
export const renderStatus = (t: Ticket, render_id: string) =>
  knock<RenderStatus>("render-status", { ...t, render_id });

// 7
export const confirmRender = (t: Ticket, render_id: string, terms_version: string) =>
  knock<{ brief_id: string; guarantee_eligible: boolean; valid_until: string }>(
    "confirm-render", { ...t, render_id, terms_version });

// 9 · the three scan photos, stored privately (a second call replaces them)
export type PhotoSet = { front: string; sideA: string; sideB: string; source: "scan" | "library" };
export const savePhotos = (t: Ticket, p: PhotoSet) =>
  knock<{ ok: true }>("save-photos", { ...t, source: p.source, front: p.front, side_a: p.sideA, side_b: p.sideB });

// 10 · the hair reading. Returns the stored reading if these photos were read already.
export type FindingItem = { value: string | null; confidence: number; ask: boolean };
export type Reading = {
  reading_id: string;
  status: "succeeded" | "unreadable";
  findings: { readable: boolean; unreadable_reason: string; items: Record<string, FindingItem>; notes: string };
};
export const readHair = (t: Ticket) => knock<Reading>("read-hair", { ...t });

// 11 · the client's answer to one finding (the door works out if it agrees with the AI)
export const confirmFinding = (t: Ticket, reading_id: string, key: string, value: string) =>
  knock<{ confirmations: Record<string, unknown> }>("confirm-finding", { ...t, reading_id, key, value });

// 12 · make the AI twin: the same person, same hair, in studio light (about two minutes).
// Answers straight away; the app then asks door 13 how it is going.
export const makeTwin = (t: Ticket) =>
  knock<{ twin_id: string; attempt: number; status?: "succeeded" }>("make-twin", { ...t });

// 13 · how far the twin is. The front link appears the moment the front
// exists, before the sides are done, so the conversation can show it early.
export type TwinStatus = {
  status: "none" | "running" | "succeeded" | "failed";
  twin_id?: string;
  attempt?: number;
  image_url?: string;   // the front
  side_a_url?: string;  // matches the client's first side photo (shown as "Left side")
  side_b_url?: string;  // matches the second side photo ("Right side")
  verdict?: string | null;
  attempts_left: number;
};
export const twinStatus = (t: Ticket) => knock<TwinStatus>("twin-status", { ...t });

// 14 · "does this look like you?"
export const twinVerdict = (t: Ticket, twin_id: string, verdict: "looks-like-me" | "not-quite") =>
  knock<{ next: "use-twin" | "try-again" | "use-own-photo" }>("twin-verdict", { ...t, twin_id, verdict });

// 15 · private links to the client's OWN three scan photos, for comparing with the twin
// (used when the photos are no longer in the phone's memory, after a refresh).
export const myPhotos = (t: Ticket) =>
  knock<{ front?: string; side_a?: string; side_b?: string }>("my-photos", { ...t });

// 8
export type Handoff =
  | { kind: "booking"; url: string; shop_name: string }
  | { kind: "pass"; code: string; shop_name: string; address: string | null };
export const bookingHandoff = (t: Ticket) => knock<Handoff>("booking-handoff", { ...t });
