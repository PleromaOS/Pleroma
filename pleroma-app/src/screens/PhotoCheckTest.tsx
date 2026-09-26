// Test page for the face scan: pleromaos.nl/consult/photo-check
// (add ?debug to see every measurement next to its limit, for tuning).
//
// Exactly what the real flow will use: an intro that shows the movement,
// then one smooth scan for three photos. It saves nothing and sends nothing.

import { useCallback, useState } from "react";
import { FaceScan, type ScanPhotos } from "../components/FaceScan";
import { Button, Page } from "../components/ui";
import { HeadTurning } from "../components/HeadTurning";
import { PhotoLibrary } from "../components/PhotoLibrary";
import { sound } from "../lib/sound";

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

  if (stage === "library") return <PhotoLibrary onDone={done} />;

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
