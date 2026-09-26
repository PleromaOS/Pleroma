// Checks a photo chosen from the library with the SAME rules as the live scan,
// so the library is never a way around the photo check.

import { faceCrop } from "./faceTracker";
import { geometry, judge, light, LIMITS, sharpness, toWindow, type Light, type Shot, type Verdict } from "./photoQuality";

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
  // Sizes are judged inside the same centre square the live scan uses.
  const g = pts ? geometry(toWindow(pts, img.naturalWidth, img.naturalHeight)) : null;
  const full = pts ? geometry(pts) : null;
  let l: Light | null = null, steady = true;
  if (g && full) {
    const W = 160, h = Math.round((W * img.naturalHeight) / img.naturalWidth);
    const cv = document.createElement("canvas"); cv.width = W; cv.height = h;
    const cx = cv.getContext("2d")!; cx.drawImage(img, 0, 0, W, h);
    const px = cx.getImageData(0, 0, W, h).data, grey = new Uint8ClampedArray(W * h);
    for (let i = 0; i < grey.length; i++) grey[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    l = light(grey, W, h, full.box);
    // A still has no "best frame" to compare with, so only the absolute floor applies.
    steady = sharpness(faceCrop(img, img.naturalWidth, img.naturalHeight, full.box)) >= LIMITS.sharpFloor;
  }
  still.close();
  const verdict = judge(shot, g, l, wantSide, steady);
  if (verdict.say === "Hold still") verdict.say = "This photo is a bit blurry. Try a sharper one";
  return { verdict, turn: g?.turn ?? 0 };
}

