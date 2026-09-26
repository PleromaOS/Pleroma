// W21 · Render reveal — PROVISIONAL.
//
// This is the anchor screen of the whole product, and it is the one widget
// with no locked design (no screenshot in "widgets references"). This version
// is a plain placeholder built from the floor plan so the flow works end to
// end: their face with the cut, the guarantee badge when the gate passed, the
// renders left, and two ways forward. It must be replaced by Bryan's pick.
//
// Also here: W29 · Refine panel (variant 1b, "full screen, grouped, review
// before spending"). Changing something costs one of the client's renders, so
// the button says exactly what will change before it spends it.

import { useState } from "react";
import { requestRender, saveAnswers } from "../api/doors";
import { Button, GuaranteeBadge, Page, Problem } from "../components/ui";
import { BEARDS, FADE_HEIGHTS, labelOf, SIDES, type Option } from "../data/vocabulary";
import type { Flow } from "../flow/useConsultation";
import { explain } from "../lib/messages";

export function Reveal({ flow }: { flow: Flow }) {
  const { c, go } = flow;
  return (
    <Page>
      <div className="render">
        {c.imageUrl ? <img src={c.imageUrl} alt="You, with your new cut" /> : <span>Your render</span>}
      </div>
      {c.eligible
        ? <GuaranteeBadge value="Covered" large />
        : <p className="lede">This cut is a longer journey. Your barber will plan it with you at the chair.</p>}
      <p className="caption">{c.rendersLeft} {c.rendersLeft === 1 ? "change" : "changes"} left</p>
      <Button onClick={() => go("confirm-you")}>That's the look</Button>
      <Button kind="secondary" onClick={() => go("refine")} disabled={c.rendersLeft < 1}>Change something</Button>
    </Page>
  );
}

const GROUPS: { tab: string; key: string; options: Option[] }[] = [
  { tab: "Sides", key: "sides_treatment", options: SIDES },
  { tab: "Fade", key: "fade_height", options: FADE_HEIGHTS },
  { tab: "Beard", key: "beard_style", options: BEARDS },
];

export function Refine({ flow }: { flow: Flow }) {
  const { c, update, go, back } = flow;
  const [tab, setTab] = useState(0);
  const [changes, setChanges] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const group = GROUPS[tab];
  const current = (key: string) => changes[key] ?? (c.answers[key] as string | undefined);

  const summary = Object.entries(changes)
    .map(([k, v]) => `${GROUPS.find((g) => g.key === k)!.tab}: ${labelOf(GROUPS.find((g) => g.key === k)!.options, v)}`)
    .join(" · ");

  async function render() {
    if (!c.ticket || !summary) return;
    setBusy(true); setProblem(null);
    try {
      await saveAnswers(c.ticket, changes);
      const r = await requestRender(c.ticket);
      update({ answers: { ...c.answers, ...changes }, renderId: r.render_id, rendersLeft: r.renders_left, imageUrl: undefined });
      go("wait");
    } catch (e) {
      setProblem(explain(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page onBack={back}>
      <header className="refine__head">
        <div className="refine__thumb">{c.imageUrl && <img src={c.imageUrl} alt="" />}</div>
        <div><strong>Your render</strong><span className="caption">{c.rendersLeft} {c.rendersLeft === 1 ? "change" : "changes"} left</span></div>
      </header>

      <div className="toggle" role="tablist">
        {GROUPS.map((g, i) => (
          <button key={g.tab} role="tab" aria-selected={tab === i} onClick={() => setTab(i)}>{g.tab}</button>
        ))}
      </div>

      <p className="eyebrow">{group.tab}{current(group.key) ? "" : " · as the style comes"}</p>
      <div className="grid grid--3">
        {group.options.map((o) => (
          <button key={o.value} className="option" aria-pressed={current(group.key) === o.value}
            onClick={() => setChanges({ ...changes, [group.key]: o.value })}>
            <span>{o.label}</span>{o.hint && <small>{o.hint}</small>}
          </button>
        ))}
      </div>

      <Problem message={problem} />
      {summary && <p className="caption">Changing: {summary}</p>}
      <Button onClick={render} disabled={!summary} busy={busy}>
        {summary ? "Render with these changes" : "Change something to render"}
      </Button>
    </Page>
  );
}
