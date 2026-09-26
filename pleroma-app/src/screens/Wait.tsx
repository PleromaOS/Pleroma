// W28 · The wait (variant 1b, "two tracks, reveal on tap").
//
// A render takes 30-60 seconds. Sixty seconds on a cold click is an eternity,
// so the wait shows the client's own brief being written, line by line.
// When the render is ready it stays covered until they tap Reveal: the payoff
// is theirs to trigger.
//
// Honest note: the renderer does not report its stages. The five render steps
// tick on a timer so the screen feels alive; only "ready" is real. The page
// asks door 6 every 2.5 seconds whether the render is done.

import { useEffect, useRef, useState } from "react";
import { renderStatus, requestRender } from "../api/doors";
import { Button, Page, Problem } from "../components/ui";
import { CURRENT_LENGTHS, EFFORTS, labelOf, TEXTURES } from "../data/vocabulary";
import type { Flow } from "../flow/useConsultation";
import { explain } from "../lib/messages";

const STAGES = ["Reading your photo", "Finding your hairline", "Drawing the sides", "Shaping the top", "Matching your light"];
const POLL_MS = 2500;
const GIVE_UP_MS = 180_000;

export function Wait({ flow }: { flow: Flow }) {
  const { c, update, go } = flow;
  const [elapsed, setElapsed] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const started = useRef(Date.now());

  useEffect(() => {
    if (!c.ticket || !c.renderId || ready || failed) return;
    started.current = Date.now();
    const tick = setInterval(() => setElapsed(Date.now() - started.current), 500);
    const poll = setInterval(async () => {
      try {
        const s = await renderStatus(c.ticket!, c.renderId!);
        if (s.status === "succeeded") {
          update({ imageUrl: s.image_url, eligible: s.guarantee_eligible, rendersLeft: s.renders_left });
          setReady(true);
        } else if (s.status === "failed") {
          update({ rendersLeft: s.renders_left });
          setFailed(true);
        }
      } catch { /* a missed poll is retried on the next tick */ }
      if (Date.now() - started.current > GIVE_UP_MS) setFailed(true);
    }, POLL_MS);
    return () => { clearInterval(tick); clearInterval(poll); };
  }, [c.ticket, c.renderId, ready, failed, update]);

  async function tryAgain() {
    if (!c.ticket) return;
    setProblem(null);
    try {
      const r = await requestRender(c.ticket);
      update({ renderId: r.render_id, rendersLeft: r.renders_left });
      setFailed(false); setElapsed(0);
    } catch (e) {
      setProblem(explain(e));
    }
  }

  const done = ready ? STAGES.length : Math.min(STAGES.length - 1, Math.floor(elapsed / 7000));
  const style = String(c.answers.style_id ?? "");
  const brief: [string, string][] = [
    ["Texture", labelOf(TEXTURES, c.answers.hair_texture)],
    ["Length now", labelOf(CURRENT_LENGTHS, c.answers.current_length)],
    ["Style", c.styleName ?? style],
    ["Upkeep", labelOf(EFFORTS, c.answers.styling_effort)],
  ];
  const linesShown = Math.min(brief.length, 1 + Math.floor(elapsed / 3000));

  return (
    <Page>
      <section className="card">
        <p className="eyebrow">Your render</p>
        <ul className="stages">
          {STAGES.map((s, i) => (
            <li key={s} className={i < done ? "done" : i === done && !failed ? "now" : ""}>{s}</li>
          ))}
        </ul>
      </section>

      <p className="eyebrow eyebrow--muted">Your brief · being written</p>
      <dl className="brief">
        {brief.map(([k, v], i) => (
          <div key={k}><dt>{k}</dt><dd>{i < linesShown ? v : <span className="shimmer" />}</dd></div>
        ))}
      </dl>

      <Problem message={problem} />
      {ready && <Button onClick={() => go("reveal")}>Reveal my cut</Button>}
      {failed && (
        <>
          <p className="problem" role="alert">This render didn't work. It happens with some photos and it doesn't count against you.</p>
          {c.rendersLeft > 0
            ? <Button onClick={tryAgain}>Try again</Button>
            : <Button onClick={() => go("selfie")}>Take a new photo</Button>}
          <Button kind="secondary" onClick={() => go("selfie")}>Use a different photo</Button>
        </>
      )}
    </Page>
  );
}
