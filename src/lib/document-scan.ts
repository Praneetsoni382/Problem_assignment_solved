/**
 * Lightweight client-side document scanner.
 *
 * Finds the page inside a camera frame (largest bright quadrilateral region),
 * then perspective-corrects and crops it so only the document is kept —
 * no desk, hands or background around the paper.
 */

export type Point = { x: number; y: number };
export type Quad = [Point, Point, Point, Point]; // tl, tr, br, bl

const WORK_WIDTH = 320;

function toWorkCanvas(source: HTMLCanvasElement | HTMLVideoElement, w: number, h: number) {
  const scale = WORK_WIDTH / w;
  const ww = Math.max(64, Math.round(w * scale));
  const wh = Math.max(64, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = ww;
  canvas.height = wh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, ww, wh);
  return { data: ctx.getImageData(0, 0, ww, wh), ww, wh, scale };
}

function otsu(gray: Uint8Array) {
  const hist = new Int32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]!]! += 1;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i]!;
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]!;
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t]!;
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) {
      best = between;
      threshold = t;
    }
  }
  return threshold;
}

/** Detect the page quad in a frame. Returns null when no confident page is found. */
export function detectDocumentQuad(
  source: HTMLCanvasElement | HTMLVideoElement,
  width: number,
  height: number,
): Quad | null {
  const work = toWorkCanvas(source, width, height);
  if (!work) return null;
  const { data, ww, wh, scale } = work;
  const px = data.data;
  const gray = new Uint8Array(ww * wh);
  for (let i = 0, p = 0; i < gray.length; i++, p += 4) {
    gray[i] = (px[p]! * 0.299 + px[p + 1]! * 0.587 + px[p + 2]! * 0.114) | 0;
  }

  const threshold = Math.max(60, otsu(gray) - 5);
  const bright = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) bright[i] = gray[i]! >= threshold ? 1 : 0;

  // Largest connected bright component (4-way flood fill).
  const labels = new Int32Array(gray.length).fill(-1);
  const queue = new Int32Array(gray.length);
  let bestPixels: number[] | null = null;
  for (let start = 0; start < gray.length; start++) {
    if (!bright[start] || labels[start] !== -1) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    labels[start] = start;
    const pixels: number[] = [];
    while (head < tail) {
      const idx = queue[head++]!;
      pixels.push(idx);
      const x = idx % ww;
      const y = (idx / ww) | 0;
      const neighbours = [
        x > 0 ? idx - 1 : -1,
        x < ww - 1 ? idx + 1 : -1,
        y > 0 ? idx - ww : -1,
        y < wh - 1 ? idx + ww : -1,
      ];
      for (const n of neighbours) {
        if (n < 0 || !bright[n] || labels[n] !== -1) continue;
        labels[n] = start;
        queue[tail++] = n;
      }
    }
    if (!bestPixels || pixels.length > bestPixels.length) bestPixels = pixels;
  }

  if (!bestPixels) return null;
  const area = bestPixels.length / (ww * wh);
  // Too small = not a page in frame; ~everything = plain wall / no edges to crop.
  if (area < 0.12 || area > 0.985) return null;

  let tlIdx = 0;
  let trIdx = 0;
  let brIdx = 0;
  let blIdx = 0;
  let minSum = Infinity;
  let maxSum = -Infinity;
  let minDiff = Infinity;
  let maxDiff = -Infinity;
  for (const idx of bestPixels) {
    const x = idx % ww;
    const y = (idx / ww) | 0;
    const sum = x + y;
    const diff = x - y;
    if (sum < minSum) {
      minSum = sum;
      tlIdx = idx;
    }
    if (sum > maxSum) {
      maxSum = sum;
      brIdx = idx;
    }
    if (diff > maxDiff) {
      maxDiff = diff;
      trIdx = idx;
    }
    if (diff < minDiff) {
      minDiff = diff;
      blIdx = idx;
    }
  }

  const toPoint = (idx: number): Point => ({
    x: (idx % ww) / scale,
    y: ((idx / ww) | 0) / scale,
  });
  const tl = toPoint(tlIdx);
  const tr = toPoint(trIdx);
  const br = toPoint(brIdx);
  const bl = toPoint(blIdx);

  const side = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const widthTop = side(tl, tr);
  const widthBottom = side(bl, br);
  const heightLeft = side(tl, bl);
  const heightRight = side(tr, br);
  if (Math.min(widthTop, widthBottom, heightLeft, heightRight) < Math.min(width, height) * 0.25)
    return null;

  return [tl, tr, br, bl];
}

