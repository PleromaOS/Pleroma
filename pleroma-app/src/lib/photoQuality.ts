// Photo checker, part 1: the measurements.
//
// Pure maths on numbers only: no camera, no screen. That keeps it testable on
// its own, and it means every rule the client is held to is written down here
// in one place, with its limit next to it.
//
// Two kinds of measurement:
//   - from the face points (MediaPipe gives ~470 points on the face): how big
//     the face is, where it sits, which way the head is turned and tilted,
//     and whether there is room above the forehead for the hair
//   - from the pixels: how bright the face is, whether the light is behind the
//     person, whether parts are blown out white, and how sharp the image is

export type Shot = "front" | "side";

// Every limit in one place. These are STARTING values: they must be tuned on
// real photos (good ones and bad ones) before launch. The test page shows the
// live numbers next to each limit for exactly that reason.
// All sizes are measured inside the round window the client actually sees
// (fixed 2026-09-26: they were measured on the full, wider camera picture,
// which forced Bryan to hold the phone at full arm's length).
export const LIMITS = {
  faceMinHeight: 0.26,     // forehead-to-chin at least 26% of the window: a relaxed arm's length
  faceMaxHeight: 0.62,     // not so close that the hair is cut off
  hairRoomAbove: 0.02,     // the estimated top of the hair must be inside the window
  brightMin: 75,           // average brightness of the face, 0 (black) to 255 (white)
  brightMax: 205,
  backlightGap: 55,        // background this much brighter than the face = light behind them
  blownOutMax: 0.10,       // at most 10% of the face pure white
  sharpFloor: 4,           // absolute minimum crispness of the face cut-out (library photos)
  sharpVsBest: 0.6,        // live: a frame must be at least 60% as crisp as the best one seen of this person
  moveMax: 0.04,           // live: the nose may move at most 4% of the face's height between checks
  frontTurnMax: 12,        // front photo: head turned at most 12 degrees
  sideTurnMin: 45,         // side photo: head turned between 45 and 80 degrees
  sideTurnMax: 80,         //   (past about 80 the face tracker loses the face)
  tiltMax: 15,             // head tipped up/down or sideways at most 15 degrees
};

export type Point = { x: number; y: number }; // 0..1 across and down the picture

// Named face points (MediaPipe face mesh numbering).
const P = { forehead: 10, chin: 152, nose: 1, cheekL: 234, cheekR: 454, eyeL: 33, eyeR: 263 };

export type Geometry = {
  faceHeight: number;   // share of picture height
  centreX: number;      // 0..1
  hairTop: number;      // estimated top of the hair, 0 = top of picture
  turn: number;         // degrees; + one way, - the other; 0 = straight at the camera
  tilt: number;         // degrees; head tipped sideways (ear towards shoulder)
  nod: number;          // degrees; head tipped up or down
  box: { x0: number; y0: number; x1: number; y1: number };
};

// The camera picture is wider (or taller) than the round window, which shows
// its centre square. This turns face points from "share of the whole picture"
// into "share of the window", so every check is about what the client sees.
export function toWindow(pts: Point[], frameW: number, frameH: number): Point[] {
  const side = Math.min(frameW, frameH);
  const ox = (frameW - side) / 2, oy = (frameH - side) / 2;
  return pts.map((p) => ({ x: (p.x * frameW - ox) / side, y: (p.y * frameH - oy) / side }));
}

export function geometry(pts: Point[]): Geometry {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const box = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  const faceHeight = pts[P.chin].y - pts[P.forehead].y;

  // Turn: where the nose sits between the two cheek edges. Dead centre means
  // facing the camera; as the head turns, the nose slides towards one edge.
  const L = pts[P.cheekL], R = pts[P.cheekR], nose = pts[P.nose];
  const span = R.x - L.x || 1e-6;
  const offset = Math.max(-1, Math.min(1, ((nose.x - L.x) / span - 0.5) * 2));
  const turn = (Math.asin(offset) * 180) / Math.PI;

  // Tilt: the angle of the line through both eyes.
  const eL = pts[P.eyeL], eR = pts[P.eyeR];
  const tilt = (Math.atan2(eR.y - eL.y, eR.x - eL.x) * 180) / Math.PI;

  // Nod: where the nose sits between the eye line and the chin. About 0.4 of
  // the way down when level; higher means chin up, lower means chin down.
  const eyeY = (eL.y + eR.y) / 2;
  const noseShare = (nose.y - eyeY) / Math.max(1e-6, pts[P.chin].y - eyeY);
  const nod = (noseShare - 0.4) * 120;

  // The face points stop at the forehead; hair sits above it. A third of a
  // face-height above the forehead covers most cuts. (Was half: too much,
  // it pushed people to hold the phone too far away.)
  const hairTop = pts[P.forehead].y - faceHeight * 0.33;

  return { faceHeight, centreX: (box.x0 + box.x1) / 2, hairTop, turn, tilt, nod, box };
}

