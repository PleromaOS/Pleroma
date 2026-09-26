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
export const LIMITS = {
  faceMinHeight: 0.30,     // face at least 30% of the picture's height
  faceMaxHeight: 0.80,     // not so close that the hair is cut off
  hairRoomAbove: 0.06,     // room above the estimated top of the hair, as share of picture height
  brightMin: 75,           // average brightness of the face, 0 (black) to 255 (white)
  brightMax: 205,
  backlightGap: 55,        // background this much brighter than the face = light behind them
  blownOutMax: 0.10,       // at most 10% of the face pure white
  sharpMin: 22,            // edge crispness; below this the photo is soft or shaken
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

  // The face points stop at the forehead; hair sits above it. Roughly half a
  // face-height above the forehead covers most cuts up to a quiff.
  const hairTop = pts[P.forehead].y - faceHeight * 0.5;

  return { faceHeight, centreX: (box.x0 + box.x1) / 2, hairTop, turn, tilt, nod, box };
}

export type Light = { face: number; background: number; blownOut: number; sharp: number };

// Pixel measurements on a small grey copy of the picture (w x h values 0..255).
// Small on purpose: 160 pixels wide is plenty to judge light and blur, and it
// runs many times a second on an old phone.
export function light(grey: Uint8ClampedArray, w: number, h: number, box: Geometry["box"]): Light {
  const x0 = Math.max(1, Math.floor(box.x0 * w)), x1 = Math.min(w - 2, Math.ceil(box.x1 * w));
  const y0 = Math.max(1, Math.floor(box.y0 * h)), y1 = Math.min(h - 2, Math.ceil(box.y1 * h));
  let fSum = 0, fN = 0, white = 0, bSum = 0, bN = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = grey[y * w + x];
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) { fSum += v; fN++; if (v >= 245) white++; }
      else { bSum += v; bN++; }
    }
  }
  // Sharpness: how strongly each pixel differs from its four neighbours
  // (the "variance of the Laplacian"). A crisp photo has strong, varied edges;
  // a blurred or shaken one has soft, uniform ones.
  const lap: number[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      lap.push(4 * grey[i] - grey[i - 1] - grey[i + 1] - grey[i - w] - grey[i + w]);
    }
  }
  const mean = lap.reduce((a, b) => a + b, 0) / Math.max(1, lap.length);
  const sharp = lap.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, lap.length);
  return {
    face: fN ? fSum / fN : 0,
    background: bN ? bSum / bN : 0,
    blownOut: fN ? white / fN : 0,
    sharp: Math.sqrt(sharp),
  };
}

// The verdict: the ONE thing to fix, in the order a client should fix it.
// One line of coaching at a time; a list of five problems helps nobody.
export type Verdict = { ok: boolean; say: string };

export function judge(shot: Shot, g: Geometry | null, l: Light | null, wantSide?: 1 | -1): Verdict {
  if (!g || !l) return { ok: false, say: shot === "front" ? "Put your face in the oval" : "Turn back a little, we lost your face" };
  const turnAbs = Math.abs(g.turn);
  if (shot === "front") {
    if (g.faceHeight < LIMITS.faceMinHeight) return { ok: false, say: "Move a little closer" };
    if (g.faceHeight > LIMITS.faceMaxHeight) return { ok: false, say: "Move a little further away" };
    if (Math.abs(g.centreX - 0.5) > 0.15) return { ok: false, say: "Move your face to the middle" };
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
  if (l.sharp < LIMITS.sharpMin) return { ok: false, say: "Hold still" };
  return { ok: true, say: "Perfect, hold it" };
}
