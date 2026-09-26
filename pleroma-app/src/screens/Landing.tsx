// W20 · Campaign landing (variant 1b, "render leads").
// The first thing a stranger from an advert sees. One offer, one button.
// Pressing it opens the consultation (door 1). Nothing is asked here.
//
// The same room serves the in-shop QR entry with different words: that person
// is already in the building, waiting, so the pitch is about passing the time
// usefully rather than about getting them through the door.

import { useState } from "react";
import { startConsultation } from "../api/doors";
import { Button, Page, Problem } from "../components/ui";
import type { Flow } from "../flow/useConsultation";
import { explain } from "../lib/messages";

export function Landing({ flow }: { flow: Flow }) {
  const { c, update, go } = flow;
  const [view, setView] = useState<"photo" | "render">("photo");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const inShop = c.entry === "shop";

  async function start() {
    setBusy(true); setProblem(null);
    try {
      const t = await startConsultation(c.shop, c.entry);
      update({ ticket: { consultation_id: t.consultation_id, ticket: t.ticket }, shopName: t.shop_name });
      go("email");
    } catch (e) {
      setProblem(explain(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <div className="example">
        {/* Real before/after example images go here once chosen. */}
        <div className="example__frame">{view === "photo" ? "Example photo" : "Example render"}</div>
        <div className="toggle" role="tablist">
          <button role="tab" aria-selected={view === "photo"} onClick={() => setView("photo")}>Your photo</button>
          <button role="tab" aria-selected={view === "render"} onClick={() => setView("render")}>The render</button>
        </div>
        <p className="caption">Example: a photo taken during the consultation</p>
      </div>

      <h1 className="display">
        {inShop ? <>While you wait, see your next cut on your <em>face</em>.</> : <>See the cut on your <em>face</em> first.</>}
      </h1>

      <div className="capsules">
        <span className="capsule capsule--ok">Free consultation</span>
        <span className="capsule capsule--gold">Refund if it doesn't match</span>
      </div>

      <Problem message={problem} />
      <Button onClick={start} busy={busy}>Start my free consultation</Button>
    </Page>
  );
}
