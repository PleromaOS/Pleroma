// The face scan: three photos in one smooth movement, modelled on setting up
// Face ID on an iPhone, because people already know how that works.
//
//   1. Look straight at the phone  → the top of the ring fills, front photo taken
//   2. Turn slowly to one side     → that side of the ring fills with the turn,
//                                    side photo taken at the right angle
//   3. Turn to the other side      → the other side fills, last photo taken
//   4. The whole ring lights up, a check mark draws itself, the chime plays.
//
// Guidance without reading: the ring (visible from the corner of the eye), a
// soft "searching" sound that brightens as you get closer and goes silent when
// it's right, and one large line of text only when something needs fixing.
//
// Low light: the WHOLE screen turns white and the camera circle shrinks, so the
// screen itself lights the face (like the iPhone's front flash); the guidance
// switches to dark text so it stays readable. A website cannot turn the
// brightness up itself (only an installed app can), so we ask once.
//
// "Hold still" is decided two ways (fixed 2026-09-26, it never let go when the
// phone was close): the face must not be moving between checks, and the
// picture must be at least 60% as crisp as the best frame seen of this person
// in this pose. Sharpness is measured on a fixed-size cut-out of the face, so
// holding the phone close or far no longer changes the number. Every check runs on the phone; the camera
// picture is not sent anywhere by this screen.

import { useCallback, useEffect, useRef, useState } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { faceCrop, findFace, greyFrame, preloadFaceTracker } from "../lib/faceTracker";
import { drawToJpeg } from "../lib/photo";
import { geometry, judge, light, LIMITS, sharpness, toWindow, type Geometry, type Light, type Verdict } from "../lib/photoQuality";
import { sound } from "../lib/sound";

export type ScanPhotos = { front: string; sideA: string; sideB: string };
type Phase = "front" | "sideA" | "sideB" | "done";

const TICK_MS = 110;
const HOLD = { front: 6, side: 3 };    // checks in a row that must pass (~0.65 s front, ~0.35 s side)
const COACH_DELAY = 6;                 // a problem must last ~0.7 s before we mention it (no flicker)
const DARK_TICKS_FOR_LIGHT = 8;        // ~0.9 s darkish → switch the screen light on
const LIGHT_MARGIN = 15;               // switch on a little BEFORE "too dark", so it helps early
const TICKS = 72;                      // marks around the ring

