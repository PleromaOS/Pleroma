// W03 + W46 · What you want, as one conversation (route A, "Choose a famous
// style"; docs/specs/what-you-want.md, decision 13 in scan-path.md).
//
// It carries on the chat of the reading: "Now the fun part. Pick a cut you
// like, or build your own." The cuts that suit the client's hair arrive as a
// row of photos (W03, locked); after that, one question at a time with word
// answers and small drawings (W46, locked). Each answer shows up as the
// client's reply, and the next question follows. No typing dots: nothing is
// being worked out, so pretending would only slow the client down.
//
// Which questions appear is decided by data/wants.ts, from the answers so far
// and the confirmed reading: no fade, no fade questions; a clean-shaven client
// gets one quick beard question.
//
// Every answer is saved through door 3 the moment it is tapped. At the end,
// the renderer's own answers (sides, fade height, beard) are worked out from
// these and saved too, then the render starts on the next screen.
//
// Route B, "Build my own": the top first (keep, shorter or longer, the
// length, which way they wear it), then the same questions as route A. The
// render is drawn from the closest catalogue cut that suits their hair
// (data/wants.ts, closestCut); the brief keeps exactly what they built.

import { useEffect, useMemo, useState } from "react";
import { stylesFor, type Style } from "../api/catalogue";
import { saveAnswers } from "../api/doors";
import { BackButton, Problem } from "../components/ui";
import { Drawing, hasDrawing } from "../components/Drawing";
import { labelOf, TEXTURES } from "../data/vocabulary";
import { BARBERS_CHOICE, closestCut, nextQuestion, QUESTIONS, rendererAnswers, type Answer, type Known, type Question } from "../data/wants";
import type { Flow } from "../flow/useConsultation";
import { explain } from "../lib/messages";

const ROW = 8; // cuts shown in the row before "See all styles"

export function Want({ flow }: { flow: Flow }) {
  const { c, update, go, photos } = flow;
  const [styles, setStyles] = useState<Style[] | null>(null);
  const [all, setAll] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const texture = String(c.answers.hair_texture ?? "");

  useEffect(() => {
    stylesFor(texture).then(setStyles).catch(() => setProblem("The cuts didn't load. Check your connection."));
  }, [texture]);

  // What the room knows: the answers, and the reading as the client confirmed it.
  const known: Known = useMemo(() => {
    const f: Record<string, string> = {};
    for (const [k, i] of Object.entries(c.reading?.items ?? {})) if (i.value) f[k] = i.value;
    Object.assign(f, c.confirmed ?? {});
    return { a: c.answers, f };
  }, [c.answers, c.reading, c.confirmed]);

  const style = styles?.find((s) => s.id === c.answers.style_id);
  const answered = QUESTIONS.filter((q) => q.when(known) && q.key in c.answers);
  const building = c.answers.route === "build";
  const chosen = building || !!c.answers.style_id;   // a cut picked, or building their own
  const current = chosen ? nextQuestion(known) : null;
  const done = chosen && !current;

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, [answered.length, chosen, done]);

  // Saves one or more answers; shows them straight away, takes them back if saving fails.
  function save(patch: Record<string, string | null>, extra?: Partial<typeof c>) {
    if (!c.ticket) return;
    const before = c.answers;
    const answers = { ...c.answers };
    for (const [k, v] of Object.entries(patch)) { if (v === null) delete answers[k]; else answers[k] = v; }
    setProblem(null);
    update({ answers, ...extra });
    saveAnswers(c.ticket, patch).catch((e) => { setProblem(explain(e)); update({ answers: before }); });
  }

  // A new cut clears the old cut's detail.
  const pickStyle = (s: Style) => save({ route: "famous", style_id: s.id, style_option: null }, { styleName: s.display });
  const buildOwn = () => save({ route: "build", style_id: null, style_option: null }, { styleName: undefined });
  const answer = (q: Question, value: string) => save({ [q.key]: value });

  // Back: take back the last answer; before any, the cut; before that, leave.
  function back() {
    const last = answered[answered.length - 1];
    if (last) return save({ [last.key]: null });
    if (chosen) return save({ route: null, style_id: null, style_option: null }, { styleName: undefined });
    flow.back();
  }

  async function finish() {
    if (!c.ticket) return;
    const patch: Record<string, string | null> = rendererAnswers(known);
    if (building) {
      // Route B: the render is drawn from the closest cut that suits their hair.
      const id = closestCut(known, styles ?? []);
      if (!id) { setProblem("The cuts didn't load. Check your connection and try again."); return; }
      patch.style_id = id;
    }
    setBusy(true); setProblem(null);
    try {
      await saveAnswers(c.ticket, patch);
      const answers = { ...c.answers };
      for (const [k, v] of Object.entries(patch)) { if (v === null) delete answers[k]; else answers[k] = v; }
      // Route B shows as "Your own style" on the brief, never as the cut it was drawn from.
      update({ answers, ...(building ? { styleName: "Your own style" } : {}) });
      go("wait");
    } catch (e) {
      setProblem(explain(e));
    } finally {
      setBusy(false);
    }
  }

  const shown = styles ? (all ? styles : styles.slice(0, ROW)) : [];

  return (
    <main className="chat">
      <div className="chat__top"><BackButton onClick={back} /></div>

      <div className="chat__thread" aria-live="polite">
        <Bot photo={photos?.front}><p>Now the fun part.</p></Bot>
        <Bot photo={photos?.front} ghost big><p className="chat__says">Pick a cut you like, or build your own.</p></Bot>

        {!building && c.answers.style_id && (
          <>
            <Reply photo={style?.photo}>{c.styleName ?? style?.display}</Reply>
            <Bot photo={photos?.front}><p>Good choice.</p></Bot>
          </>
        )}
        {building && <Reply>Build my own style</Reply>}

        {answered.map((q) => (
          <div key={q.key} className="chat__pair">
            <Bot photo={photos?.front} big><p className="chat__q">{q.ask(known)}</p></Bot>
            <Reply>{labelFor(q, known, String(c.answers[q.key]))}</Reply>
          </div>
        ))}

        {current && <Bot key={current.key} photo={photos?.front} big><p className="chat__q">{current.ask(known)}</p></Bot>}
        {done && <Bot photo={photos?.front} big><p className="chat__q">That's everything. Next, we draw your new cut on you.</p></Bot>}
      </div>

      <div className="chat__answers">
        <Problem message={problem} />

        {!chosen && (
          <>
            {texture && <p className="chat__fit">These suit {labelOf(TEXTURES, texture).toLowerCase()} hair.</p>}
            {!styles && !problem && <p className="chat__fit">Loading the cuts…</p>}
            <div className={all ? "cuts cuts--all" : "cuts"} role="group" aria-label="Cuts">
              {shown.map((s) => (
                <button key={s.id} className="cut" onClick={() => pickStyle(s)}>
                  {s.photo ? <img src={s.photo} alt="" loading="lazy" /> : <span className="cut__ph">{s.display}</span>}
                  <span>{s.display}</span>
                </button>
              ))}
            </div>
            {styles && styles.length > ROW && !all && (
              <button className="chat__more" onClick={() => setAll(true)}>See all {styles.length} styles &rarr;</button>
            )}
            <button className="btn btn--glass chat__own" onClick={buildOwn}>Build my own, piece by piece</button>
          </>
        )}

        {current && <WordAnswers key={current.key} q={current} known={known} onPick={(v) => answer(current, v)} />}

        {done && (
          <button className="btn btn--glass-gold sheen" onClick={finish} disabled={busy} aria-busy={busy}>
            {busy ? <span className="spinner" aria-label="Saving" /> : "Draw my new cut"}
          </button>
        )}
      </div>
    </main>
  );
}

