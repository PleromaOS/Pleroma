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
//
// Since the scan moved to the start (2026-09-26) the render is STARTED here,
// on arrival, with the front photo. If the photos were cleared by a page
// refresh, the client is sent back for a quick rescan; their email and
// answers are kept, so the rescan comes straight back here.

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
  const { c, update, go, photos } = flow;
  const [elapsed, setElapsed] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const started = useRef(Date.now());
  const asked = useRef(false);
  const lostPhotos = !c.renderId && !photos;

  // Start the render once, on arrival.
  useEffect(() => {
    if (c.renderId || !photos || !c.ticket || asked.current) return;
    asked.current = true;
    requestRender(c.ticket, photos.front)
      .then((r) => update({ renderId: r.render_id, rendersLeft: r.renders_left, imageUrl: undefined, eligible: undefined }))
      .catch((e) => { setProblem(explain(e)); setFailed(true); });
  }, [c.renderId, c.ticket, photos, update]);

  function rescan() { update({ renderId: undefined }); go("scan"); }

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
      const r = await requestRender(c.ticket, photos?.front);
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

  if (lostPhotos) {
    return (
      <Page>
        <h1 className="display display--sm">One more quick scan</h1>
        <p className="lede">The page reloaded, and your photos are only ever kept on your phone until they're used, so they were cleared. Your answers are saved.</p>
        <Button onClick={rescan}>Scan again</Button>
      </Page>
    );
  }

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
            : <Button onClick={rescan}>Scan again</Button>}
          <Button kind="secondary" onClick={rescan}>Scan again with different light</Button>
        </>
      )}
    </Page>
  );
}