export function FaceScan({ onDone, onNoCamera, debug }: {
  onDone: (photos: ScanPhotos) => void;
  onNoCamera: () => void;
  debug?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [tracker, setTracker] = useState<FaceLandmarker | null>(null);
  const [live, setLive] = useState(false);
  const [phase, setPhase] = useState<Phase>("front");
  const [fill, setFill] = useState({ front: 0, left: 0, right: 0 }); // 0..1 per arc
  const [coach, setCoach] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const [screenLight, setScreenLight] = useState(false);
  const [readings, setReadings] = useState<Readings | null>(null);
  const photos = useRef<Partial<ScanPhotos>>({});
  const firstSide = useRef<1 | -1 | null>(null);
  const phaseRef = useRef<Phase>("front");
  phaseRef.current = phase;

  // Camera + face tracker.
  useEffect(() => {
    let stream: MediaStream | null = null, cancelled = false;
    const giveUp = setTimeout(() => !cancelled && onNoCamera(), 6000);
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
      .then((s) => {
        clearTimeout(giveUp);
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        if (video.current) { video.current.srcObject = s; video.current.play().catch(() => {}); }
        setLive(true);
      })
      .catch(() => { clearTimeout(giveUp); if (!cancelled) onNoCamera(); });
    preloadFaceTracker().then((t) => !cancelled && setTracker(t)).catch(() => !cancelled && onNoCamera());
    return () => { cancelled = true; clearTimeout(giveUp); stream?.getTracks().forEach((t) => t.stop()); sound.stop(); };
  }, [onNoCamera]);

  // Keep the screen from dimming or locking mid-scan (where the phone allows it).
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => { lock = l; }).catch(() => {});
    return () => { void lock?.release().catch(() => {}); };
  }, []);

  const take = useCallback((v: HTMLVideoElement) => {
    sound.shutter();
    return drawToJpeg(v, v.videoWidth, v.videoHeight);
  }, []);

  // The checking loop.
  useEffect(() => {
    if (!tracker || !live) return;
    let streak = 0, badStreak = 0, darkStreak = 0;
    let best = 0, bestFor: Phase = "front";          // crispest frame seen in this pose
    let prev: { x: number; y: number } | null = null; // nose position at the last check
    const loop = setInterval(() => {
      const v = video.current, p = phaseRef.current;
      if (!v || v.readyState < 2 || p === "done") return;

      const raw = findFace(tracker, v, performance.now());
      let g: Geometry | null = null, l: Light | null = null, sharp = 0, move = 0;
      if (raw) {
        g = geometry(toWindow(raw, v.videoWidth, v.videoHeight));
        const full = geometry(raw); // light is measured on the full picture's face box
        const { grey, w, h } = greyFrame(v);
        l = light(grey, w, h, full.box);
        sharp = sharpness(faceCrop(v, v.videoWidth, v.videoHeight, full.box));
        // Movement: how far the nose moved since the last check, as a share of the face size.
        const nose = raw[1];
        move = prev ? Math.hypot(nose.x - prev.x, nose.y - prev.y) / Math.max(0.05, full.faceHeight) : 1;
        prev = { x: nose.x, y: nose.y };
      } else prev = null;
      if (bestFor !== p) { best = 0; bestFor = p; }
      // The best slowly fades, so one lucky frame can't set an impossible bar.
      best = Math.max(best * 0.99, sharp);
      const steady = sharp >= Math.max(LIMITS.sharpFloor, best * LIMITS.sharpVsBest) && move <= LIMITS.moveMax;
      setTracking(!!g);

      // Which way the second side must turn: the opposite of the first.
      const want = p === "sideB" && firstSide.current ? ((-firstSide.current) as 1 | -1) : undefined;
      const verdict = judge(p === "front" ? "front" : "side", g, l, want, steady);
      if (debug) setReadings({ g, l, v: verdict, sharp, best, move });

      // Screen light: switched on after a moment of dim light, and left on.
      if (g && l && l.face < LIMITS.brightMin + LIGHT_MARGIN) {
        if (++darkStreak >= DARK_TICKS_FOR_LIGHT) setScreenLight(true);
      } else darkStreak = 0;

      // The ring follows the head.
      if (g && p !== "front") {
        // In the mirrored preview, a positive turn shows as the face turning
        // to the LEFT of the screen, so it fills the left half of the ring.
        const side = g.turn > 0 ? "left" : "right";
        const progress = Math.min(1, Math.abs(g.turn) / LIMITS.sideTurnMin);
        const isFirst = p === "sideA";
        const allowed = isFirst || (want !== undefined && Math.sign(g.turn) === want);
        if (allowed) setFill((f) => (f[side] >= 1 ? f : { ...f, [side]: Math.max(f[side] * 0.9, progress * 0.95) }));
      }

      // Sound: searching while not right, silent when right.
      if (verdict.ok) sound.quiet();
      else sound.searching(g ? (p === "front" ? 0.4 : Math.min(1, Math.abs(g.turn) / LIMITS.sideTurnMin)) : 0.1);

      // Coaching line: only after a problem has lasted a moment.
      if (verdict.ok) { badStreak = 0; setCoach(null); }
      else if (++badStreak >= COACH_DELAY) setCoach(verdict.say);

      streak = verdict.ok ? streak + 1 : 0;
      if (p === "front") setFill((f) => ({ ...f, front: Math.min(1, streak / HOLD.front) }));

      const need = p === "front" ? HOLD.front : HOLD.side;
      if (streak < need || !g) return;
      streak = 0;

      if (p === "front") {
        photos.current.front = take(v);
        setFill((f) => ({ ...f, front: 1 }));
        setPhase("sideA");
      } else if (p === "sideA") {
        photos.current.sideA = take(v);
        firstSide.current = g.turn > 0 ? 1 : -1;
        const side = g.turn > 0 ? "left" : "right";
        setFill((f) => ({ ...f, [side]: 1 }));
        setPhase("sideB");
      } else if (p === "sideB") {
        photos.current.sideB = take(v);
        const side = g.turn > 0 ? "left" : "right";
        setFill((f) => ({ ...f, [side]: 1 }));
        setPhase("done");
        setCoach(null);
        sound.chime();
        setTimeout(() => onDone(photos.current as ScanPhotos), 1400);
      }
    }, TICK_MS);
    return () => clearInterval(loop);
  }, [tracker, live, debug, take, onDone]);

  const title =
    phase === "front" ? "Look straight at the phone" :
    phase === "sideA" ? "Now turn your head slowly to one side" :
    phase === "sideB" ? "And now to the other side" : "Done";

  return (
    <div className={`scan ${screenLight ? "scan--light" : ""} ${phase === "done" ? "scan--done" : ""}`}>
      <p className="scan__title" aria-live="polite">{title}</p>

      <div className="scan__window">
        <video ref={video} autoPlay playsInline muted />
        <Ring fill={fill} active={tracking} done={phase === "done"} />
        {phase === "done" && <Check />}
        {(!live || !tracker) && <span className="scan__wait">{!live ? "Starting the camera…" : "Getting ready…"}</span>}
      </div>

      <p className={`scan__coach ${coach ? "is-on" : ""}`} role="status" aria-live="polite">{coach ?? " "}</p>
      {screenLight && phase !== "done" && <p className="scan__note">Turn your screen brightness all the way up</p>}

      {debug && readings && <Numbers r={readings} />}
    </div>
  );
}

