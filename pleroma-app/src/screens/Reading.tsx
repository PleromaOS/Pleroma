// W41 + W42 · Reading your hair, then one finding at a time (both locked
// 2026-09-27: W41 variant 3 "narrated", W42 variant 4 "conversation").
//
// What happens here:
//   1. On arrival the app asks door 10 to read the three stored photos
//      (about 7 seconds). Meanwhile the screen narrates, like a text chat:
//      "Great photos. Thanks." → "Looking at the front…" → "Checking both
//      sides…" → "Almost there…", with typing dots in between.
//      Honest note: the reading comes back once, at the end. The narration
//      runs on a timer so the wait feels alive; only the findings are real.
//   2. Each finding then arrives as a message beside a zoomed crop of the
//      client's own photo, e.g. "Your hair looks wavy", with "Yes, that's
//      right" and "Not quite". "Not quite" opens that finding's answers on the
//      same screen, the AI's reading marked "our reading".
//      A finding the AI is NOT sure about is asked as a plain question instead
//      (scan-path.md decision 3). Colour is always asked for very dark hair.
//   3. Every answer goes to door 11 the moment it is tapped, so the reading's
//      accuracy can be measured and nothing is lost if the client leaves.
//      At the end, texture and current length are also saved as normal quiz
//      answers (door 3): the scan path does not ask those questions again.
//
// What it does NOT do: it never shows the AI's confidence numbers, and never
// words a finding as a diagnosis (see data/findings.ts).
// If the photos can't be read (too dark, hair covered), the client can answer
// the questions instead or scan again. If the AI is down, they can retry.

import { useCallback, useEffect, useRef, useState } from "react";
import { confirmFinding, DoorError, readHair, saveAnswers, type FindingItem } from "../api/doors";
import { BackButton, Problem } from "../components/ui";
import { applies, FINDINGS, ZOOM, type FindingText } from "../data/findings";
import type { Flow } from "../flow/useConsultation";
import { explain } from "../lib/messages";

const NARRATION = ["Great photos. Thanks.", "Looking at the front…", "Checking both sides…", "Almost there…"];
const NARRATION_MS = [0, 900, 2500, 4100];
const NARRATION_END_MS = 5600;   // the first finding never lands before this
const SLOW_MS = 20_000;          // "taking a little longer" (W41 slow state)
const RETRY_RUNNING_MS = 3000;   // the reading is already running: ask again after this

type Phase = "reading" | "unreadable" | "failed" | "findings" | "done";

