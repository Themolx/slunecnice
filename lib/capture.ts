// Capture a square (1:1) JPEG from a playing <video>. Re-encodes via canvas so
// EXIF is stripped. Ported from Pixilate (lib/capture.ts), trimmed to one blob.

const FULL_QUALITY = 0.9;

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
      "image/jpeg",
      quality
    );
  });
}

export async function captureSquare(video: HTMLVideoElement, zoom = 1): Promise<Blob> {
  const sw = video.videoWidth;
  const sh = video.videoHeight;
  if (!sw || !sh) throw new Error("kamera není připravená");

  const baseSize = Math.min(sw, sh);
  const cropSize = baseSize / Math.max(1, zoom);
  const sx = (sw - cropSize) / 2;
  const sy = (sh - cropSize) / 2;
  const outSize = Math.round(baseSize);

  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, outSize, outSize);

  return toBlob(canvas, FULL_QUALITY);
}
