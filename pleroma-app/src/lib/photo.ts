// Shrinks a photo before it is sent.
//
// A phone camera photo can be 5-12 MB. The renderer does not need more than
// about 1200 px on the long side to see hair, and a smaller photo uploads in a
// second on mobile data instead of twenty. Returns a JPEG as base64 text.

const LONG_SIDE = 1200;

export function drawToJpeg(source: CanvasImageSource, width: number, height: number, mirror = false): string {
  const scale = Math.min(1, LONG_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d")!;
  // The camera's own frames are NOT mirrored (only the on-screen preview is,
  // by CSS), so photos are saved as they come. Mirroring would put a side
  // parting on the wrong side for the barber. Fixed 2026-09-26.
  if (mirror) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.88);
}

export function fileToJpeg(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(drawToJpeg(img, img.naturalWidth, img.naturalHeight));
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Demo mode only: a drawn stand-in "selfie", so the flow can be clicked through
// on a device or page where neither the camera nor the photo library works.
export function samplePhoto(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 600; canvas.height = 800;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#2b2620"; ctx.fillRect(0, 0, 600, 800);
  ctx.fillStyle = "#6b5a48"; ctx.beginPath(); ctx.ellipse(300, 380, 150, 190, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#1a1816"; ctx.beginPath(); ctx.ellipse(300, 240, 160, 90, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = "#908674"; ctx.font = "28px Inter, sans-serif"; ctx.textAlign = "center";
  ctx.fillText("SAMPLE PHOTO", 300, 740);
  return canvas.toDataURL("image/jpeg", 0.88);
}
