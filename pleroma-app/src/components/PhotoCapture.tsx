// Photo checker, part 3: the camera screen.
//
// Shows the live camera with the oval, runs the checks about eight times a
// second, and shows ONE coaching line at a time. When every check has passed
// continuously for a moment, it takes the photo by itself, so for the side
// photos the client never has to find a button while looking away.
//
// For the side photos the client can't see the screen, so it also guides with
// sound: a tick that speeds up as they get close, and a double tone when the
// photo is taken. (Phones only allow sound after a tap, which is why the
// screen starts with one.)
//
// No camera? A photo from the library goes through the SAME checks.

import { useEffect, useRef, useState } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { findFace, greyFrame, preloadFaceTracker } from "../lib/faceTracker";
import { sound } from "../lib/sound";
import { drawToJpeg } from "../lib/photo";
import { geometry, judge, light, LIMITS, type Geometry, type Light, type Shot, type Verdict } from "../lib/photoQuality";

const TICK_MS = 125;       // about 8 checks a second
const HOLD_TICKS = 6;      // all green for ~0.75 s before the photo is taken
const CAMERA_TIMEOUT_MS = 6000;

export type Readings = { g: Geometry | null; l: Light | null; verdict: Verdict };

export function PhotoCapture({ shot, wantSide, onCaptured, onNoCamera, showNumbers }: {
  shot: Shot;
  wantSide?: 1 | -1;                       // for the second side: must turn the other way
  onCaptured: (jpeg: string, turn: number) => void;
  onNoCamera: () => void;
  showNumbers?: boolean;                   // test page: show every measurement
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [tracker, setTracker] = useState<FaceLandmarker | null>(null);
  const [live, setLive] = useState(false);
  const [readings, setReadings] = useState<Readings | null>(null);
  const [hold, setHold] = useState(0);

  // Camera on (front camera), with the same 6-second give-up as before.
  useEffect(() => {
    let stream: MediaStream | null = null, cancelled = false;
    const giveUp = setTimeout(() => !cancelled && onNoCamera(), CAMERA_TIMEOUT_MS);
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
      .then((s) => {
        clearTimeout(giveUp);
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}); }
        setLive(true);
      })
      .catch(() => { clearTimeout(giveUp); if (!cancelled) onNoCamera(); });
    preloadFaceTracker().then(setTracker).catch(() => { if (!cancelled) onNoCamera(); });
    return () => { cancelled = true; clearTimeout(giveUp); stream?.getTracks().forEach((t) => t.stop()); };
  }, [onNoCamera]);

  // The checking loop.
  useEffect(() => {
    if (!tracker || !live) return;
    let streak = 0, lastTick = 0, taken = false;
    const loop = setInterval(() => {
      const v = video.current;
      if (!v || v.readyState < 2 || taken) return;
      const pts = findFace(tracker, v, performance.now());
      let g: Geometry | null = null, l: Light | null = null;
      if (pts) {
        g = geometry(pts);
        const { grey, w, h } = greyFrame(v);
        l = light(grey, w, h, g.box);
      }
      const verdict = judge(shot, g, l, wantSide);
      setReadings({ g, l, verdict });

      streak = verdict.ok ? streak + 1 : 0;
      setHold(streak);

      // Sound guidance for the sides: ticks speed up as the turn gets close.
      if (shot === "side" && g && !verdict.ok) {
        const closeness = Math.min(1, Math.abs(g.turn) / LIMITS.sideTurnMin);
        const gap = 900 - 750 * closeness;
        if (performance.now() - lastTick > gap) { sound.tick(); lastTick = performance.now(); }
      }

      if (streak >= HOLD_TICKS) {
        taken = true;
        sound.done();
        onCaptured(drawToJpeg(v, v.videoWidth, v.videoHeight), g!.turn);
      }
    }, TICK_MS);
    return () => clearInterval(loop);
  }, [tracker, live, shot, wantSide, onCaptured]);

  const say = !live ? "Starting the camera…" : !tracker ? "Getting ready…" : readings?.verdict.say ?? "";
  const ok = readings?.verdict.ok;

  return (
    <div className="capture">
      <div className={`camera ${ok ? "camera--ok" : ""}`}>
        <video ref={video} autoPlay playsInline muted />
        <span className={`camera__oval ${shot === "side" ? "camera__oval--side" : ""}`} aria-hidden
          style={{ ["--hold" as string]: `${Math.min(1, hold / HOLD_TICKS)}` }} />
        <span className={`coach ${ok ? "coach--ok" : ""}`} role="status" aria-live="polite">{say}</span>
      </div>
      {showNumbers && readings && <Numbers r={readings} />}
    </div>
  );
}

