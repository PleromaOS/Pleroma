// W22 · Render confirmation (variant 1b, "two screens, each with its own evidence").
//   1. "Is this you?"          the render next to their own photo
//   2. "Is this the cut you want?"  the render next to the brief
// This is the client's half of the countersign (ADR 0010). Saying yes on the
// second screen calls door 7, which freezes the brief and opens the guarantee
// record, then door 8, which returns the booking link or the walk-in pass.

import { useState } from "react";
import { bookingHandoff, confirmRender } from "../api/doors";
import { GUARANTEE_TERMS_VERSION } from "../config";
import { Button, Page, Problem } from "../components/ui";
import { BEARDS, CURRENT_LENGTHS, EFFORTS, FADE_HEIGHTS, labelOf, SIDES } from "../data/vocabulary";
import type { Flow } from "../flow/useConsultation";
import { explain } from "../lib/messages";

function Pips({ at }: { at: 1 | 2 }) {
  return <div className="pips"><i className="on" /><i className={at === 2 ? "on" : ""} /></div>;
}

export function ConfirmYou({ flow }: { flow: Flow }) {
  const { c, go, back, selfie } = flow;
  return (
    <Page onBack={back}>
      <Pips at={1} />
      <h1 className="display">Is this <em>you</em>?</h1>
      <div className="pair">
        <figure>{selfie ? <img src={selfie} alt="Your photo" /> : <span>Your photo</span>}<figcaption>Your photo</figcaption></figure>
        <figure>{c.imageUrl ? <img src={c.imageUrl} alt="Your render" /> : <span>Render</span>}<figcaption>Your render</figcaption></figure>
      </div>
      <p className="caption">Same face, same hair colour, same you. Only the cut should be different.</p>
      <Button onClick={() => go("confirm-cut")}>Yes, that's me</Button>
      <Button kind="secondary" onClick={() => go("selfie")}>No, try another photo</Button>
    </Page>
  );
}

export function ConfirmCut({ flow }: { flow: Flow }) {
  const { c, update, go, back } = flow;
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const a = c.answers;

  const lines: [string, string][] = ([
    ["Style", c.styleName ?? String(a.style_id ?? "")],
    ["Sides", labelOf(SIDES, a.sides_treatment) || "As the style comes"],
    ["Fade", labelOf(FADE_HEIGHTS, a.fade_height)],
    ["Beard", labelOf(BEARDS, a.beard_style)],
    ["Length now", labelOf(CURRENT_LENGTHS, a.current_length)],
    ["Upkeep", labelOf(EFFORTS, a.styling_effort)],
  ] as [string, string][]).filter(([, v]) => v);

  async function yes() {
    if (!c.ticket || !c.renderId) return;
    setBusy(true); setProblem(null);
    try {
      const done = await confirmRender(c.ticket, c.renderId, GUARANTEE_TERMS_VERSION);
      const handoff = await bookingHandoff(c.ticket);
      update({ handoff, eligible: done.guarantee_eligible, history: [] }); // no way back once confirmed
      go("handoff");
    } catch (e) {
      setProblem(explain(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page onBack={back}>
      <Pips at={2} />
      <h1 className="display">Is this the <em>cut</em> you want?</h1>
      <div className="split">
        <div className="split__img">{c.imageUrl ? <img src={c.imageUrl} alt="Your render" /> : <span>Render</span>}</div>
        <dl className="brief brief--tight">
          {lines.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
      </div>
      <Problem message={problem} />
      <Button onClick={yes} busy={busy}>Yes, this is my cut</Button>
      <Button kind="secondary" onClick={() => go("refine")} disabled={busy || c.rendersLeft < 1}>Not quite</Button>
      <p className="fineprint">
        By confirming you agree to the guarantee terms: your barber checks this cut with you
        before starting, and only what you both agree is guaranteed.
      </p>
    </Page>
  );
}
