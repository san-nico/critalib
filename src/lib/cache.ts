import { crc32 } from "node:zlib";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface CritiqueCacheEntry {
	hash: string;
	fileName: string;
	pageCount: number;
	model: string;
	cachedAt: string;
	markdown: string;
}

const inflight = new Map<string, Promise<unknown>>();

function resolveCacheDir(): string {
	const envDir = process.env.CRITIQUE_CACHE_DIR;
	if (envDir) {
		return path.resolve(envDir);
	}
	if (process.env.VERCEL) {
		return path.join("/tmp", "critique-cache");
	}
	return path.join(process.cwd(), ".critique-cache");
}

export function computeDocumentHash(data: Buffer): string {
	return (crc32(data) >>> 0).toString(16).padStart(8, "0");
}

function markdownPath(hash: string): string {
	return path.join(resolveCacheDir(), `${hash}.md`);
}

function metaPath(hash: string): string {
	return path.join(resolveCacheDir(), `${hash}.meta.json`);
}

export async function hasCachedCritique(hash: string): Promise<boolean> {
	return existsSync(markdownPath(hash)) && existsSync(metaPath(hash));
}

export async function readCachedCritique(
	hash: string,
): Promise<Omit<CritiqueCacheEntry, "hash"> | null> {
	const md = markdownPath(hash);
	const meta = metaPath(hash);
	if (!existsSync(md) || !existsSync(meta)) {
		return null;
	}

	const raw = JSON.parse(await readFile(meta, "utf8")) as {
		fileName: string;
		pageCount: number;
		model: string;
		cachedAt: string;
	};

	return {
		fileName: raw.fileName,
		pageCount: raw.pageCount,
		model: raw.model,
		cachedAt: raw.cachedAt,
		markdown: await readFile(md, "utf8"),
	};
}

export async function writeCachedCritique(entry: {
	hash: string;
	fileName: string;
	pageCount: number;
	model: string;
	markdown: string;
}): Promise<void> {
	const dir = resolveCacheDir();
	await mkdir(dir, { recursive: true });
	await writeFile(markdownPath(entry.hash), entry.markdown, "utf8");
	await writeFile(
		metaPath(entry.hash),
		JSON.stringify(
			{
				fileName: entry.fileName,
				pageCount: entry.pageCount,
				model: entry.model,
				cachedAt: new Date().toISOString(),
			},
			null,
			2,
		),
		"utf8",
	);
}

export function withCacheLock<T>(hash: string, fn: () => Promise<T>): Promise<T> {
	const existing = inflight.get(hash);
	if (existing) {
		return existing as Promise<T>;
	}

	const run = fn().finally(() => inflight.delete(hash));
	inflight.set(hash, run);
	return run;
}