// Test page only: every measurement next to its limit, for tuning the limits.
function Numbers({ r }: { r: Readings }) {
  const { g, l } = r;
  const row = (name: string, value: number | undefined, limit: string, digits = 0) =>
    <div><dt>{name}</dt><dd>{value === undefined ? "–" : value.toFixed(digits)}</dd><dd className="limit">{limit}</dd></div>;
  return (
    <dl className="numbers">
      {row("Face size %", g ? g.faceHeight * 100 : undefined, `${LIMITS.faceMinHeight * 100}–${LIMITS.faceMaxHeight * 100}`)}
      {row("Room above hair %", g ? g.hairTop * 100 : undefined, `≥ ${LIMITS.hairRoomAbove * 100}`)}
      {row("Turn °", g?.turn, `front ≤ ${LIMITS.frontTurnMax}, side ${LIMITS.sideTurnMin}–${LIMITS.sideTurnMax}`)}
      {row("Tilt °", g?.tilt, `≤ ${LIMITS.tiltMax}`)}
      {row("Nod °", g?.nod, `≤ ${LIMITS.tiltMax}`)}
      {row("Face brightness", l?.face, `${LIMITS.brightMin}–${LIMITS.brightMax}`)}
      {row("Background − face", l ? l.background - l.face : undefined, `≤ ${LIMITS.backlightGap}`)}
      {row("Blown out %", l ? l.blownOut * 100 : undefined, `≤ ${LIMITS.blownOutMax * 100}`)}
      {row("Sharpness", l?.sharp, `≥ ${LIMITS.sharpMin}`)}
    </dl>
  );
}

// For photos chosen from the library: the same checks, on a still picture.
export async function checkStill(jpeg: string, shot: Shot, wantSide?: 1 | -1): Promise<{ verdict: Verdict; turn: number }> {
  const { FaceLandmarker: FL, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const base = import.meta.env.BASE_URL + "mediapipe/";
  const files = await FilesetResolver.forVisionTasks(base + "wasm");
  const still = await FL.createFromOptions(files, {
    baseOptions: { modelAssetPath: base + "face_landmarker.task" }, runningMode: "IMAGE", numFaces: 1,
  }).catch(() => FL.createFromOptions(files, {
    baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task" },
    runningMode: "IMAGE", numFaces: 1,
  }));
  const img = new Image();
  await new Promise((ok, bad) => { img.onload = ok; img.onerror = bad; img.src = jpeg; });
  const pts = still.detect(img).faceLandmarks?.[0] ?? null;
  const g = pts ? geometry(pts) : null;
  let l: Light | null = null;
  if (g) {
    const W = 160, h = Math.round((W * img.naturalHeight) / img.naturalWidth);
    const cv = document.createElement("canvas"); cv.width = W; cv.height = h;
    const cx = cv.getContext("2d")!; cx.drawImage(img, 0, 0, W, h);
    const px = cx.getImageData(0, 0, W, h).data, grey = new Uint8ClampedArray(W * h);
    for (let i = 0; i < grey.length; i++) grey[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    l = light(grey, W, h, g.box);
  }
  still.close();
  return { verdict: judge(shot, g, l, wantSide), turn: g?.turn ?? 0 };
}

