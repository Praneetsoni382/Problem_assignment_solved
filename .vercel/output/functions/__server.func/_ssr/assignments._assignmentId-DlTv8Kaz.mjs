import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BZqcN8FK.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { B as Camera, F as CircleCheck, K as ArrowLeft, N as Crop, R as Check, c as Send, d as RotateCw, k as FileText, m as Plus, o as Trash2, p as RefreshCw, q as Aperture, r as X, u as ScanLine } from "../_libs/lucide-react.mjs";
import { C as listPages, T as listSubmissions, _ as deletePage, d as Button, h as useSignedUrl, i as AppShell, m as useProfile, r as Route$4, x as getOrCreateSubmission, y as getAssignment } from "./router-DbtMI3nh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/assignments._assignmentId-DlTv8Kaz.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var WORK_WIDTH = 320;
function toWorkCanvas(source, w, h) {
	const scale = WORK_WIDTH / w;
	const ww = Math.max(64, Math.round(w * scale));
	const wh = Math.max(64, Math.round(h * scale));
	const canvas = document.createElement("canvas");
	canvas.width = ww;
	canvas.height = wh;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return null;
	ctx.drawImage(source, 0, 0, ww, wh);
	return {
		data: ctx.getImageData(0, 0, ww, wh),
		ww,
		wh,
		scale
	};
}
function otsu(gray) {
	const hist = /* @__PURE__ */ new Int32Array(256);
	for (let i = 0; i < gray.length; i++) hist[gray[i]] += 1;
	const total = gray.length;
	let sum = 0;
	for (let i = 0; i < 256; i++) sum += i * hist[i];
	let sumB = 0;
	let wB = 0;
	let best = 0;
	let threshold = 128;
	for (let t = 0; t < 256; t++) {
		wB += hist[t];
		if (!wB) continue;
		const wF = total - wB;
		if (!wF) break;
		sumB += t * hist[t];
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
function detectDocumentQuad(source, width, height) {
	const work = toWorkCanvas(source, width, height);
	if (!work) return null;
	const { data, ww, wh, scale } = work;
	const px = data.data;
	const gray = new Uint8Array(ww * wh);
	for (let i = 0, p = 0; i < gray.length; i++, p += 4) gray[i] = px[p] * .299 + px[p + 1] * .587 + px[p + 2] * .114 | 0;
	const threshold = Math.max(60, otsu(gray) - 5);
	const bright = new Uint8Array(gray.length);
	for (let i = 0; i < gray.length; i++) bright[i] = gray[i] >= threshold ? 1 : 0;
	const labels = new Int32Array(gray.length).fill(-1);
	const queue = new Int32Array(gray.length);
	let bestPixels = null;
	for (let start = 0; start < gray.length; start++) {
		if (!bright[start] || labels[start] !== -1) continue;
		let head = 0;
		let tail = 0;
		queue[tail++] = start;
		labels[start] = start;
		const pixels = [];
		while (head < tail) {
			const idx = queue[head++];
			pixels.push(idx);
			const x = idx % ww;
			const y = idx / ww | 0;
			const neighbours = [
				x > 0 ? idx - 1 : -1,
				x < ww - 1 ? idx + 1 : -1,
				y > 0 ? idx - ww : -1,
				y < wh - 1 ? idx + ww : -1
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
	if (area < .12 || area > .985) return null;
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
		const y = idx / ww | 0;
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
	const toPoint = (idx) => ({
		x: idx % ww / scale,
		y: (idx / ww | 0) / scale
	});
	const tl = toPoint(tlIdx);
	const tr = toPoint(trIdx);
	const br = toPoint(brIdx);
	const bl = toPoint(blIdx);
	const side = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
	const widthTop = side(tl, tr);
	const widthBottom = side(bl, br);
	const heightLeft = side(tl, bl);
	const heightRight = side(tr, br);
	if (Math.min(widthTop, widthBottom, heightLeft, heightRight) < Math.min(width, height) * .25) return null;
	return [
		tl,
		tr,
		br,
		bl
	];
}
/** Solve the 3x3 homography mapping the destination rect back into the source quad. */
function inverseHomography(quad, outW, outH) {
	const dst = [
		{
			x: 0,
			y: 0
		},
		{
			x: outW,
			y: 0
		},
		{
			x: outW,
			y: outH
		},
		{
			x: 0,
			y: outH
		}
	];
	const a = [];
	const b = [];
	for (let i = 0; i < 4; i++) {
		const d = dst[i];
		const s = quad[i];
		a.push([
			d.x,
			d.y,
			1,
			0,
			0,
			0,
			-d.x * s.x,
			-d.y * s.x
		]);
		b.push(s.x);
		a.push([
			0,
			0,
			0,
			d.x,
			d.y,
			1,
			-d.x * s.y,
			-d.y * s.y
		]);
		b.push(s.y);
	}
	for (let col = 0; col < 8; col++) {
		let pivot = col;
		for (let row = col + 1; row < 8; row++) if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
		const tmpRow = a[col];
		a[col] = a[pivot];
		a[pivot] = tmpRow;
		const tmpB = b[col];
		b[col] = b[pivot];
		b[pivot] = tmpB;
		const p = a[col][col];
		if (Math.abs(p) < 1e-10) return null;
		for (let row = col + 1; row < 8; row++) {
			const f = a[row][col] / p;
			if (!f) continue;
			for (let k = col; k < 8; k++) a[row][k] = a[row][k] - f * a[col][k];
			b[row] = b[row] - f * b[col];
		}
	}
	const h = new Array(9).fill(0);
	for (let row = 7; row >= 0; row--) {
		let sum = b[row];
		for (let k = row + 1; k < 8; k++) sum -= a[row][k] * h[k];
		h[row] = sum / a[row][row];
	}
	h[8] = 1;
	return h;
}
/** Perspective-crop the quad out of the frame and return a clean page image. */
function warpQuad(source, quad) {
	const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
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
	for (let y = 0; y < outH; y++) for (let x = 0; x < outW; x++) {
		const denom = h[6] * x + h[7] * y + h[8];
		const sx = (h[0] * x + h[1] * y + h[2]) / denom;
		const sy = (h[3] * x + h[4] * y + h[5]) / denom;
		const ix = Math.min(source.width - 1, Math.max(0, Math.round(sx)));
		const si = (Math.min(source.height - 1, Math.max(0, Math.round(sy))) * source.width + ix) * 4;
		const di = (y * outW + x) * 4;
		dest.data[di] = src.data[si];
		dest.data[di + 1] = src.data[si + 1];
		dest.data[di + 2] = src.data[si + 2];
		dest.data[di + 3] = 255;
	}
	outCtx.putImageData(dest, 0, 0);
	return out;
}
/** Gentle contrast/brightness lift so handwriting reads clearly, like a scanner. */
function enhanceScan(canvas) {
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return canvas;
	const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const d = image.data;
	let min = 255;
	let max = 0;
	for (let i = 0; i < d.length; i += 4) {
		const l = d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114 | 0;
		if (l < min) min = l;
		if (l > max) max = l;
	}
	const range = Math.max(1, max - min);
	for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) {
		const v = (d[i + c] - min) / range * 255;
		d[i + c] = Math.min(255, Math.max(0, v * 1.06 - 6));
	}
	ctx.putImageData(image, 0, 0);
	return canvas;
}
/** Full pipeline: frame -> detected page -> cropped, enhanced scan canvas. */
function scanDocument(frame) {
	const quad = detectDocumentQuad(frame, frame.width, frame.height);
	if (quad) {
		const warped = warpQuad(frame, quad);
		if (warped) return {
			canvas: enhanceScan(warped),
			cropped: true
		};
	}
	return {
		canvas: enhanceScan(frame),
		cropped: false
	};
}
var _jsxFileName$1 = "/app/applet/src/components/camera-capture.tsx";
function CameraCapture({ open, questionNo, onClose, onConfirm }) {
	const videoRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const overlayRef = (0, import_react.useRef)(null);
	const streamRef = (0, import_react.useRef)(null);
	const frameRef = (0, import_react.useRef)(null);
	const [error, setError] = (0, import_react.useState)(null);
	const [preview, setPreview] = (0, import_react.useState)(null);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [attempt, setAttempt] = (0, import_react.useState)(0);
	const [pageInFrame, setPageInFrame] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!open || preview) return;
		let cancelled = false;
		async function start() {
			setError(null);
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: { ideal: "environment" },
						width: { ideal: 1920 },
						height: { ideal: 1440 }
					},
					audio: false
				});
				if (cancelled) {
					stream.getTracks().forEach((t) => t.stop());
					return;
				}
				streamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
					await videoRef.current.play().catch(() => void 0);
				}
			} catch (err) {
				const name = err?.name;
				setError(name === "NotAllowedError" ? "Camera permission was denied. Allow camera access in your browser settings, then retry." : name === "NotFoundError" ? "No camera was found on this device." : "Could not open the camera. Please retry.");
			}
		}
		start();
		return () => {
			cancelled = true;
			streamRef.current?.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
		};
	}, [
		open,
		preview,
		attempt
	]);
	(0, import_react.useEffect)(() => {
		if (!open || preview || error) return;
		let timer;
		function tick() {
			const video = videoRef.current;
			const overlay = overlayRef.current;
			if (video && overlay && video.videoWidth) {
				const rect = video.getBoundingClientRect();
				overlay.width = Math.round(rect.width);
				overlay.height = Math.round(rect.height);
				const ctx = overlay.getContext("2d");
				if (ctx) {
					ctx.clearRect(0, 0, overlay.width, overlay.height);
					const quad = detectDocumentQuad(video, video.videoWidth, video.videoHeight);
					setPageInFrame(!!quad);
					if (quad) {
						const scale = Math.max(overlay.width / video.videoWidth, overlay.height / video.videoHeight);
						const offsetX = (overlay.width - video.videoWidth * scale) / 2;
						const offsetY = (overlay.height - video.videoHeight * scale) / 2;
						ctx.beginPath();
						quad.forEach((p, i) => {
							const x = p.x * scale + offsetX;
							const y = p.y * scale + offsetY;
							if (i === 0) ctx.moveTo(x, y);
							else ctx.lineTo(x, y);
						});
						ctx.closePath();
						ctx.strokeStyle = "rgba(13, 92, 82, 0.95)";
						ctx.lineWidth = 3;
						ctx.stroke();
						ctx.fillStyle = "rgba(13, 92, 82, 0.12)";
						ctx.fill();
					}
				}
			}
			timer = window.setTimeout(tick, 450);
		}
		timer = window.setTimeout(tick, 300);
		return () => {
			if (timer) window.clearTimeout(timer);
		};
	}, [
		open,
		preview,
		error
	]);
	(0, import_react.useEffect)(() => {
		if (!open) {
			setPreview(null);
			setError(null);
			setBusy(false);
			setPageInFrame(false);
		}
	}, [open]);
	if (!open) return null;
	function toPreview(canvas, cropped) {
		canvas.toBlob((blob) => {
			if (!blob) return;
			setPreview({
				url: URL.createObjectURL(blob),
				blob,
				cropped
			});
		}, "image/jpeg", .92);
	}
	function capture() {
		const video = videoRef.current;
		const canvas = canvasRef.current;
		if (!video || !canvas || !video.videoWidth) return;
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		const raw = document.createElement("canvas");
		raw.width = canvas.width;
		raw.height = canvas.height;
		raw.getContext("2d")?.drawImage(canvas, 0, 0);
		frameRef.current = raw;
		streamRef.current?.getTracks().forEach((t) => t.stop());
		streamRef.current = null;
		const { canvas: scanned, cropped } = scanDocument(canvas);
		toPreview(scanned, cropped);
	}
	function recrop() {
		const raw = frameRef.current;
		if (!raw) return;
		if (preview) URL.revokeObjectURL(preview.url);
		if (preview?.cropped) {
			const full = document.createElement("canvas");
			full.width = raw.width;
			full.height = raw.height;
			full.getContext("2d")?.drawImage(raw, 0, 0);
			toPreview(enhanceScan(full), false);
			return;
		}
		const copy = document.createElement("canvas");
		copy.width = raw.width;
		copy.height = raw.height;
		copy.getContext("2d", { willReadFrequently: true })?.drawImage(raw, 0, 0);
		const quad = detectDocumentQuad(copy, copy.width, copy.height);
		const warped = quad ? warpQuad(copy, quad) : null;
		if (warped) toPreview(enhanceScan(warped), true);
		else toPreview(enhanceScan(copy), false);
	}
	function retake() {
		if (preview) URL.revokeObjectURL(preview.url);
		setPreview(null);
	}
	async function use() {
		if (!preview) return;
		setBusy(true);
		try {
			await onConfirm(preview.blob);
			URL.revokeObjectURL(preview.url);
			setPreview(null);
			onClose();
		} finally {
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-[#e8eceb] shadow-2xl transition-all duration-300 dark:bg-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex items-center justify-between px-5 py-3.5 border-b border-border/40",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h3", {
						className: "font-display text-base font-bold text-foreground",
						children: [
							"Question ",
							questionNo,
							" Scanner"
						]
					}, void 0, true, {
						fileName: _jsxFileName$1,
						lineNumber: 221,
						columnNumber: 13
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
						className: "text-xs text-muted-foreground",
						children: "Frame handwritten page inside brackets"
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 224,
						columnNumber: 13
					}, this)] }, void 0, true, {
						fileName: _jsxFileName$1,
						lineNumber: 220,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
						type: "button",
						"aria-label": "Close camera",
						onClick: onClose,
						className: "flex size-8 items-center justify-center rounded-full bg-black/5 text-foreground transition hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20",
						children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(X, { className: "size-4" }, void 0, false, {
							fileName: _jsxFileName$1,
							lineNumber: 232,
							columnNumber: 13
						}, this)
					}, void 0, false, {
						fileName: _jsxFileName$1,
						lineNumber: 226,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName$1,
					lineNumber: 219,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "relative mx-4 my-2 aspect-[3/4] max-h-[58vh] overflow-hidden rounded-2xl bg-black shadow-inner sm:mx-6",
					children: [
						error ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-white",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
								className: "max-w-xs text-sm",
								children: error
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 240,
								columnNumber: 15
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, {
								variant: "secondary",
								size: "sm",
								onClick: () => setAttempt((a) => a + 1),
								className: "rounded-full",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(RefreshCw, { className: "mr-2 size-4" }, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 247,
									columnNumber: 17
								}, this), " Retry camera"]
							}, void 0, true, {
								fileName: _jsxFileName$1,
								lineNumber: 241,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName$1,
							lineNumber: 239,
							columnNumber: 13
						}, this) : preview ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", {
							src: preview.url,
							alt: "Scanned answer page",
							className: "h-full w-full object-contain bg-neutral-900"
						}, void 0, false, {
							fileName: _jsxFileName$1,
							lineNumber: 251,
							columnNumber: 13
						}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("video", {
								ref: videoRef,
								playsInline: true,
								muted: true,
								autoPlay: true,
								className: "h-full w-full object-cover"
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 258,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("canvas", {
								ref: overlayRef,
								className: "pointer-events-none absolute inset-0 h-full w-full"
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 265,
								columnNumber: 15
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "pointer-events-none absolute inset-4 border border-white/25 sm:inset-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "absolute -left-1 -top-1 size-6 border-l-4 border-t-4 border-white shadow-sm" }, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 273,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "absolute -right-1 -top-1 size-6 border-r-4 border-t-4 border-white shadow-sm" }, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 274,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "absolute -bottom-1 -left-1 size-6 border-b-4 border-l-4 border-white shadow-sm" }, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 275,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "absolute -bottom-1 -right-1 size-6 border-b-4 border-r-4 border-white shadow-sm" }, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 276,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "absolute inset-x-0 top-1/3 border-b border-white/15 border-dashed" }, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 279,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "absolute inset-x-0 top-2/3 border-b border-white/15 border-dashed" }, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 280,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "absolute inset-y-0 left-1/3 border-r border-white/15 border-dashed" }, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 281,
										columnNumber: 17
									}, this),
									/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "absolute inset-y-0 left-2/3 border-r border-white/15 border-dashed" }, void 0, false, {
										fileName: _jsxFileName$1,
										lineNumber: 282,
										columnNumber: 17
									}, this)
								]
							}, void 0, true, {
								fileName: _jsxFileName$1,
								lineNumber: 271,
								columnNumber: 15
							}, this)
						] }, void 0, true, {
							fileName: _jsxFileName$1,
							lineNumber: 257,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("canvas", {
							ref: canvasRef,
							className: "hidden"
						}, void 0, false, {
							fileName: _jsxFileName$1,
							lineNumber: 286,
							columnNumber: 11
						}, this),
						!error && /* @__PURE__ */ (void 0)("div", {
							className: "pointer-events-none absolute inset-x-0 bottom-3 flex justify-center",
							children: /* @__PURE__ */ (void 0)("span", {
								className: "flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-[11px] font-medium text-white shadow-md backdrop-blur-md",
								children: [/* @__PURE__ */ (void 0)(ScanLine, { className: "size-3 text-emerald-400" }, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 292,
									columnNumber: 17
								}, this), preview ? preview.cropped ? "Page detected & optimized" : "Full frame capture" : pageInFrame ? "Page detected — ready" : "Align paper inside frame"]
							}, void 0, true, {
								fileName: _jsxFileName$1,
								lineNumber: 291,
								columnNumber: 15
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName$1,
							lineNumber: 290,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName$1,
					lineNumber: 237,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex items-center justify-between px-6 py-4 sm:px-8",
					children: preview ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(import_jsx_dev_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							type: "button",
							onClick: retake,
							disabled: busy,
							className: "text-sm font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-50",
							children: "Retake"
						}, void 0, false, {
							fileName: _jsxFileName$1,
							lineNumber: 309,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							type: "button",
							onClick: recrop,
							disabled: busy,
							className: "flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:bg-accent disabled:opacity-50",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Crop, { className: "size-3.5 text-muted-foreground" }, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 324,
								columnNumber: 17
							}, this), preview.cropped ? "Full view" : "Auto-crop"]
						}, void 0, true, {
							fileName: _jsxFileName$1,
							lineNumber: 318,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
							type: "button",
							onClick: use,
							disabled: busy,
							className: "flex items-center gap-1.5 text-sm font-bold text-[#0d5c52] transition hover:text-[#09423b] disabled:opacity-50 dark:text-emerald-400",
							children: [busy ? "Saving…" : "Use This Photo", /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Check, { className: "size-4" }, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 335,
								columnNumber: 17
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName$1,
							lineNumber: 328,
							columnNumber: 15
						}, this)
					] }, void 0, true, {
						fileName: _jsxFileName$1,
						lineNumber: 308,
						columnNumber: 13
					}, this) : !error && /* @__PURE__ */ (void 0)(import_jsx_dev_runtime.Fragment, { children: [
						/* @__PURE__ */ (void 0)("button", {
							type: "button",
							onClick: onClose,
							className: "text-sm font-semibold text-muted-foreground transition hover:text-foreground",
							children: "Cancel"
						}, void 0, false, {
							fileName: _jsxFileName$1,
							lineNumber: 341,
							columnNumber: 17
						}, this),
						/* @__PURE__ */ (void 0)("button", {
							type: "button",
							onClick: capture,
							"aria-label": "Capture photo",
							className: "group relative flex size-18 items-center justify-center rounded-full border-4 border-slate-300 bg-gradient-to-b from-slate-100 to-slate-200 shadow-lg transition-transform active:scale-90 dark:border-slate-600 dark:from-slate-700 dark:to-slate-800 sm:size-20",
							children: /* @__PURE__ */ (void 0)("div", {
								className: "flex size-14 items-center justify-center rounded-full bg-white shadow-inner transition group-hover:scale-95 dark:bg-slate-900",
								children: /* @__PURE__ */ (void 0)(Aperture, { className: "size-8 text-slate-700 transition group-hover:rotate-45 dark:text-slate-200" }, void 0, false, {
									fileName: _jsxFileName$1,
									lineNumber: 357,
									columnNumber: 21
								}, this)
							}, void 0, false, {
								fileName: _jsxFileName$1,
								lineNumber: 356,
								columnNumber: 19
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName$1,
							lineNumber: 350,
							columnNumber: 17
						}, this),
						/* @__PURE__ */ (void 0)("div", {
							className: "w-12 text-right",
							children: /* @__PURE__ */ (void 0)("span", {
								className: "text-xs text-muted-foreground font-medium",
								children: ["Q", questionNo]
							}, void 0, true, {
								fileName: _jsxFileName$1,
								lineNumber: 362,
								columnNumber: 19
							}, this)
						}, void 0, false, {
							fileName: _jsxFileName$1,
							lineNumber: 361,
							columnNumber: 17
						}, this)
					] }, void 0, true, {
						fileName: _jsxFileName$1,
						lineNumber: 340,
						columnNumber: 15
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 306,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName$1,
			lineNumber: 217,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName$1,
		lineNumber: 215,
		columnNumber: 5
	}, this);
}
var _jsxFileName = "/app/applet/src/routes/_authenticated/student/assignments.$assignmentId.tsx?tsr-split=component";
function StudentAssignmentPage() {
	const { assignmentId } = Route$4.useParams();
	const queryClient = useQueryClient();
	const { data: profile } = useProfile();
	const [captureQuestion, setCaptureQuestion] = (0, import_react.useState)(null);
	const assignment = useQuery({
		queryKey: ["assignment", assignmentId],
		queryFn: () => getAssignment(assignmentId)
	});
	const paperUrl = useSignedUrl("question-papers", assignment.data?.question_paper_url);
	const submission = useQuery({
		queryKey: [
			"my-submission",
			assignmentId,
			profile?.id
		],
		enabled: !!profile?.id,
		queryFn: async () => {
			return (await listSubmissions(assignmentId)).find((s) => s.student_id === profile.id) ?? null;
		}
	});
	const pages = useQuery({
		queryKey: ["pages", submission.data?.id],
		enabled: !!submission.data?.id,
		queryFn: () => listPages(submission.data.id)
	});
	const locked = !assignment.data?.is_open || submission.data?.status === "submitted";
	const upload = useMutation({
		mutationFn: async ({ blob, questionNo }) => {
			if (!profile) throw new Error("Missing profile");
			const record = submission.data ?? await getOrCreateSubmission(assignmentId, profile.id);
			const path = `${assignmentId}/${profile.id}/q${questionNo}-${Date.now()}.jpg`;
			const { error: uploadError } = await supabase.storage.from("submission-scans").upload(path, blob, { contentType: "image/jpeg" });
			if (uploadError) throw uploadError;
			const { error } = await supabase.from("submission_pages").insert({
				submission_id: record.id,
				question_no: questionNo,
				image_url: path
			});
			if (error) throw error;
		},
		onSuccess: (_, variables) => {
			toast.custom(() => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "flex items-center gap-2 rounded-full bg-white px-4 py-2.5 font-medium text-slate-800 shadow-xl ring-1 ring-black/10 dark:bg-slate-900 dark:text-white",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(CircleCheck, { className: "size-5 text-emerald-500" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 70,
					columnNumber: 13
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
					className: "text-sm font-semibold",
					children: [
						"Photo added to Question ",
						variables.questionNo,
						" locally!"
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 71,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 69,
				columnNumber: 26
			}, this), { duration: 3e3 });
			queryClient.invalidateQueries({ queryKey: [
				"my-submission",
				assignmentId,
				profile?.id
			] });
			queryClient.invalidateQueries({ queryKey: ["pages"] });
			setCaptureQuestion(null);
		},
		onError: (error) => toast.error(error.message)
	});
	const removeScan = useMutation({
		mutationFn: async (pageId) => {
			await deletePage(pageId);
		},
		onSuccess: () => {
			toast.success("Photo removed");
			queryClient.invalidateQueries({ queryKey: ["pages"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const submit = useMutation({
		mutationFn: async () => {
			if (!submission.data) throw new Error("Capture at least one answer first");
			const { error } = await supabase.from("submissions").update({
				status: "submitted",
				submitted_at: (/* @__PURE__ */ new Date()).toISOString()
			}).eq("id", submission.data.id);
			if (error) throw error;
		},
		onSuccess: () => {
			toast.success("Assignment submitted successfully!");
			queryClient.invalidateQueries({ queryKey: [
				"my-submission",
				assignmentId,
				profile?.id
			] });
			queryClient.invalidateQueries({ queryKey: ["submissions"] });
		},
		onError: (error) => toast.error(error.message)
	});
	const marks = useQuery({
		queryKey: ["question-marks", submission.data?.id],
		enabled: !!submission.data?.id,
		queryFn: async () => {
			const { data, error } = await supabase.from("question_marks").select("*").eq("submission_id", submission.data.id);
			if (error) throw error;
			return data ?? [];
		}
	});
	const totalQuestions = assignment.data?.total_questions ?? 0;
	const questions = Array.from({ length: totalQuestions }, (_, i) => i + 1);
	const answeredQuestionsCount = questions.filter((q) => pages.data?.some((p) => p.question_no === q)).length;
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(AppShell, {
		profile: profile ?? null,
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "flex items-center gap-2 text-sm font-medium text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Link, {
								to: "/student",
								className: "flex items-center gap-1 transition hover:text-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ArrowLeft, { className: "size-4" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 146,
									columnNumber: 15
								}, this), " Assignments"]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 145,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { children: "/" }, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 148,
								columnNumber: 13
							}, this),
							/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
								className: "text-foreground font-semibold",
								children: assignment.data?.title ?? "Assignment"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 149,
								columnNumber: 13
							}, this)
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 144,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
						className: "mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
						children: assignment.data?.title ?? "Student Dashboard"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 153,
						columnNumber: 11
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
						className: "text-xs text-muted-foreground sm:text-sm",
						children: [
							"Assignment #",
							assignment.data?.assignment_no,
							" • ",
							totalQuestions,
							" questions total"
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 156,
						columnNumber: 11
					}, this)
				] }, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 143,
					columnNumber: 9
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex items-center gap-3",
					children: paperUrl && /* @__PURE__ */ (void 0)("a", {
						href: paperUrl,
						target: "_blank",
						rel: "noreferrer",
						className: "inline-flex items-center gap-2 rounded-xl border border-[#b8ded4] bg-white/90 px-4 py-2.5 text-sm font-semibold text-[#0d5c52] shadow-xs transition hover:bg-[#e6f2ee] dark:border-slate-700 dark:bg-card dark:text-emerald-400 dark:hover:bg-slate-800",
						children: [/* @__PURE__ */ (void 0)(FileText, { className: "size-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 163,
							columnNumber: 15
						}, this), /* @__PURE__ */ (void 0)("span", { children: "Question Paper" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 164,
							columnNumber: 15
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 162,
						columnNumber: 24
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 161,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 142,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "space-y-4",
				children: questions.map((questionNo) => {
					const capturedPages = pages.data?.filter((p) => p.question_no === questionNo) ?? [];
					const mark = marks.data?.find((m) => m.question_no === questionNo);
					const hasPhoto = capturedPages.length > 0;
					return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-4 shadow-xs transition-all hover:border-[#0d5c52]/30 hover:shadow-md sm:p-5 dark:bg-card",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex items-center gap-2",
									children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h3", {
										className: "font-display text-base font-bold text-foreground sm:text-lg",
										children: ["Question #", questionNo]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 180,
										columnNumber: 21
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 179,
									columnNumber: 19
								}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
									className: "flex items-center gap-2 pt-1",
									children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
										className: "inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: "size-1.5 rounded-full bg-emerald-600" }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 188,
											columnNumber: 23
										}, this), "Open"]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 187,
										columnNumber: 21
									}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
										className: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${hasPhoto ? "bg-[#e2f1ec] text-[#0d5c52] dark:bg-teal-950/50 dark:text-teal-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`,
										children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", { className: `size-1.5 rounded-full ${hasPhoto ? "bg-[#0d5c52]" : "bg-slate-400"}` }, void 0, false, {
											fileName: _jsxFileName,
											lineNumber: 192,
											columnNumber: 23
										}, this), hasPhoto ? `${capturedPages.length} Photo${capturedPages.length > 1 ? "s" : ""}` : "Not submitted"]
									}, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 191,
										columnNumber: 21
									}, this)]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 186,
									columnNumber: 19
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 178,
								columnNumber: 17
							}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
								className: "flex flex-wrap items-center gap-3",
								children: [capturedPages.map((page) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(PageThumbnail, {
									page,
									locked,
									onDelete: () => removeScan.mutate(page.id),
									onRetake: () => setCaptureQuestion(questionNo)
								}, page.id, false, {
									fileName: _jsxFileName,
									lineNumber: 201,
									columnNumber: 46
								}, this)), !locked && /* @__PURE__ */ (void 0)("button", {
									type: "button",
									onClick: () => setCaptureQuestion(questionNo),
									className: `flex items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm font-semibold transition ${hasPhoto ? "border-border bg-secondary/40 text-foreground hover:bg-secondary" : "border-[#0d5c52]/40 bg-[#0d5c52]/5 text-[#0d5c52] hover:bg-[#0d5c52]/10 dark:text-teal-300"}`,
									children: hasPhoto ? /* @__PURE__ */ (void 0)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (void 0)(Plus, { className: "size-4" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 206,
										columnNumber: 27
									}, this), " Add Page"] }, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 205,
										columnNumber: 35
									}, this) : /* @__PURE__ */ (void 0)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (void 0)(Camera, { className: "size-4" }, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 208,
										columnNumber: 27
									}, this), " Scan Answer"] }, void 0, true, {
										fileName: _jsxFileName,
										lineNumber: 207,
										columnNumber: 31
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 204,
									columnNumber: 31
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 199,
								columnNumber: 17
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 176,
							columnNumber: 15
						}, this), mark?.marks_awarded !== null && mark?.marks_awarded !== void 0 || mark?.feedback ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
							className: "mt-4 rounded-xl border border-[#b8ded4] bg-[#e6f2ee]/50 p-3.5 dark:border-teal-900/50 dark:bg-teal-950/30",
							children: [mark?.marks_awarded !== null && mark?.marks_awarded !== void 0 && /* @__PURE__ */ (void 0)("div", {
								className: "flex items-center justify-between text-xs font-bold text-[#0d5c52] dark:text-teal-300",
								children: [/* @__PURE__ */ (void 0)("span", { children: "Question Score" }, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 217,
									columnNumber: 23
								}, this), /* @__PURE__ */ (void 0)("span", {
									className: "rounded-md bg-white px-2 py-1 shadow-xs dark:bg-slate-900",
									children: [mark.marks_awarded, " Marks"]
								}, void 0, true, {
									fileName: _jsxFileName,
									lineNumber: 218,
									columnNumber: 23
								}, this)]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 216,
								columnNumber: 89
							}, this), mark?.feedback && /* @__PURE__ */ (void 0)("p", {
								className: "mt-2 text-sm text-foreground/90",
								children: [/* @__PURE__ */ (void 0)("span", {
									className: "font-semibold text-foreground",
									children: "Teacher feedback: "
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 223,
									columnNumber: 23
								}, this), mark.feedback]
							}, void 0, true, {
								fileName: _jsxFileName,
								lineNumber: 222,
								columnNumber: 38
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 215,
							columnNumber: 102
						}, this) : null]
					}, questionNo, true, {
						fileName: _jsxFileName,
						lineNumber: 175,
						columnNumber: 16
					}, this);
				})
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 170,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "sticky bottom-4 mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur-md dark:bg-card/95",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
						className: "font-display text-sm font-bold text-foreground",
						children: [
							answeredQuestionsCount,
							"/",
							totalQuestions,
							" questions"
						]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 234,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
						className: "text-sm text-muted-foreground",
						children: "have photos captured"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 237,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 233,
					columnNumber: 9
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "flex items-center gap-3",
					children: submission.data?.status === "submitted" ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
						className: "inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(CircleCheck, { className: "size-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 242,
							columnNumber: 15
						}, this), " Submitted"]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 241,
						columnNumber: 54
					}, this) : !assignment.data?.is_open ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("span", {
						className: "text-sm font-medium text-destructive",
						children: "Submission closed"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 243,
						columnNumber: 51
					}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, {
						size: "lg",
						disabled: submit.isPending || !pages.data?.length,
						onClick: () => submit.mutate(),
						className: "h-11 rounded-xl bg-[#0d5c52] px-6 text-sm font-bold text-white shadow-md transition hover:bg-[#0a4840] active:scale-[0.98] dark:bg-emerald-600 dark:hover:bg-emerald-700",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Send, { className: "mr-2 size-4" }, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 244,
							columnNumber: 15
						}, this), submit.isPending ? "Submitting…" : "Submit Assignment"]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 243,
						columnNumber: 133
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 240,
					columnNumber: 9
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 232,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(CameraCapture, {
				open: captureQuestion !== null,
				questionNo: captureQuestion ?? 1,
				onClose: () => setCaptureQuestion(null),
				onConfirm: async (blob) => {
					await upload.mutateAsync({
						blob,
						questionNo: captureQuestion ?? 1
					});
				}
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 251,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 140,
		columnNumber: 10
	}, this);
}
function PageThumbnail({ page, locked, onDelete, onRetake }) {
	const url = useSignedUrl("submission-scans", page.image_url);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "group/thumb relative h-20 w-16 overflow-hidden rounded-lg border border-border bg-muted shadow-xs transition hover:shadow-md sm:h-24 sm:w-20",
		children: [url ? /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("img", {
			src: url,
			alt: `Question ${page.question_no} scan`,
			className: "h-full w-full object-cover"
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 272,
			columnNumber: 14
		}, this) : /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { className: "h-full w-full animate-pulse bg-slate-200 dark:bg-slate-800" }, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 272,
			columnNumber: 115
		}, this), !locked && /* @__PURE__ */ (void 0)("div", {
			className: "absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 transition group-hover/thumb:opacity-100",
			children: [/* @__PURE__ */ (void 0)("button", {
				type: "button",
				"aria-label": "Delete photo",
				onClick: onDelete,
				className: "flex size-7 items-center justify-center rounded-full bg-red-600/90 text-white shadow-sm transition hover:scale-110 hover:bg-red-600",
				children: /* @__PURE__ */ (void 0)(Trash2, { className: "size-3.5" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 277,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 276,
				columnNumber: 11
			}, this), /* @__PURE__ */ (void 0)("button", {
				type: "button",
				"aria-label": "Retake photo",
				onClick: onRetake,
				className: "flex size-7 items-center justify-center rounded-full bg-slate-700/90 text-white shadow-sm transition hover:scale-110 hover:bg-slate-700",
				children: /* @__PURE__ */ (void 0)(RotateCw, { className: "size-3.5" }, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 280,
					columnNumber: 13
				}, this)
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 279,
				columnNumber: 11
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 275,
			columnNumber: 19
		}, this)]
	}, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 271,
		columnNumber: 10
	}, this);
}
//#endregion
export { StudentAssignmentPage as component };
