// The consultation the client is building, held in one place.
//
// Every screen reads from and adds to this one record, which is the main
// reason this app is React (ADR 0014). It is also kept in the browser tab's
// session storage, so a refresh or an accidental swipe-back does not throw
// the client back to the start. Session storage is wiped when the tab closes.
//
// What it deliberately does NOT keep: the selfie. A photo of a face is
// Article 9 data, so it lives only in memory for the few minutes it is needed
// on screen, and is never written to the phone's storage by us.

import { useCallback, useEffect, useState } from "react";
import type { Handoff, Ticket } from "../api/doors";
import type { StepId } from "./steps";

export type Consultation = {
  shop: string;
  entry: "campaign" | "shop";
  shopName?: string;
  ticket?: Ticket;
  step: StepId;
  history: StepId[];              // for the back button
  answers: Record<string, string | boolean>;
  styleName?: string;             // for display only; the door stores the style id
  renderId?: string;
  rendersLeft: number;
  imageUrl?: string;              // private link to the render; expires after an hour
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
  const [selfie, setSelfie] = useState<string | null>(null); // memory only, see above

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
    setSelfie(null);
    setC(load(shop, entry));
  }, [shop, entry]);

  return { c, update, go, back, restart, selfie, setSelfie };
}

export type Flow = ReturnType<typeof useConsultation>;
