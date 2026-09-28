// W43 (revised 28 Sep, r2-2) · Making the AI twin, then checking it.
//
// Straight after the reading, in the same conversation:
//   1. "Now I'm making your AI twin …" with four steps that tick off. The
//      first two follow the clock (the kitchen really is reading the photos
//      and setting up the light then), but never run ahead of the real
//      status: "Making the front" stays until the front exists.
//   2. The front arrives as a picture message the moment it exists (door 13
//      gives its link early): "Here's the front. Now your sides …"
//   3. When both sides are done: the twin next to the client's OWN photo,
//      turned together with one slider (components/TwinCompare, W47 locked).
//   4. "AI can make mistakes. Does this look like you?" Yes / Not quite.
//        Yes                → the cut is drawn on the twin
//        Not quite (first)  → one more twin, narrated the same way
//        Not quite (second) → the cut is drawn on their own photo
//      Door 14 decides which, so the rule lives in one place.
// A twin that could not be made is never a dead end: the cut is drawn on
// their own photo, and the client is told so in one line.
//
// Why the client waits here (Bryan, 27 Sep): making the twin in the
// background during the "what you want" questions would mean the check
// interrupts those questions, "two conversations at the same time".

import { useCallback, useEffect, useRef, useState } from "react";
import { makeTwin, myPhotos, twinStatus, twinVerdict, type TwinStatus } from "../api/doors";
import { BackButton, Problem } from "../components/ui";
import { TwinCompare, usePreloaded, type Views } from "../components/TwinCompare";
import type { Flow } from "../flow/useConsultation";
import { explain } from "../lib/messages";

const STEPS = ["Looking at your face in all three photos", "Setting up the light", "Making the front", "Making both sides"];
const STEP_MS = 9000;              // how long each of the first two steps shows at least
const POLL_MS = 3000;
const SLOW_MS = 4 * 60_000;        // twice the usual time: say so

type Round = {
  attempt: number;
  twinId?: string;
  startedAt: number;
  status: TwinStatus["status"] | "starting";
  front?: string; left?: string; right?: string;
  answer?: "yes" | "no";
};

export function Twin({ flow }: { flow: Flow }) {
  const { c, update, go, photos } = flow;
  const [rounds, setRounds] = useState<Round[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const outcome = c.twin?.outcome;

  // The client's own photos: from the phone's memory, or door 15 after a refresh.
  const [own, setOwn] = useState<Views | null>(photos ? { front: photos.front, left: photos.sideA, right: photos.sideB } : null);
  useEffect(() => {
    if (own || !c.ticket) return;
    myPhotos(c.ticket).then((p) => { if (p.front) setOwn({ front: p.front, left: p.side_a, right: p.side_b }); }).catch(() => { /* compare with the twin alone */ });
  }, [own, c.ticket]);

  const current = rounds[rounds.length - 1];
  const setCurrent = useCallback((patch: Partial<Round>) =>
    setRounds((rs) => rs.length ? [...rs.slice(0, -1), { ...rs[rs.length - 1], ...patch }] : rs), []);

  // Start (or pick up) a twin. Door 12 never pays twice: an existing twin is returned as it is.
  const here = useRef(true);
  // Set in the effect itself: in development React mounts twice, and a flag
  // only cleared on unmount would stay false and ignore every answer.
  useEffect(() => { here.current = true; return () => { here.current = false; }; }, []);
  const start = useCallback(async (attempt: number) => {
    if (!c.ticket) return;
    setProblem(null);
    setRounds((rs) => [...rs, { attempt, startedAt: Date.now(), status: "starting" }]);
    try {
      const r = await makeTwin(c.ticket);
      if (!here.current) return;
      // Even an already finished twin goes through door 13 once, for its picture links.
      setCurrent({ twinId: r.twin_id, attempt: r.attempt, status: "running" });
      update({ twin: { id: r.twin_id, attempt: r.attempt } });
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "twin_already_running") { setCurrent({ status: "running" }); return; }   // keep watching it
      if (code === "no_twin_attempts_left") { update({ twin: { id: c.twin?.id ?? "", attempt: 2, outcome: "use-own-photo" } }); return; }
      setCurrent({ status: "failed" }); setProblem(explain(e));
    }
  }, [c.ticket, c.twin?.id, setCurrent, update]);

  const started = useRef(false);
  useEffect(() => {
    if (started.current || outcome) return;
    started.current = true;
    start(1);
  }, [start, outcome]);

  // Ask door 13 every few seconds while the twin is being made.
  useEffect(() => {
    if (!c.ticket || !current || (current.status !== "running" && current.status !== "starting")) return;
    const tick = window.setInterval(async () => {
      setNow(Date.now());
      if (current.status === "starting") return;
      try {
        const s = await twinStatus(c.ticket!);
        if (!here.current) return;
        setCurrent({
          status: s.status === "none" ? "running" : s.status,
          twinId: s.twin_id ?? current.twinId,
          front: s.image_url ?? current.front, left: s.side_a_url, right: s.side_b_url,
        });
      } catch { /* a missed tick is fine; the next one asks again */ }
    }, POLL_MS);
    return () => window.clearInterval(tick);
  }, [c.ticket, current, setCurrent]);

  // The client answers.
  async function answer(yes: boolean) {
    if (!c.ticket || !current?.twinId) return;
    setBusy(true); setProblem(null);
    try {
      const r = await twinVerdict(c.ticket, current.twinId, yes ? "looks-like-me" : "not-quite");
      setCurrent({ answer: yes ? "yes" : "no" });
      if (r.next === "try-again") { start(current.attempt + 1); return; }
      update({ twin: { id: current.twinId, attempt: current.attempt, outcome: r.next } });
    } catch (e) {
      setProblem(explain(e));
    } finally {
      setBusy(false);
    }
  }

  // A twin that failed to make: the cut goes on their own photo.
  function useOwnPhoto() {
    update({ twin: { id: current?.twinId ?? c.twin?.id ?? "", attempt: current?.attempt ?? 1, outcome: "use-own-photo" } });
  }

  // Keep the newest message in view.
  useEffect(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); },
    [rounds.length, current?.status, current?.front, current?.answer, outcome]);

  const failed = current?.status === "failed" && !outcome;
  const asking = current?.status === "succeeded" && !current.answer && !outcome;

  return (
    <main className="chat">
      <div className="chat__top"><BackButton onClick={flow.back} /></div>

      <div className="chat__thread" aria-live="polite">
        {rounds.map((r, i) => (
          <RoundView key={i} r={r} first={i === 0} own={own} photo={photos?.front} now={now} />
        ))}

        {failed && (
          <Message photo={photos?.front} warn>
            <p>Your AI twin didn't come out right this time. We'll draw your new cut on your own photo instead.</p>
          </Message>
        )}
        {outcome === "use-twin" && (
          <Message photo={photos?.front} big><p className="chat__says">Great. Now tell me what cut you want.</p></Message>
        )}
        {outcome === "use-own-photo" && (
          <Message photo={photos?.front} big><p className="chat__says">No problem. We'll draw your new cut on your own photo instead.</p></Message>
        )}
      </div>

      <div className="chat__answers">
        <Problem message={problem} />
        {asking && (
          <div className="chat__yn">
            <button className="btn btn--glass-gold sheen" onClick={() => answer(true)} disabled={busy} aria-busy={busy}>Yes, that's me</button>
            <button className="btn btn--line" onClick={() => answer(false)} disabled={busy}>Not quite</button>
          </div>
        )}
        {failed && <button className="btn btn--glass-gold" onClick={useOwnPhoto}>Continue with my photo</button>}
        {outcome && (
          <>
            <button className="btn btn--glass-gold sheen" onClick={() => go("want")}>Continue</button>
            <p className="chat__fit" style={{ textAlign: "center" }}>Next: choose your cut</p>
          </>
        )}
      </div>
    </main>
  );
}

