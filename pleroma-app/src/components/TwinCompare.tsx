// W43 (revised, r2-2) + W47 (locked): the client's own photo next to their AI
// twin, turned together with one slider.
//
// What it does:   shows "Your photo" and "AI twin" side by side at the same
//                 size. One slider with three named stops (Left side, Front,
//                 Right side) turns both, or the client drags either picture.
//                 When the finger lets go it always settles on one of the
//                 three real pictures; the blend between two is only seen
//                 while moving, and only in the middle of the move.
// What it does NOT do: it never makes new angles. Every angle the client can
//                 land on is one the truth check has seen. If a side is
//                 missing, it shows the two fronts only, without the slider
//                 (W47 rule), rather than a slider with empty stops.
//
// Why this is one component: the same viewer will show the new cut later
// (W47: "reusable for the new cut"), so the turning lives in one place.

import { useCallback, useEffect, useRef, useState } from "react";

export type Views = { front: string; left?: string | null; right?: string | null };

const NAMES = ["Left side", "Front", "Right side"];
const SPOKEN = ["Your left side", "Front", "Your right side"];

// Most of the move holds a real picture; the blend happens in the middle only.
const ease = (x: number) => { const t = Math.max(0, Math.min(1, (x - 0.3) / 0.4)); return t * t * (3 - 2 * t); };

export function TwinCompare({ own, twin }: { own: Views | null; twin: Views }) {
  const turnable = !!(twin.left && twin.right && (!own || (own.left && own.right)));
  const [p, setP] = useState(0);         // -1 left side … 0 front … 1 right side
  const [settling, setSettling] = useState(false);
  const near = Math.round(p);

  const settle = useCallback((to: number) => {
    setSettling(true); setP(Math.max(-1, Math.min(1, to)));
    window.setTimeout(() => setSettling(false), 280);
  }, []);

  // Dragging a picture: horizontal moves turn, vertical moves still scroll the page.
  const drag = useRef<{ x: number; y: number; p: number; id: number; live: boolean; w: number } | null>(null);
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!turnable) return;
    drag.current = { x: e.clientX, y: e.clientY, p, id: e.pointerId, live: false, w: e.currentTarget.clientWidth };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.live) {
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) return;
      d.live = true; e.currentTarget.setPointerCapture(e.pointerId);
    }
    setP(Math.max(-1, Math.min(1, d.p + dx / (d.w * 0.55))));
  };
  const onUp = () => { const d = drag.current; drag.current = null; if (d?.live) settle(Math.round(p)); };
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (!turnable || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(k)) return;
    e.preventDefault();
    settle(k === "Home" ? -1 : k === "End" ? 1 : near + (k === "ArrowRight" ? 1 : -1));
  };

  // The slider track under both pictures.
  const track = useRef<HTMLDivElement>(null);
  const railDrag = useRef(false);
  const at = (e: React.PointerEvent) => {
    const r = track.current!.getBoundingClientRect();
    return Math.max(-1, Math.min(1, ((e.clientX - r.left - 14) / (r.width - 28)) * 2 - 1));
  };

  const picture = (v: Views, who: "Your photo" | "AI twin") => (
    <div className={`tc__stage${settling ? " is-settling" : ""}`}
      tabIndex={turnable ? 0 : -1} role={turnable ? "slider" : undefined}
      aria-label={turnable ? `${who}. Turn to see the sides.` : `${who}, from the front`}
      aria-valuemin={turnable ? -1 : undefined} aria-valuemax={turnable ? 1 : undefined}
      aria-valuenow={turnable ? near : undefined} aria-valuetext={turnable ? SPOKEN[near + 1] : undefined}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}>
      <img src={v.front} alt={`${who} from the front`} draggable={false} />
      {turnable && <img src={v.left!} alt="" draggable={false} style={{ opacity: ease(-p) }} />}
      {turnable && <img src={v.right!} alt="" draggable={false} style={{ opacity: ease(p) }} />}
    </div>
  );

  return (
    <div className="tc">
      <div className={`tc__pair${own ? "" : " is-single"}`}>
        {own && <div className="tc__col"><span className="tc__cap">Your photo</span>{picture(own, "Your photo")}</div>}
        <div className="tc__col"><span className="tc__cap">AI twin</span>{picture(twin, "AI twin")}</div>
      </div>
      {turnable && (
        <div className="tc__rail">
          <div className="tc__track" ref={track} aria-hidden
            onPointerDown={(e) => { railDrag.current = true; e.currentTarget.setPointerCapture(e.pointerId); setP(at(e)); }}
            onPointerMove={(e) => { if (railDrag.current) setP(at(e)); }}
            onPointerUp={() => { railDrag.current = false; settle(Math.round(p)); }}
            onPointerCancel={() => { railDrag.current = false; settle(Math.round(p)); }}>
            <span className="tc__stop" style={{ left: 14 }} />
            <span className="tc__stop" style={{ left: "50%" }} />
            <span className="tc__stop" style={{ left: "calc(100% - 14px)" }} />
            <span className="tc__thumb" style={{ left: `calc(14px + ${(p + 1) / 2} * (100% - 28px))` }} />
          </div>
          <div className="tc__names" aria-hidden>
            {NAMES.map((n, i) => <span key={n} className={i - 1 === near ? "is-on" : undefined}>{n}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

// Loads pictures before showing them, so the client never sees a half-drawn twin.
export function usePreloaded(urls: (string | null | undefined)[]) {
  const [ready, setReady] = useState(false);
  const key = urls.filter(Boolean).join("|");
  useEffect(() => {
    let alive = true;
    setReady(false);
    const list = urls.filter(Boolean) as string[];
    Promise.all(list.map((u) => new Promise<void>((res) => { const i = new Image(); i.onload = i.onerror = () => res(); i.src = u; })))
      .then(() => { if (alive) setReady(true); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return ready;
}
