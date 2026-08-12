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