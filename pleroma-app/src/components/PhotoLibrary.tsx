// The photo-library route for the scan: for phones where the camera can't be
// used, or clients who'd rather pick photos. Each photo goes through exactly
// the same checks as the live scan, so the library is never a way around them.

import { useState } from "react";
import type { ScanPhotos } from "./FaceScan";
import { Page } from "./ui";
import { fileToJpeg } from "../lib/photo";
import { sound } from "../lib/sound";
import { checkStill } from "../lib/stillCheck";

// No camera (or the client prefers it): three photos from the library, each
// through the same checks as the scan.
export function PhotoLibrary({ onDone, onBack }: { onDone: (p: ScanPhotos) => void; onBack?: () => void }) {
  const steps = [
    { key: "front" as const, shot: "front" as const, label: "A photo looking straight at the camera" },
    { key: "sideA" as const, shot: "side" as const, label: "A photo of one side of your head" },
    { key: "sideB" as const, shot: "side" as const, label: "A photo of the other side" },
  ];
  const [i, setI] = useState(0);
  const [got, setGot] = useState<Partial<ScanPhotos>>({});
  const [firstTurn, setFirstTurn] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const step = steps[i];

  async function pick(input: HTMLInputElement) {
    const file = input.files?.[0]; input.value = "";
    if (!file) return;
    setBusy(true); setNote(null);
    try {
      const jpeg = await fileToJpeg(file);
      const want = step.key === "sideB" && firstTurn ? ((firstTurn > 0 ? -1 : 1) as 1 | -1) : undefined;
      const { verdict, turn } = await checkStill(jpeg, step.shot, want);
      if (!verdict.ok) { setNote(verdict.say); return; }
      const next = { ...got, [step.key]: jpeg };
      setGot(next);
      if (step.key === "sideA") setFirstTurn(turn);
      if (i === steps.length - 1) { sound.chime(); onDone(next as ScanPhotos); } else setI(i + 1);
    } catch {
      setNote("That photo couldn't be checked. Try another one.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page onBack={onBack}>
      <div className="pips pips--3">{steps.map((s, n) => <i key={s.key} className={n <= i ? "on" : ""} />)}</div>
      <h1 className="display display--sm">{step.label}</h1>
      <p className="lede">Face and hair clearly visible, in good light. Each photo is checked the same way as the scan.</p>
      {note && <p className="problem" role="alert">{note}</p>}
      <label className="btn btn--primary btn--label" aria-busy={busy}>
        {busy ? "Checking…" : "Choose photo"}
        <input className="visually-hidden" type="file" accept="image/*" disabled={busy} onChange={(e) => pick(e.currentTarget)} />
      </label>
    </Page>
  );
}
