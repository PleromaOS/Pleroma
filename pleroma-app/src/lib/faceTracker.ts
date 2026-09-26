// Photo checker, part 2: the face tracker.
//
// Loads MediaPipe's face landmarker (Google, free, runs entirely inside the
// phone's browser: the camera picture never leaves the phone for this step).
// It finds the face and places ~470 points on it, several times a second.
//
// The model file is fetched from our own site first (the build puts it there),
// and from Google's official address if that copy is missing.

import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { Point } from "./photoQuality";

const BASE = import.meta.env.BASE_URL + "mediapipe/";
const GOOGLE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let loading: Promise<FaceLandmarker> | null = null;

// Started early (before the camera screen) so the client never waits for it.
export function preloadFaceTracker(): Promise<FaceLandmarker> {
  if (!loading) {
    loading = (async () => {
      // Loaded only when needed, so the landing page stays light.
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const files = await FilesetResolver.forVisionTasks(BASE + "wasm");
      const make = async (modelAssetPath: string, delegate: "GPU" | "CPU") =>
        FaceLandmarker.createFromOptions(files, {
          baseOptions: { modelAssetPath, delegate },
          runningMode: "VIDEO",
          numFaces: 1,
        });
      // Graphics chip first (faster, kinder to the battery), plain processor if the phone refuses.
      for (const model of [BASE + "face_landmarker.task", GOOGLE_MODEL]) {
        for (const delegate of ["GPU", "CPU"] as const) {
          try { return await make(model, delegate); } catch { /* try the next way */ }
        }
      }
      throw new Error("face tracker unavailable");
    })();
    loading.catch(() => { loading = null; }); // allow a retry later
  }
  return loading;
}

// One look at the current video frame: the face points, or null if no face.
export function findFace(tracker: FaceLandmarker, video: HTMLVideoElement, at: number): Point[] | null {
  const r = tracker.detectForVideo(video, at);
  return r.faceLandmarks?.[0] ?? null;
}

// A small grey copy of the frame for the light and sharpness measurements.
const W = 160;
let canvas: HTMLCanvasElement | null = null;
export function greyFrame(video: HTMLVideoElement): { grey: Uint8ClampedArray; w: number; h: number } {
  const h = Math.round((W * video.videoHeight) / Math.max(1, video.videoWidth));
  canvas ??= document.createElement("canvas");
  canvas.width = W; canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(video, 0, 0, W, h);
  const rgba = ctx.getImageData(0, 0, W, h).data;
  const grey = new Uint8ClampedArray(W * h);
  for (let i = 0; i < grey.length; i++) {
    // Perceived brightness: the eye is most sensitive to green, least to blue.
    grey[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
  }
  return { grey, w: W, h };
}