function labelFor(q: Question, k: Known, value: string) {
  if (value === BARBERS_CHOICE.value) return BARBERS_CHOICE.label;
  return q.answers(k).find((a) => a.value === value)?.label ?? value;
}

// W46: stacked cards with a drawing; Barber's choice last, as a plain line.
function WordAnswers({ q, known, onPick }: { q: Question; known: Known; onPick: (v: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const pick = (a: Answer) => { if (picked) return; setPicked(a.value); setTimeout(() => onPick(a.value), 220); };
  return (
    <div className="wa" role="group">
      {q.answers(known).map((a) => (
        <button key={a.value} className={`wa__card${hasDrawing(a.drawing) ? "" : " wa__card--plain"}`}
          aria-pressed={picked === a.value} onClick={() => pick(a)}>
          {hasDrawing(a.drawing) && <span className="wa__g"><Drawing name={a.drawing} /></span>}
          <b>{a.label}</b>
          {a.hint && <small>{a.hint}</small>}
        </button>
      ))}
      {q.barbersChoice && (
        <button className="wa__bc" aria-pressed={picked === BARBERS_CHOICE.value} onClick={() => pick(BARBERS_CHOICE)}>
          <b>{BARBERS_CHOICE.label}</b><small>{BARBERS_CHOICE.hint}</small>
        </button>
      )}
    </div>
  );
}

function Bot({ children, photo, ghost, big }: { children: React.ReactNode; photo?: string | null; ghost?: boolean; big?: boolean }) {
  return (
    <div className="chat__msg">
      <span className={`chat__av${ghost ? " is-ghost" : ""}`} aria-hidden
        style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: "220%", backgroundPosition: "50% 10%" } : undefined} />
      <div className={`chat__bubble${big ? " is-big" : ""}`}>{children}</div>
    </div>
  );
}

function Reply({ children, photo }: { children: React.ReactNode; photo?: string | null }) {
  return (
    <div className="chat__reply">
      <span>{photo && <i style={{ backgroundImage: `url(${photo})` }} aria-hidden />}{children}</span>
    </div>
  );
}