export function Reading({ flow }: { flow: Flow }) {
  const { c, update, go, photos } = flow;
  const [shown, setShown] = useState(c.reading ? NARRATION.length : 0); // narration lines on screen
  const [narrated, setNarrated] = useState(!!c.reading);               // a refresh skips the narration
  const [slow, setSlow] = useState(false);
  const [phase, setPhase] = useState<Phase>(c.reading ? "findings" : "reading");
  const [problem, setProblem] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const asked = useRef(-1);

  // 1 · Narration on a timer.
  useEffect(() => {
    if (narrated) return;
    const t = NARRATION_MS.map((ms, i) => setTimeout(() => setShown(i + 1), ms));
    t.push(setTimeout(() => setNarrated(true), NARRATION_END_MS));
    t.push(setTimeout(() => setSlow(true), SLOW_MS));
    return () => t.forEach(clearTimeout);
  }, [narrated]);

  // Bad news waits for the narration to finish too, so it never cuts it off.
  const arrived = useRef(Date.now());
  const afterNarration = (fn: () => void) =>
    setTimeout(fn, narrated ? 0 : Math.max(0, NARRATION_END_MS - (Date.now() - arrived.current)));

  // Left the room: late answers are ignored.
  const here = useRef(true);
  useEffect(() => { here.current = true; return () => { here.current = false; }; }, []);

  // 1 · The real reading, once per attempt.
  useEffect(() => {
    if (c.reading || !c.ticket || asked.current === attempt) return;
    asked.current = attempt;
    const ask = () => readHair(c.ticket!).then((r) => {
      if (!here.current) return;
      if (r.status === "unreadable" || !r.findings.readable) { afterNarration(() => setPhase("unreadable")); return; }
      update({ reading: { id: r.reading_id, items: r.findings.items }, confirmed: {} });
    }).catch((e) => {
      if (!here.current) return;
      // Another tab (or a double tap) started it already: wait and ask again.
      if (e instanceof DoorError && e.code === "reading_already_running") { setTimeout(ask, RETRY_RUNNING_MS); return; }
      afterNarration(() => { setProblem(explain(e)); setPhase("failed"); });
    });
    ask();
  }, [c.reading, c.ticket, attempt, update]);

  // Findings start once the reading is back AND the narration has finished.
  useEffect(() => {
    if (c.reading && narrated && phase === "reading") setPhase("findings");
  }, [c.reading, narrated, phase]);

  const retry = () => { setProblem(null); setPhase("reading"); setSlow(false); setAttempt((a) => a + 1); };
  const rescan = () => { update({ reading: undefined, confirmed: undefined, photosSaved: false }); go("scan"); };
  const questionsInstead = () => go("texture");

  // 2 · Which findings to walk through, and where we are.
  const items = c.reading?.items ?? {};
  const confirmed = c.confirmed ?? {};
  const queue = FINDINGS.filter((f) => items[f.key]?.value !== undefined && applies(f.key, { ...answersFromItems(items), ...confirmed }));
  const current = queue.find((f) => !(f.key in confirmed));
  const answeredCount = queue.filter((f) => f.key in confirmed).length;

  const answer = useCallback((f: FindingText, value: string) => {
    if (!c.ticket || !c.reading) return;
    setProblem(null);
    const next = { ...(c.confirmed ?? {}), [f.key]: value };
    update({ confirmed: next });
    confirmFinding(c.ticket, c.reading.id, f.key, value).catch((e) => {
      // Not saved: take the answer back so the client can tap it again.
      setProblem(explain(e));
      const undo = { ...next }; delete undo[f.key];
      update({ confirmed: undo });
    });
  }, [c.ticket, c.reading, c.confirmed, update]);

  // 3 · All answered: save texture and length as quiz answers, then show "All checked".
  const [saving, setSaving] = useState(false);
  async function finish() {
    if (!c.ticket) return;
    const patch: Record<string, string | null> = {};
    if (confirmed.texture) patch.hair_texture = confirmed.texture;
    if (confirmed.length_top) patch.current_length = confirmed.length_top;
    // A different texture can make an already chosen cut unavailable.
    if (c.answers.style_id && c.answers.hair_texture && c.answers.hair_texture !== confirmed.texture) patch.style_id = null;
    setSaving(true); setProblem(null);
    try {
      await saveAnswers(c.ticket, patch);
      const answers = { ...c.answers };
      for (const [k, v] of Object.entries(patch)) { if (v === null) delete answers[k]; else answers[k] = v; }
      update({ answers, findingsDone: true });
      go("style");
    } catch (e) {
      setProblem(explain(e));
    } finally {
      setSaving(false);
    }
  }

  // Back: un-answer the last finding; before the first one, leave the room.
  function back() {
    const last = [...queue].reverse().find((f) => f.key in confirmed);
    if (!last || phase !== "findings") return flow.back();
    const undo = { ...confirmed }; delete undo[last.key];
    update({ confirmed: undo });
  }

  // Each new finding starts at the top (the answer list can be long).
  useEffect(() => { if (answeredCount > 0) window.scrollTo(0, 0); }, [answeredCount]);

  const allDone = phase === "findings" && c.reading && !current;
  const showNarration = phase !== "findings" || answeredCount === 0;

  return (
    <main className="chat">
      <div className="chat__top">
        <BackButton onClick={back} />
        {phase === "findings" && queue.length > 0 && !allDone && (
          <p className="eyebrow" aria-live="polite">{Math.min(answeredCount + 1, queue.length)} / {queue.length}</p>
        )}
      </div>

      <div className="chat__thread" aria-live="polite">
        {showNarration && NARRATION.slice(0, shown).map((line, i) => (
          <Message key={`n${i}`} photo={photos?.front} ghost={i > 0} small={i > 0}>
            <p>{line}</p>
          </Message>
        ))}
        {phase === "reading" && slow && (
          <Message ghost warn><p>This is taking a little longer than usual. Hang on.</p></Message>
        )}
        {phase === "reading" && <Typing photo={photos?.front} />}

        {phase === "unreadable" && (
          <Message photo={photos?.front} warn>
            <p>We couldn't read your photos clearly. Answer a few quick questions instead, or scan again in better light.</p>
          </Message>
        )}
        {phase === "failed" && (
          <Message photo={photos?.front} warn><p>{problem}</p></Message>
        )}

        {phase === "findings" && current && (
          <Finding key={current.key} f={current} item={items[current.key]} photos={photos} onAnswer={answer} />
        )}
        {allDone && (
          <Message photo={photos?.front} big>
            <p className="chat__label">All checked</p>
            <p className="chat__says">Thanks. Your barber will see <em>exactly this</em></p>
          </Message>
        )}
      </div>

      <div className="chat__answers">
        {phase === "findings" && <Problem message={problem} />}
        {phase === "unreadable" && (
          <>
            <button className="btn btn--glass-gold" onClick={questionsInstead}>Answer questions</button>
            <button className="btn btn--line" onClick={rescan}>Scan again</button>
          </>
        )}
        {phase === "failed" && (
          <>
            <button className="btn btn--glass-gold" onClick={retry}>Try again</button>
            <button className="btn btn--line" onClick={questionsInstead}>Answer questions instead</button>
          </>
        )}
        {allDone && (
          <button className="btn btn--glass-gold" onClick={finish} disabled={saving} aria-busy={saving}>
            {saving ? <span className="spinner" aria-label="Saving" /> : "Next: choose your cut"}
          </button>
        )}
      </div>
    </main>
  );
}

