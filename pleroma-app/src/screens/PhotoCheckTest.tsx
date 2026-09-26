// Test page for the face scan: pleromaos.nl/consult/photo-check
// (add ?debug to see every measurement next to its limit, for tuning).
//
// Exactly what the real flow will use: an intro that shows the movement,
// then one smooth scan for three photos. It saves nothing and sends nothing.

import { useCallback, useState } from "react";
import { FaceScan, type ScanPhotos } from "../components/FaceScan";
import { Button, Page } from "../components/ui";
import { fileToJpeg } from "../lib/photo";
import { sound } from "../lib/sound";
import { checkStill } from "../lib/stillCheck";

const DEBUG = new URLSearchParams(window.location.search).has("debug");

export function PhotoCheckTest() {
  const [stage, setStage] = useState<"intro" | "scan" | "library" | "done">("intro");
  const [photos, setPhotos] = useState<ScanPhotos | null>(null);

  const done = useCallback((p: ScanPhotos) => { setPhotos(p); setStage("done"); }, []);
  const noCamera = useCallback(() => setStage("library"), []);

  if (stage === "intro") {
    return (
      <Page>
        <div className="intro">
          <HeadTurning />
          <h1 className="display">One quick scan</h1>
          <p className="lede lede--center">
            Look straight at your phone, then slowly turn your head one way and then the other.
            Your barber sees your hair from every side, and your new cut is drawn on your own face.
          </p>
          <p className="caption">Hold the phone at a relaxed arm's length. Sound on helps.</p>
        </div>
        <Button onClick={() => { sound.unlock(); setStage("scan"); }}>Start scan</Button>
      </Page>
    );
  }

  if (stage === "scan") {
    return (
      <main className="scan-page">
        <FaceScan onDone={done} onNoCamera={noCamera} debug={DEBUG} />
        <button className="link" onClick={() => setStage("library")}>Use photos from my library instead</button>
      </main>
    );
  }

  if (stage === "library") return <Library onDone={done} />;

  return (
    <Page>
      <h1 className="display">Scan complete</h1>
      <div className="three">
        {photos && (["front", "sideA", "sideB"] as const).map((k) => (
          <figure key={k}><img src={photos[k]} alt="" /><figcaption>{k === "front" ? "Front" : "Side"}</figcaption></figure>
        ))}
      </div>
      <Button onClick={() => { setPhotos(null); setStage("intro"); }}>Scan again</Button>
    </Page>
  );
}

// The movement, shown before the camera opens (like Face ID's intro): a head
// that looks straight, turns one way, then the other, while the ring fills.
function HeadTurning() {
  return (
    <svg className="head" viewBox="0 0 120 120" aria-hidden>
      <g className="head__ring">
        {Array.from({ length: 48 }, (_, i) => {
          const a = ((i / 48) * 360 - 90) * (Math.PI / 180);
          return <line key={i} x1={60 + 50 * Math.cos(a)} y1={60 + 50 * Math.sin(a)} x2={60 + 55 * Math.cos(a)} y2={60 + 55 * Math.sin(a)} style={{ animationDelay: `${(i / 48) * 3}s` }} />;
        })}
      </g>
      <g className="head__face">
        <ellipse cx="60" cy="62" rx="24" ry="30" className="head__skin" />
        <path d="M36 52 Q38 28 60 28 Q82 28 84 52 Q78 40 60 40 Q42 40 36 52Z" className="head__hair" />
        <g className="head__features">
          <circle cx="51" cy="60" r="2" /><circle cx="69" cy="60" r="2" />
          <path d="M60 62 L57 72 L61 72" />
        </g>
      </g>
    </svg>
  );
}

// No camera (or the client prefers it): three photos from the library, each
// through the same checks as the scan.
function Library({ onDone }: { onDone: (p: ScanPhotos) => void }) {
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
    <Page>
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
