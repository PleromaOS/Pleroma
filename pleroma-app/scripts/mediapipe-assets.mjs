// Runs before every build (and before `npm run dev`).
// Puts the face tracker's files into public/mediapipe/ so our own site serves
// them: the program files come from the installed @mediapipe/tasks-vision
// package, the face model is downloaded from Google once.
// If the download fails (no internet), the app still works: it then fetches
// the model from Google's address in the client's browser instead.
import fs from "node:fs";
import path from "node:path";

const out = "public/mediapipe";
fs.mkdirSync(path.join(out, "wasm"), { recursive: true });
const wasm = "node_modules/@mediapipe/tasks-vision/wasm";
for (const f of fs.readdirSync(wasm)) fs.copyFileSync(path.join(wasm, f), path.join(out, "wasm", f));

const model = path.join(out, "face_landmarker.task");
if (!fs.existsSync(model)) {
  try {
    const res = await fetch("https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fs.writeFileSync(model, Buffer.from(await res.arrayBuffer()));
    console.log("face model downloaded");
  } catch (e) {
    console.warn(`face model not downloaded (${e.message}); the app will fetch it from Google at runtime`);
  }
}
