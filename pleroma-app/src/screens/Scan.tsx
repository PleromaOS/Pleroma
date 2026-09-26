// Step 1 of the consultation (decided 2026-09-26, order "B: scan first").
//
//   intro   what the three photos are for, and the consent switch.
//           The camera cannot open until the switch is on, so no photo can
//           exist without the client's agreement.
//   scan    the Face ID-style scan (FaceScan), or the photo library.
//   review  the three photos, "Looks good" or "Scan again".
//
// What it deliberately does NOT do: send anything. The photos stay in the
// phone's memory until the client gives their email; the email screen then
// records the consent and only after that do photos leave the phone.
// Cost of that choice: a page refresh before then clears the photos, and the
// client scans again (about 15 seconds).

import { useCallback, useState } from "react";
import { FaceScan, type ScanPhotos } from "../components/FaceScan";
import { HeadTurning } from "../components/HeadTurning";
import { PhotoLibrary } from "../components/PhotoLibrary";
import { Button, Page } from "../components/ui";
import { IS_DEMO } from "../config";
import type { Flow } from "../flow/useConsultation";
import { samplePhoto } from "../lib/photo";
import { sound } from "../lib/sound";

export function Scan({ flow }: { flow: Flow }) {
  const { c, update, go, back, photos, setPhotos } = flow;
  const [agreed, setAgreed] = useState(!!c.consentTappedAt);
  const [stage, setStage] = useState<"intro" | "scan" | "library" | "review">(photos ? "review" : "intro");

  const done = useCallback((p: ScanPhotos) => { setPhotos(p); setStage("review"); }, [setPhotos]);
  const noCamera = useCallback(() => setStage("library"), []);

  function agree(on: boolean) {
    setAgreed(on);
    update({ consentTappedAt: on ? new Date().toISOString() : undefined });
  }

  // Where to go next: a client who already gave their email (they are
  // rescanning after a refresh or a failed render) skips what they've done.
  function next() {
    if (!c.emailGiven) return go("email");
    update({ renderId: undefined });
    go(c.answers.styling_effort ? "wait" : "texture");
  }

  if (stage === "scan") {
    return (
      <main className="scan-page">
        <FaceScan onDone={done} onNoCamera={noCamera} />
        <button className="link" onClick={() => setStage("library")}>Use photos from my library instead</button>
      </main>
    );
  }

  if (stage === "library") return <PhotoLibrary onDone={done} onBack={() => setStage("intro")} />;

  if (stage === "review" && photos) {
    return (
      <Page>
        <h1 className="display display--sm">Your three photos</h1>
        <div className="three">
          {(["front", "sideA", "sideB"] as const).map((k) => (
            <figure key={k}><img src={photos[k]} alt="" /><figcaption>{k === "front" ? "Front" : "Side"}</figcaption></figure>
          ))}
        </div>
        <p className="caption">They stay on your phone until you continue.</p>
        <Button onClick={next}>Looks good</Button>
        <Button kind="secondary" onClick={() => { setPhotos(null); setStage("intro"); }}>Scan again</Button>
      </Page>
    );
  }

  return (
    <Page onBack={back}>
      <div className="intro">
        <HeadTurning />
        <h1 className="display">Three quick photos</h1>
      </div>
      <ul className="why">
        <li><strong>Front</strong><span>Your new cut is drawn on your own face, with your own hair colour and texture.</span></li>
        <li><strong>Both sides</strong><span>Your barber sees your sides, fade and length from every angle before you sit down.</span></li>
      </ul>
      <p className="caption">About 15 seconds. Hold the phone at a relaxed arm's length. Sound on helps.</p>

      <label className="consent">
        <input type="checkbox" role="switch" checked={agreed} onChange={(e) => agree(e.target.checked)} />
        <span className="consent__switch" aria-hidden />
        <span>
          <strong>I agree to my photos being used for my consultation</strong>
          <span className="consent__small">
            Only for your render and your barber's brief. They stay on your phone until you continue. You can have them deleted at any time.
          </span>
        </span>
      </label>

      <Button disabled={!agreed} onClick={() => { sound.unlock(); setStage("scan"); }}>
        {agreed ? "Start scan" : "Turn on the switch to start"}
      </Button>
      {IS_DEMO && (
        <Button kind="secondary" disabled={!agreed} onClick={() => { const p = samplePhoto(); done({ front: p, sideA: p, sideB: p }); }}>
          Demo: use sample photos
        </Button>
      )}
    </Page>
  );
}
