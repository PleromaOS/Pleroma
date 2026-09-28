// The consultation the client is building, held in one place.
//
// Every screen reads from and adds to this one record, which is the main
// reason this app is React (ADR 0014). It is also kept in the browser tab's
// session storage, so a refresh or an accidental swipe-back does not throw
// the client back to the start. Session storage is wiped when the tab closes.
//
// What it deliberately does NOT keep: the photos. A photo of a face is
// Article 9 data, so the three scan photos live only in memory on the phone
// until the email step sends them to private storage (door 9), and are never
// written to the phone's storage by us. The hair READING (words like "wavy",
// "short beard") is kept in the session like the answers, so a refresh
// mid-way does not re-read or re-ask.

import { useCallback, useEffect, useState } from "react";
import type { Handoff, Ticket } from "../api/doors";
import type { FindingItem, PhotoSet } from "../api/doors";
import type { StepId } from "./steps";

export type Consultation = {
  shop: string;
  entry: "campaign" | "shop";
  shopName?: string;
  ticket?: Ticket;
  step: StepId;
  history: StepId[];              // for the back button
  consentTappedAt?: string;       // when the photo switch was turned on (sent with the email)
  emailGiven?: boolean;
  photosSaved?: boolean;          // the current photos are in private storage
  answers: Record<string, string | boolean>;
  reading?: { id: string; items: Record<string, FindingItem> }; // the AI's reading of the photos (door 10)
  confirmed?: Record<string, string>;  // finding → the value the client settled on (door 11)
  findingsDone?: boolean;
  twin?: {                        // the AI twin (doors 12-14)
    id: string;
    attempt: number;
    outcome?: "use-twin" | "use-own-photo";  // what the cut will be drawn on
  };
  styleName?: string;             // for display only; the door stores the style id
  renderId?: string;
  rendersLeft: number;
  imageUrl?: string;              // private link to the render; expires after an hour
  renderSides?: { left?: string | null; right?: string | null; pending?: boolean }; // the new cut from both sides (twin renders)
  eligible?: boolean;             // may this render carry the guarantee badge?
  handoff?: Handoff;
};

const key = (shop: string, entry: string) => `pleroma:${shop}:${entry}`;

function load(shop: string, entry: "campaign" | "shop"): Consultation {
  try {
    const saved = sessionStorage.getItem(key(shop, entry));
    if (saved) return JSON.parse(saved);
  } catch { /* private browsing or storage blocked: start fresh */ }
  return { shop, entry, step: "landing", history: [], answers: {}, rendersLeft: 4 };
}

export function useConsultation(shop: string, entry: "campaign" | "shop") {
  const [c, setC] = useState<Consultation>(() => load(shop, entry));
  const [photos, setPhotos] = useState<PhotoSet | null>(null); // memory only, see above

  useEffect(() => {
    try { sessionStorage.setItem(key(shop, entry), JSON.stringify(c)); } catch { /* ignore */ }
  }, [c, shop, entry]);

  const update = useCallback((patch: Partial<Consultation>) => setC((prev) => ({ ...prev, ...patch })), []);

  const go = useCallback((step: StepId) =>
    setC((prev) => ({ ...prev, step, history: [...prev.history, prev.step] })), []);

  // Back never returns into the wait or past a confirmed brief: those rooms
  // spent a render or froze a record, and walking back into them would lie.
  const back = useCallback(() => setC((prev) => {
    const history = [...prev.history];
    let step = history.pop();
    while (step === "wait") step = history.pop();
    return step ? { ...prev, step, history } : prev;
  }), []);

  const restart = useCallback(() => {
    try { sessionStorage.removeItem(key(shop, entry)); } catch { /* ignore */ }
    setPhotos(null);
    setC(load(shop, entry));
  }, [shop, entry]);

  // The front photo is the one the render is drawn on.
  return { c, update, go, back, restart, photos, setPhotos, selfie: photos?.front ?? null };
}

export type Flow = ReturnType<typeof useConsultation>;