// The texture and length the AI read, used only to decide which findings apply
// before the client has confirmed them (a beard question needs a beard).
function answersFromItems(items: Record<string, FindingItem>): Record<string, string> {
  return Object.fromEntries(Object.entries(items).filter(([, i]) => i.value).map(([k, i]) => [k, i.value as string]));
}

// One finding: a statement with Yes / Not quite, or a question when the AI was unsure.
function Finding({ f, item, photos, onAnswer }: {
  f: FindingText; item: FindingItem; photos: Flow["photos"];
  onAnswer: (f: FindingText, value: string) => void;
}) {
  const [choosing, setChoosing] = useState(item.ask);
  const [picked, setPicked] = useState<string | null>(null);
  const reading = f.values.find((v) => v.value === item.value);
  const ourReading = item.value && item.value !== "not-visible" ? item.value : null;
  const zoom = ZOOM[f.zoom];
  const photo = photos ? photos[zoom.photo] : null;

  // The tap registers (gold) for 220 ms before the next finding arrives (motion rule).
  const pick = (value: string) => { setPicked(value); setTimeout(() => onAnswer(f, value), 220); };

  return (
    <>
      <Message photo={photo} zoom={zoom} big>
        <p className="chat__label">{f.topic}</p>
        {item.ask || !reading
          ? <p className="chat__says">{f.question}</p>
          : <p className="chat__says" dangerouslySetInnerHTML={{ __html: reading.says }} />}
      </Message>

      {choosing ? (
        <div className="chat__options">
          {!item.ask && <p className="eyebrow eyebrow--muted">Which is closer?</p>}
          {f.values.map((v) => (
            <button key={v.value} className={`chat__option${v.value === ourReading ? " is-ours" : ""}`}
              aria-pressed={picked === v.value} onClick={() => pick(v.value)}>
              {v.label}
              {v.value === ourReading && <small>our reading</small>}
            </button>
          ))}
        </div>
      ) : (
        <div className="chat__yn">
          <button className="btn btn--glass-gold sheen" aria-pressed={picked !== null} onClick={() => pick(item.value!)}>Yes, that's right</button>
          <button className="btn btn--line" onClick={() => setChoosing(true)}>Not quite</button>
        </div>
      )}
    </>
  );
}

function Message({ children, photo, zoom, ghost, small, big, warn }: {
  children: React.ReactNode; photo?: string | null; zoom?: { size: string; pos: string };
  ghost?: boolean; small?: boolean; big?: boolean; warn?: boolean;
}) {
  const style = photo
    ? { backgroundImage: `url(${photo})`, backgroundSize: zoom?.size ?? "220%", backgroundPosition: zoom?.pos ?? "50% 10%" }
    : undefined;
  return (
    <div className="chat__msg">
      <span className={`chat__av${ghost ? " is-ghost" : ""}${big ? " is-big" : ""}`} style={style} aria-hidden />
      <div className={`chat__bubble${small ? " is-small" : ""}${big ? " is-big" : ""}${warn ? " is-warn" : ""}`}>{children}</div>
    </div>
  );
}

function Typing({ photo }: { photo?: string | null }) {
  return (
    <Message photo={photo}>
      <span className="chat__typing" role="status" aria-label="Reading your photos"><i /><i /><i /></span>
    </Message>
  );
}
