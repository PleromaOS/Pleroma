// Test page for the photo checker: pleromaos.nl/consult/photo-check
//
// Takes the three photos (front, one side, the other side) exactly the way the
// real flow will, and shows every measurement next to its limit, live. It
// saves nothing and sends nothing: the photos stay on the phone.
//
// Its job is tuning. Try it in good light, in a dark room, with a window
// behind you, while moving, and note where the numbers land. Those numbers
// decide the final limits in lib/photoQuality.ts.

import { useCallback, useState } from "react";
import { checkStill, PhotoCapture } from "../components/PhotoCapture";
import { Button, Page } from "../components/ui";
import { fileToJpeg } from "../lib/photo";
import type { Shot } from "../lib/photoQuality";
import { sound } from "../lib/sound";

type Step = { key: "front" | "side1" | "side2"; shot: Shot; title: string; why: string };

// The "why" lines are the ones the real flow will use: each photo says what it is for.
const STEPS: Step[] = [
  { key: "front", shot: "front", title: "Face the camera",
    why: "This is the photo your new cut gets drawn on, so we need your face and hair clearly." },
  { key: "side1", shot: "side", title: "Now slowly turn your head to one side",
    why: "Your sides show your barber how your hair grows around the ear. Listen for the beeps: faster means closer." },
  { key: "side2", shot: "side", title: "Now slowly turn to the other side",
    why: "The other side, so nothing about your hair is a guess." },
];

export function PhotoCheckTest() {
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [firstSide, setFirstSide] = useState<1 | -1 | undefined>();
  const [noCamera, setNoCamera] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const step = STEPS[i];
  const done = i >= STEPS.length;

  const captured = useCallback((jpeg: string, turn: number) => {
    const key = STEPS[i].key;
    setPhotos((p) => ({ ...p, [key]: jpeg }));
    if (key === "side1") setFirstSide(turn >= 0 ? 1 : -1);
    setTimeout(() => setI((n) => n + 1), 700); // a beat to hear the "done" tone
  }, [i]);
  const lost = useCallback(() => setNoCamera(true), []);
  const wantSide = step?.key === "side2" && firstSide ? ((-firstSide) as 1 | -1) : undefined;

  async function fromLibrary(input: HTMLInputElement) {
    const file = input.files?.[0]; input.value = "";
    if (!file || !step) return;
    const jpeg = await fileToJpeg(file);
    const { verdict, turn } = await checkStill(jpeg, step.shot, wantSide);
    if (!verdict.ok) { setNote(`Not accepted: ${verdict.say}`); return; }
    setNote(null);
    captured(jpeg, turn);
  }

  if (!started) {
    return (
      <Page>
        <h1 className="display">Photo check · test</h1>
        <p className="lede">Three photos: front, then each side. The phone checks light, sharpness, framing and angle, and takes each photo by itself when everything is right.</p>
        <p className="caption">Nothing is saved or sent. Sound on for the side photos.</p>
        <Button onClick={() => { sound.unlock(); setStarted(true); }}>Start</Button>
      </Page>
    );
  }

  if (done) {
    return (
      <Page>
        <h1 className="display">All three passed</h1>
        <div className="three">
          {STEPS.map((s) => <figure key={s.key}><img src={photos[s.key]} alt={s.title} /><figcaption>{s.key}</figcaption></figure>)}
        </div>
        <Button onClick={() => { setPhotos({}); setFirstSide(undefined); setI(0); }}>Try again</Button>
      </Page>
    );
  }

  return (
    <Page>
      <div className="pips pips--3">{STEPS.map((s, n) => <i key={s.key} className={n <= i ? "on" : ""} />)}</div>
      <h1 className="display display--sm">{step.title}</h1>
      <p className="lede">{step.why}</p>
      {noCamera ? (
        <p className="problem">The camera or the photo checker isn't available here. Choose a photo instead; it goes through the same checks.</p>
      ) : (
        <PhotoCapture key={step.key} shot={step.shot} wantSide={wantSide} onCaptured={captured} onNoCamera={lost} showNumbers />
      )}
      {note && <p className="problem" role="alert">{note}</p>}
      <label className="link">
        Choose a photo instead
        <input className="visually-hidden" type="file" accept="image/*" onChange={(e) => fromLibrary(e.currentTarget)} />
      </label>
    </Page>
  );
}
