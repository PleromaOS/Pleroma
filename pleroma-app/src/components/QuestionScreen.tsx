// W01 · the question screen chassis (locked 2026-09-22, variant 2c).
//
// Two zones: the question owns the page; the answers ride in a raised sheet
// whose top edge carries the section name and the progress hairline.
// The sheet is raised by surface colour and a 1px border, never a shadow;
// in light mode that border is doing the work, so it must stay.

import type { ReactNode } from "react";
import { BackButton } from "./ui";

export function QuestionScreen({ question, sub, section, progress, onBack, children, foot }: {
  question: string;
  sub?: string;
  section: string;
  progress: number; // 0..1
  onBack?: () => void;
  children: ReactNode;
  foot?: ReactNode;
}) {
  return (
    <main className="q">
      <div className="q__top">
        {onBack && <BackButton onClick={onBack} />}
        <h1 className="q__question">{question}</h1>
        {sub && <p className="q__sub">{sub}</p>}
      </div>
      <section className="q__sheet">
        <div className="q__rail">
          <span className="q__section">{section}</span>
          <span className="q__track"><span className="q__fill" style={{ width: `${Math.round(progress * 100)}%` }} /></span>
        </div>
        {children}
        {foot && <div className="q__foot">{foot}</div>}
      </section>
    </main>
  );
}
