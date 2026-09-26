// The four quiz questions of the campaign flow, all on the W01 chassis:
//   W04 hair texture      (pictures)  → hair_texture
//   current length        (words)     → current_length  (feeds the length-gap check)
//   W02 style grid        (pictures)  → style_id
//   styling effort        (words)     → styling_effort   (feeds the effort check)
// Each answer is saved through door 3 the moment it is tapped, so nothing is
// lost if the client drops off and the shop can see how far people get.

import { useEffect, useState } from "react";
import { stylesFor, type Style } from "../api/catalogue";
import { saveAnswers } from "../api/doors";
import { QuestionScreen } from "../components/QuestionScreen";
import { Button, Problem, Row, Tile, useAutoAdvance } from "../components/ui";
import { CURRENT_LENGTHS, EFFORTS, TEXTURES } from "../data/vocabulary";
import { progress, SECTION, type StepId } from "../flow/steps";
import type { Flow } from "../flow/useConsultation";
import { explain } from "../lib/messages";

// Saves one answer, then moves on. If saving fails, the client stays put and is told why.
function useAnswer(flow: Flow) {
  const [problem, setProblem] = useState<string | null>(null);
  const later = useAutoAdvance();
  const answer = (patch: Record<string, string | null>, next: StepId) => {
    const { c, update, go } = flow;
    if (!c.ticket) return;
    const answers = { ...c.answers };
    for (const [k, v] of Object.entries(patch)) { if (v === null) delete answers[k]; else answers[k] = v; }
    update({ answers }); // show the selection straight away
    setProblem(null);
    saveAnswers(c.ticket, patch)
      .then(() => later(() => go(next)))
      .catch((e) => setProblem(explain(e)));
  };
  return { answer, problem };
}

export function TextureQuestion({ flow }: { flow: Flow }) {
  const { answer, problem } = useAnswer(flow);
  const chosen = flow.c.answers.hair_texture;
  return (
    <QuestionScreen
      question="Which looks most like your hair?"
      sub="Pick the closest. Your barber checks it at the chair."
      section={SECTION.texture!} progress={progress("texture")} onBack={flow.back}>
      <div className="grid grid--2">
        {TEXTURES.map((t) => (
          <Tile key={t.value} label={t.label} placeholder="Close-up" selected={chosen === t.value}
            onSelect={() => {
              // Changing texture can make the chosen cut unavailable, so it is cleared.
              const patch: Record<string, string | null> = { hair_texture: t.value };
              if (chosen && chosen !== t.value) patch.style_id = null;
              answer(patch, "length");
            }} />
        ))}
      </div>
      <Problem message={problem} />
    </QuestionScreen>
  );
}

export function LengthQuestion({ flow }: { flow: Flow }) {
  const { answer, problem } = useAnswer(flow);
  const chosen = flow.c.answers.current_length;
  return (
    <QuestionScreen
      question="How long is your hair right now?"
      section={SECTION.length!} progress={progress("length")} onBack={flow.back}>
      <div className="stack">
        {CURRENT_LENGTHS.map((o) => (
          <Row key={o.value} label={o.label} hint={o.hint} selected={chosen === o.value}
            onSelect={() => answer({ current_length: o.value }, "style")} />
        ))}
      </div>
      <Problem message={problem} />
    </QuestionScreen>
  );
}

const FILTERS = ["All", "Low", "Medium", "High"] as const;

export function StyleQuestion({ flow }: { flow: Flow }) {
  const { answer, problem } = useAnswer(flow);
  const texture = String(flow.c.answers.hair_texture ?? "");
  const [styles, setStyles] = useState<Style[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [picked, setPicked] = useState<string | null>((flow.c.answers.style_id as string) ?? null);
  const [loadProblem, setLoadProblem] = useState<string | null>(null);

  useEffect(() => {
    stylesFor(texture).then(setStyles).catch(() => setLoadProblem("The styles didn't load. Check your connection."));
  }, [texture]);

  const shown = (styles ?? []).filter((s) => filter === "All" || s.maintenance === filter);
  const pickedStyle = styles?.find((s) => s.id === picked);

  return (
    <QuestionScreen
      question="Pick your cut"
      sub={styles ? `${shown.length} styles${filter === "All" ? "" : ` · ${filter.toLowerCase()} upkeep`}` : "Loading styles…"}
      section={SECTION.style!} progress={progress("style")} onBack={flow.back}
      foot={pickedStyle && (
        <Button onClick={() => { flow.update({ styleName: pickedStyle.display }); answer({ style_id: pickedStyle.id }, "effort"); }}>
          Continue with {pickedStyle.display}
        </Button>
      )}>
      <div className="chips" role="tablist">
        {FILTERS.map((f) => (
          <button key={f} className="chip" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="grid grid--3">
        {shown.map((s) => (
          <Tile key={s.id} label={s.display} photo={s.photo} placeholder="Photo"
            maintenance={s.maintenance} selected={picked === s.id} onSelect={() => setPicked(s.id)} />
        ))}
      </div>
      <p className="note">Bars show daily upkeep: one is wash and go, three is daily styling.</p>
      <p className="note">Photos show the style. Your barber shapes it to your hair and face, so yours will be your own version.</p>
      <Problem message={loadProblem ?? problem} />
    </QuestionScreen>
  );
}

export function EffortQuestion({ flow }: { flow: Flow }) {
  const { answer, problem } = useAnswer(flow);
  const chosen = flow.c.answers.styling_effort;
  return (
    <QuestionScreen
      question="How long do you want to spend on it in the morning?"
      section={SECTION.effort!} progress={progress("effort")} onBack={flow.back}>
      <div className="stack">
        {EFFORTS.map((o) => (
          <Row key={o.value} label={o.label} hint={o.hint} selected={chosen === o.value}
            onSelect={() => answer({ styling_effort: o.value }, "wait")} />
        ))}
      </div>
      <Problem message={problem} />
    </QuestionScreen>
  );
}