// The ring of fine marks. The top arc belongs to the front photo; each side
// fills down from the top as the head turns that way; complete = all lit.
function Ring({ fill, active, done }: { fill: { front: number; left: number; right: number }; active: boolean; done: boolean }) {
  const FRONT_ARC = 40; // degrees either side of the top
  const marks = Array.from({ length: TICKS }, (_, i) => {
    const deg = (i / TICKS) * 360;                // 0 = top, clockwise
    const signed = deg > 180 ? deg - 360 : deg;   // -180..180, negative = left half
    let lit = done;
    if (!lit) {
      if (Math.abs(signed) <= FRONT_ARC) lit = fill.front > 0 && Math.abs(signed) <= FRONT_ARC * fill.front;
      else {
        const share = (Math.abs(signed) - FRONT_ARC) / (180 - FRONT_ARC);
        lit = share <= (signed < 0 ? fill.left : fill.right) && (signed < 0 ? fill.left : fill.right) > 0;
      }
    }
    const rad = ((deg - 90) * Math.PI) / 180;
    const r1 = 46.5, r2 = lit ? 50 : active ? 49.2 : 48.6;
    return (
      <line key={i} x1={50 + r1 * Math.cos(rad)} y1={50 + r1 * Math.sin(rad)}
        x2={50 + r2 * Math.cos(rad)} y2={50 + r2 * Math.sin(rad)} className={lit ? "lit" : ""} />
    );
  });
  return <svg className="ring" viewBox="-2 -2 104 104" aria-hidden>{marks}</svg>;
}

function Check() {
  return (
    <svg className="scan__check" viewBox="0 0 52 52" aria-label="Done">
      <circle cx="26" cy="26" r="25" />
      <path d="M14 27 l8 8 l16 -18" />
    </svg>
  );
}

type Readings = { g: Geometry | null; l: Light | null; v: Verdict; sharp: number; best: number; move: number };

function Numbers({ r }: { r: Readings }) {
  const { g, l } = r;
  const row = (name: string, value: number | undefined, limit: string, digits = 0) =>
    <div><dt>{name}</dt><dd>{value === undefined ? "–" : value.toFixed(digits)}</dd><dd className="limit">{limit}</dd></div>;
  return (
    <dl className="numbers">
      {row("Face size %", g ? g.faceHeight * 100 : undefined, `${LIMITS.faceMinHeight * 100}–${LIMITS.faceMaxHeight * 100}`)}
      {row("Hair top %", g ? g.hairTop * 100 : undefined, `≥ ${LIMITS.hairRoomAbove * 100}`)}
      {row("Turn °", g?.turn, `front ≤ ${LIMITS.frontTurnMax}, side ${LIMITS.sideTurnMin}–${LIMITS.sideTurnMax}`)}
      {row("Tilt °", g?.tilt, `≤ ${LIMITS.tiltMax}`)}
      {row("Nod °", g?.nod, `≤ ${LIMITS.tiltMax}`)}
      {row("Face brightness", l?.face, `${LIMITS.brightMin}–${LIMITS.brightMax}`)}
      {row("Background − face", l ? l.background - l.face : undefined, `≤ ${LIMITS.backlightGap}`)}
      {row("Blown out %", l ? l.blownOut * 100 : undefined, `≤ ${LIMITS.blownOutMax * 100}`)}
      {row("Sharpness", r.sharp, `≥ ${Math.max(LIMITS.sharpFloor, r.best * LIMITS.sharpVsBest).toFixed(1)} (best ${r.best.toFixed(1)})`, 1)}
      {row("Movement", r.move, `≤ ${LIMITS.moveMax}`, 3)}
      <div><dt>Verdict</dt><dd className="limit" style={{ gridColumn: "2 / 4" }}>{r.v.say}</dd></div>
    </dl>
  );
}
