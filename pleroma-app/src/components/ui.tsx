// The small building blocks every screen is made of.
// Each one is built once and reused, so a fix here fixes it everywhere.

import { useState, type ReactNode } from "react";
import { MAINTENANCE_BARS } from "../data/vocabulary";

// A page that is not a question: landing, email, wait, reveal, handoff.
export function Page({ children, onBack }: { children: ReactNode; onBack?: () => void }) {
  return (
    <main className="page">
      {onBack && <BackButton onClick={onBack} />}
      {children}
    </main>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return <button className="back" aria-label="Back" onClick={onClick}>&#8592;</button>;
}

export function Button({ children, onClick, kind = "primary", disabled, busy }: {
  children: ReactNode; onClick?: () => void; kind?: "primary" | "secondary";
  disabled?: boolean; busy?: boolean;
}) {
  return (
    <button className={`btn btn--${kind}`} onClick={onClick} disabled={disabled || busy} aria-busy={busy}>
      {busy ? <span className="spinner" aria-label="Working" /> : children}
    </button>
  );
}

// A picture answer (W01 visual mode, W04, W02). Three signals on selection:
// gold border, gold check, gold label. A border alone vanishes on a photo.
export function Tile({ label, photo, placeholder, selected, onSelect, maintenance }: {
  label: string; photo?: string | null; placeholder: string; selected?: boolean;
  onSelect: () => void; maintenance?: string;
}) {
  return (
    <button className="tile" aria-pressed={!!selected} onClick={onSelect}>
      <span className="tile__frame">
        {photo ? <img src={photo} alt="" loading="lazy" /> : <span className="tile__ph">{placeholder}</span>}
        <span className="tile__check" aria-hidden>&#10003;</span>
      </span>
      <span className="tile__label">
        {label}
        {maintenance && <Meter level={maintenance} />}
      </span>
    </button>
  );
}

// W02: upkeep as a three-step meter. One bar is wash and go, three is daily styling.
export function Meter({ level }: { level: string }) {
  const n = MAINTENANCE_BARS[level] ?? 0;
  return (
    <span className="meter" aria-label={`${level} upkeep`}>
      {[1, 2, 3].map((i) => <i key={i} className={i <= n ? "on" : ""} />)}
    </span>
  );
}

// A text answer (W01 text mode), for questions with nothing to picture.
export function Row({ label, hint, selected, onSelect }: {
  label: string; hint?: string; selected?: boolean; onSelect: () => void;
}) {
  return (
    <button className="row" aria-pressed={!!selected} onClick={onSelect}>
      <span className="row__label">{label}</span>
      {hint && <span className="row__hint">{hint}</span>}
    </button>
  );
}

// W33: a fixed GUARANTEE lozenge locked to a changing value.
export function GuaranteeBadge({ value, large }: { value: string; large?: boolean }) {
  return (
    <span className={`badge ${large ? "badge--lg" : ""}`}>
      <span className="badge__name">Guarantee</span>
      <span className="badge__value">{value}</span>
    </span>
  );
}

// "What happens to my email?" style reassurance: closed by default, one tap opens it.
export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="disclosure">
      <button className="disclosure__head" aria-expanded={open} onClick={() => setOpen(!open)}>
        {title}<span aria-hidden>{open ? "–" : "+"}</span>
      </button>
      {open && <div className="disclosure__body">{children}</div>}
    </div>
  );
}

export function Problem({ message }: { message: string | null }) {
  return message ? <p className="problem" role="alert">{message}</p> : null;
}

// Tapping an answer selects it and moves on after 220 ms (the motion rule), so
// the client sees their choice register before the screen changes.
export function useAutoAdvance() {
  return (fn: () => void) => setTimeout(fn, 220);
}