// One twin: the narration, the early front, the check, and the client's answer.
function RoundView({ r, first, own, photo, now }: { r: Round; first: boolean; own: Views | null; photo?: string | null; now: number }) {
  const sidesReady = r.status === "succeeded";
  const step = sidesReady ? STEPS.length : r.front ? 3 : Math.max(0, Math.min(2, Math.floor((now - r.startedAt) / STEP_MS)));
  const slow = !sidesReady && r.status !== "failed" && now - r.startedAt > SLOW_MS;
  const twin: Views | null = r.front ? { front: r.front, left: r.left, right: r.right } : null;
  const ready = usePreloaded(sidesReady && twin ? [twin.front, twin.left, twin.right, own?.front, own?.left, own?.right] : []);

  return (
    <>
      <Message photo={photo}>
        <p>{first
          ? "Now I'm making your AI twin: you, in good light, so your new cut can be drawn on a clear picture. This takes about two minutes."
          : "Thanks for saying. Making another one. About two minutes again."}</p>
        <ol className="twin__steps">
          {STEPS.map((s, i) => (
            <li key={s} className={i < step ? "is-done" : i === step && r.status !== "failed" ? "is-now" : undefined}>{s}</li>
          ))}
        </ol>
      </Message>

      {r.front && (
        <Message photo={photo} ghost>
          <p>Here's the front. Now your sides, so you can turn it.</p>
          <img className="twin__mini" src={r.front} alt="Your AI twin from the front" />
        </Message>
      )}
      {slow && <Message ghost warn><p>This is taking longer than usual. Hang on.</p></Message>}

      {sidesReady && twin && ready && (
        <>
          <Message photo={photo}><p>Done. Here's your AI twin next to your own photo.</p></Message>
          <div className="chat__msg twin__msg">
            <span className="chat__av is-ghost" aria-hidden />
            <div className="twin__card"><TwinCompare own={own} twin={twin} /></div>
          </div>
          <Message photo={photo} big><p className="chat__says">AI can make mistakes. Does this look like you?</p></Message>
        </>
      )}
      {sidesReady && !ready && <Typing photo={photo} />}
      {r.answer && <div className="chat__reply"><span>{r.answer === "yes" ? "Yes, that's me" : "Not quite"}</span></div>}
    </>
  );
}

function Message({ children, photo, ghost, big, warn }: {
  children: React.ReactNode; photo?: string | null; ghost?: boolean; big?: boolean; warn?: boolean;
}) {
  const style = photo ? { backgroundImage: `url(${photo})`, backgroundSize: "220%", backgroundPosition: "50% 10%" } : undefined;
  return (
    <div className="chat__msg">
      <span className={`chat__av${ghost ? " is-ghost" : ""}`} style={style} aria-hidden />
      <div className={`chat__bubble${big ? " is-big" : ""}${warn ? " is-warn" : ""}`}>{children}</div>
    </div>
  );
}

function Typing({ photo }: { photo?: string | null }) {
  return (
    <Message photo={photo}>
      <span className="chat__typing" role="status" aria-label="Getting your twin ready"><i /><i /><i /></span>
    </Message>
  );
}
