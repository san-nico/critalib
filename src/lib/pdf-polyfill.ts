import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";
import {
	DOMMatrix,
	DOMPoint,
	DOMRect,
	ImageData,
	Path2D,
} from "@napi-rs/canvas";

const g = globalThis as Record<string, unknown>;

const polyfills: Record<string, unknown> = {
	DOMMatrix,
	DOMPoint,
	DOMRect,
	ImageData,
	Path2D,
};

for (const [name, value] of Object.entries(polyfills)) {
	if (!(name in g)) {
		g[name] = value;
	}
}

// pdfjs-dist ships `pdf.worker.mjs` as a dynamic import that Vercel's serverless
// bundler does not trace, so at runtime it can't find the file. Exposing the
// statically-imported worker via globalThis lets pdfjs run its "fake worker"
// entirely on the main thread instead of resolving workerSrc at runtime.
if (!("pdfjsWorker" in g)) {
	g.pdfjsWorker = pdfjsWorker;
}