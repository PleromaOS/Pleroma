// W27 · Selfie capture + consent (variant 1b, "consent switch on the shutter").
//
// The camera only wakes once the consent switch is on, and the shutter only
// works once the camera is on, so no photo can exist without consent.
// On "Use this photo": door 4 records the consent (with the wording version),
// then door 5 starts the render with the photo.
//
// If the camera can't be used (no permission, an in-app browser that blocks
// it, or it simply never starts), the client picks a photo from their library
// instead: same consent, same next step.
//
// Fixed 2026-09-26 after Bryan's phone test:
//  - Some browsers never answer the camera request at all (no yes, no no), so
//    the screen waited forever on an empty oval. It now gives up after 6 seconds
//    and offers the photo library.
//  - "Choose a photo" was a button that clicked a hidden file picker from code.
//    Phones refuse that inside some browsers. It is now a real label wrapped
//    around the picker, which the phone treats as the client tapping it directly.

import { useEffect, useRef, useState } from "react";
import { giveConsent, requestRender } from "../api/doors";
import { IS_DEMO, PREVIEW_BUILD, SELFIE_CONSENT_VERSION } from "../config";
import { Button, Page, Problem } from "../components/ui";
import type { Flow } from "../flow/useConsultation";
import { explain } from "../lib/messages";
import { drawToJpeg, fileToJpeg, samplePhoto } from "../lib/photo";

const CAMERA_TIMEOUT_MS = 6000;

export function Selfie({ flow }: { flow: Flow }) {
  const { c, update, go, back, setSelfie } = flow;
  const [agreed, setAgreed] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  // The shareable preview page cannot use a camera at all, so it never tries.
  const [cameraFailed, setCameraFailed] = useState(PREVIEW_BUILD || !navigator.mediaDevices?.getUserMedia);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);

  // Camera on only while consent is on and no photo is being reviewed.
  useEffect(() => {
    if (!agreed || photo || cameraFailed) return;
    let cancelled = false;
    const giveUp = setTimeout(() => { if (!cancelled) setCameraFailed(true); }, CAMERA_TIMEOUT_MS);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        clearTimeout(giveUp);
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        stream.current = s;
        if (video.current) {
          video.current.srcObject = s;
          video.current.play().catch(() => { /* autoplay attribute covers it */ });
        }
        setLive(true);
      })
      .catch(() => { clearTimeout(giveUp); if (!cancelled) setCameraFailed(true); });
    return () => {
      cancelled = true;
      clearTimeout(giveUp);
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      setLive(false);
    };
  }, [agreed, photo, cameraFailed]);

  function shoot() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    setPhoto(drawToJpeg(v, v.videoWidth, v.videoHeight));
  }

  async function fromLibrary(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = ""; // so choosing the same photo again still counts as a choice
    if (!file) return;
    try {
      setPhoto(await fileToJpeg(file));
    } catch {
      setProblem("That photo couldn't be opened. Try another one.");
    }
  }

  async function usePhoto() {
    if (!photo || !c.ticket) return;
    setBusy(true); setProblem(null);
    try {
      await giveConsent(c.ticket, "render_selfie", SELFIE_CONSENT_VERSION);
      const r = await requestRender(c.ticket, photo);
      setSelfie(photo);
      update({ renderId: r.render_id, rendersLeft: r.renders_left, imageUrl: undefined, eligible: undefined });
      go("wait");
    } catch (e) {
      setProblem(explain(e));
    } finally {
      setBusy(false);
    }
  }

  // A real <label> around the file input: tapping it is a direct tap on the
  // picker, which every phone browser allows.
  const LibraryPicker = ({ primary }: { primary: boolean }) => (
    <label className={primary ? "btn btn--primary btn--label" : "link"} aria-disabled={!agreed}>
      {primary ? "Choose a photo" : "Use a photo from my library"}
      <input className="visually-hidden" type="file" accept="image/*" disabled={!agreed}
        onChange={(e) => fromLibrary(e.currentTarget)} />
    </label>
  );

  return (
    <Page onBack={back}>
      <p className="lede">Your photo is how the cut gets drawn on <strong>your</strong> face, not a model's.</p>

      <div className="camera">
        {photo ? (
          <img src={photo} alt="Your photo" />
        ) : agreed && !cameraFailed ? (
          <>
            <video ref={video} autoPlay playsInline muted />
            {!live && <span className="camera__hint">Starting the camera…</span>}
          </>
        ) : (
          <span className="camera__hint">
            {!agreed ? "Turn on the switch to use the camera"
              : PREVIEW_BUILD ? "The camera doesn't work in this preview. Choose a photo."
              : "The camera isn't available. Choose a photo instead."}
          </span>
        )}
        {!photo && <span className="camera__oval" aria-hidden />}
      </div>

      {!photo && (
        <label className="consent">
          <input type="checkbox" role="switch" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span className="consent__switch" aria-hidden />
          <span>
            <strong>I agree to my photo being used for my render</strong>
            <span className="consent__small">Only for this. Never shared. You can have it deleted at any time.</span>
          </span>
        </label>
      )}

      <Problem message={problem} />

      {photo ? (
        <>
          <p className="caption">Face the camera, hair visible, good light. Happy with it?</p>
          <Button onClick={usePhoto} busy={busy}>Use this photo</Button>
          <Button kind="secondary" onClick={() => setPhoto(null)} disabled={busy}>Retake</Button>
        </>
      ) : cameraFailed ? (
        <>
          <LibraryPicker primary />
          {IS_DEMO && (
            <Button kind="secondary" disabled={!agreed} onClick={() => setPhoto(samplePhoto())}>
              Demo: use a sample photo
            </Button>
          )}
        </>
      ) : (
        <>
          <button className="shutter" aria-label="Take photo" disabled={!agreed || !live} onClick={shoot} />
          {agreed && <LibraryPicker primary={false} />}
        </>
      )}
    </Page>
  );
}