export type Light = { face: number; background: number; blownOut: number };

// Pixel measurements on a small grey copy of the picture (w x h values 0..255).
// Small on purpose: 160 pixels wide is plenty to judge light and blur, and it
// runs many times a second on an old phone.
export function light(grey: Uint8ClampedArray, w: number, h: number, box: Geometry["box"]): Light {
  const x0 = Math.max(0, Math.floor(box.x0 * w)), x1 = Math.min(w - 1, Math.ceil(box.x1 * w));
  const y0 = Math.max(0, Math.floor(box.y0 * h)), y1 = Math.min(h - 1, Math.ceil(box.y1 * h));
  let fSum = 0, fN = 0, white = 0, bSum = 0, bN = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = grey[y * w + x];
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) { fSum += v; fN++; if (v >= 245) white++; }
      else { bSum += v; bN++; }
    }
  }
  return {
    face: fN ? fSum / fN : 0,
    background: bN ? bSum / bN : 0,
    blownOut: fN ? white / fN : 0,
  };
}

// Sharpness of the fixed-size face cut-out: how strongly each pixel differs
// from its four neighbours (the "variance of the Laplacian"). A crisp photo
// has strong, varied edges; a soft or shaken one has weak, uniform ones.
export function sharpness(grey: Uint8ClampedArray, size = 128): number {
  let sum = 0, sq = 0, n = 0;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const i = y * size + x;
      const v = 4 * grey[i] - grey[i - 1] - grey[i + 1] - grey[i - size] - grey[i + size];
      sum += v; sq += v * v; n++;
    }
  }
  const mean = sum / n;
  return Math.sqrt(Math.max(0, sq / n - mean * mean));
}

// The verdict: the ONE thing to fix, in the order a client should fix it.
// One line of coaching at a time; a list of five problems helps nobody.
export type Verdict = { ok: boolean; say: string };

// steady: the scan's own judgement that the picture is crisp and not moving
// (see FaceScan: compared with the best frame seen of this person).
export function judge(shot: Shot, g: Geometry | null, l: Light | null, wantSide?: 1 | -1, steady = true): Verdict {
  if (!g || !l) return { ok: false, say: shot === "front" ? "Put your face in the circle" : "Turn back a little, we lost your face" };
  const turnAbs = Math.abs(g.turn);
  if (shot === "front") {
    if (g.faceHeight < LIMITS.faceMinHeight) return { ok: false, say: "Move a little closer" };
    if (g.faceHeight > LIMITS.faceMaxHeight) return { ok: false, say: "Move a little further away" };
    if (Math.abs(g.centreX - 0.5) > 0.15) return { ok: false, say: "Move your face to the middle" };
    if (g.box.y1 > 1.02) return { ok: false, say: "Tilt the phone down a little" };
  }
  if (g.hairTop < LIMITS.hairRoomAbove) return { ok: false, say: "Show the top of your head: tilt the phone up a little" };
  if (l.background - l.face > LIMITS.backlightGap) return { ok: false, say: "The light is behind you. Turn to face the light" };
  if (l.face < LIMITS.brightMin) return { ok: false, say: "Too dark. Face a window or a lamp" };
  if (l.face > LIMITS.brightMax || l.blownOut > LIMITS.blownOutMax) return { ok: false, say: "Too bright. Step out of direct light" };
  if (Math.abs(g.tilt) > LIMITS.tiltMax) return { ok: false, say: "Keep your head straight" };
  if (Math.abs(g.nod) > LIMITS.tiltMax) return { ok: false, say: g.nod > 0 ? "Lift your chin a little" : "Lower your chin a little" };
  if (shot === "front") {
    if (turnAbs > LIMITS.frontTurnMax) return { ok: false, say: "Look straight at the camera" };
  } else {
    if (wantSide && Math.sign(g.turn) !== wantSide && turnAbs > 10) return { ok: false, say: "Now turn the other way" };
    if (turnAbs < LIMITS.sideTurnMin) return { ok: false, say: "Keep turning" };
    if (turnAbs > LIMITS.sideTurnMax) return { ok: false, say: "A little less" };
  }
  if (!steady) return { ok: false, say: "Hold still" };
  return { ok: true, say: "Perfect, hold it" };
}