/** Solve the 3x3 homography mapping the destination rect back into the source quad. */
function inverseHomography(quad: Quad, outW: number, outH: number): number[] | null {
  const dst: Point[] = [
    { x: 0, y: 0 },
    { x: outW, y: 0 },
    { x: outW, y: outH },
    { x: 0, y: outH },
  ];
  const a: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const d = dst[i]!;
    const s = quad[i]!;
    a.push([d.x, d.y, 1, 0, 0, 0, -d.x * s.x, -d.y * s.x]);
    b.push(s.x);
    a.push([0, 0, 0, d.x, d.y, 1, -d.x * s.y, -d.y * s.y]);
    b.push(s.y);
  }
  // Gaussian elimination on the 8x8 system.
  for (let col = 0; col < 8; col++) {
    let pivot = col;
    for (let row = col + 1; row < 8; row++)
      if (Math.abs(a[row]![col]!) > Math.abs(a[pivot]![col]!)) pivot = row;
    const tmpRow = a[col]!;
    a[col] = a[pivot]!;
    a[pivot] = tmpRow;
    const tmpB = b[col]!;
    b[col] = b[pivot]!;
    b[pivot] = tmpB;
    const p = a[col]![col]!;
    if (Math.abs(p) < 1e-10) return null;
    for (let row = col + 1; row < 8; row++) {
      const f = a[row]![col]! / p;
      if (!f) continue;
      for (let k = col; k < 8; k++) a[row]![k] = a[row]![k]! - f * a[col]![k]!;
      b[row] = b[row]! - f * b[col]!;
    }
  }
  const h: number[] = new Array(9).fill(0);
  for (let row = 7; row >= 0; row--) {
    let sum = b[row]!;
    for (let k = row + 1; k < 8; k++) sum -= a[row]![k]! * h[k]!;
    h[row] = sum / a[row]![row]!;
  }
  h[8] = 1;
  return h;
}

/** Perspective-crop the quad out of the frame and return a clean page image. */
export function warpQuad(source: HTMLCanvasElement, quad: Quad): HTMLCanvasElement | null {
  const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const outW = Math.round(Math.max(dist(quad[0], quad[1]), dist(quad[3], quad[2])));
  const outH = Math.round(Math.max(dist(quad[0], quad[3]), dist(quad[1], quad[2])));
  if (outW < 80 || outH < 80) return null;

  const h = inverseHomography(quad, outW, outH);
  if (!h) return null;

  const srcCtx = source.getContext("2d", { willReadFrequently: true });
  if (!srcCtx) return null;
  const src = srcCtx.getImageData(0, 0, source.width, source.height);
  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const outCtx = out.getContext("2d");
  if (!outCtx) return null;
  const dest = outCtx.createImageData(outW, outH);

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const denom = h[6]! * x + h[7]! * y + h[8]!;
      const sx = (h[0]! * x + h[1]! * y + h[2]!) / denom;
      const sy = (h[3]! * x + h[4]! * y + h[5]!) / denom;
      const ix = Math.min(source.width - 1, Math.max(0, Math.round(sx)));
      const iy = Math.min(source.height - 1, Math.max(0, Math.round(sy)));
      const si = (iy * source.width + ix) * 4;
      const di = (y * outW + x) * 4;
      dest.data[di] = src.data[si]!;
      dest.data[di + 1] = src.data[si + 1]!;
      dest.data[di + 2] = src.data[si + 2]!;
      dest.data[di + 3] = 255;
    }
  }
  outCtx.putImageData(dest, 0, 0);
  return out;
}

/** Gentle contrast/brightness lift so handwriting reads clearly, like a scanner. */
export function enhanceScan(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = image.data;
  let min = 255;
  let max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const l = (d[i]! * 0.299 + d[i + 1]! * 0.587 + d[i + 2]! * 0.114) | 0;
    if (l < min) min = l;
    if (l > max) max = l;
  }
  const range = Math.max(1, max - min);
  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = ((d[i + c]! - min) / range) * 255;
      d[i + c] = Math.min(255, Math.max(0, v * 1.06 - 6));
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Full pipeline: frame -> detected page -> cropped, enhanced scan canvas. */
export function scanDocument(frame: HTMLCanvasElement): {
  canvas: HTMLCanvasElement;
  cropped: boolean;
} {
  const quad = detectDocumentQuad(frame, frame.width, frame.height);
  if (quad) {
    const warped = warpQuad(frame, quad);
    if (warped) return { canvas: enhanceScan(warped), cropped: true };
  }
  return { canvas: enhanceScan(frame), cropped: false };
}
