import type { APIContext } from "astro";
import { Readable } from "node:stream";
import Busboy from "busboy";

import {
	ACCEPTED_MIME_TYPE,
	MAX_FILE_SIZE_BYTES,
	MAX_FILE_SIZE_MB,
	OPENROUTER_MODEL,
} from "../../lib/config";
import { extractTextFromPdf } from "../../lib/pdf";
import { requestCritique, type ChatMessage } from "../../lib/openrouter";
import { buildUserPrompt, SYSTEM_PROMPT } from "../../lib/prompts";
import {
	computeDocumentHash,
	readCachedCritique,
	withCacheLock,
	writeCachedCritique,
	type CritiqueCacheEntry,
} from "../../lib/cache";

interface UploadedFile {
	fileName: string;
	mimeType: string;
	data: Buffer;
}

function parseMultipart(request: Request): Promise<UploadedFile> {
	return new Promise((resolve, reject) => {
		const headers = Object.fromEntries(request.headers.entries());

		const busboy = Busboy({
			headers,
			limits: {
				files: 1,
				fields: 0,
				fileSize: MAX_FILE_SIZE_BYTES,
			},
		});

		const chunks: Buffer[] = [];
		let uploaded: UploadedFile | undefined;

		busboy.on(
			"file",
			(_fieldName, file, { filename, mimeType }) => {
				file.on("data", (chunk: Buffer) => {
					chunks.push(chunk);
				});
				file.on("limit", () => {
					reject(
						new Error(
							`El archivo supera el límite de ${MAX_FILE_SIZE_MB} MB.`,
						),
					);
				});
				file.on("end", () => {
					uploaded = {
						fileName: filename,
						mimeType,
						data: Buffer.concat(chunks),
					};
				});
			},
		);

		busboy.on("error", (err) => {
			reject(err);
		});

		busboy.on("finish", () => {
			if (uploaded) {
				resolve(uploaded);
			} else {
				reject(new Error("No se recibió ningún archivo."));
			}
		});

		Readable.fromWeb(
			request.body as ReadableStream<Uint8Array>,
		).pipe(busboy);
	});
}

function validateUpload(upload: UploadedFile): string {
	if (
		!upload.fileName.toLowerCase().endsWith(".pdf") ||
		upload.mimeType !== ACCEPTED_MIME_TYPE
	) {
		return "Solo se permiten archivos PDF.";
	}

	if (upload.data.length === 0) {
		return "El archivo PDF está vacío.";
	}

	if (upload.data.length > MAX_FILE_SIZE_BYTES) {
		return `El archivo supera el límite de ${MAX_FILE_SIZE_MB} MB.`;
	}

	return "";
}

export const POST = async ({ request }: APIContext): Promise<Response> => {
	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			const encoder = new TextEncoder();
			const send = (data: unknown) => {
				controller.enqueue(
					encoder.encode(`${JSON.stringify(data)}\n`),
				);
			};

			try {
				send({ event: "uploading" });

				let upload: UploadedFile;
				try {
					upload = await parseMultipart(request);
				} catch {
					send({
						event: "error",
						error: "No se pudo procesar la subida del archivo.",
					});
					return;
				}

				const validationError = validateUpload(upload);
				if (validationError) {
					send({ event: "error", error: validationError });
					return;
				}

				const hash = computeDocumentHash(upload.data);

				let entry: Omit<CritiqueCacheEntry, "hash"> | null =
					await readCachedCritique(hash);
				let fromCache = entry !== null;

				if (!entry) {
					entry = await withCacheLock(hash, async () => {
						const existing = await readCachedCritique(hash);
						if (existing) {
							fromCache = true;
							return existing;
						}

						send({ event: "extracting" });

						let text: string;
						let pages: number;
						try {
							const extracted = await extractTextFromPdf(
								upload.data,
							);
							text = extracted.text;
							pages = extracted.pages;
						} catch (error) {
							const message =
								error instanceof Error
									? error.message
									: "No se pudo extraer el texto del PDF.";
							send({ event: "error", error: message });
							return null;
						}

						const messages: ChatMessage[] = [
							{ role: "system", content: SYSTEM_PROMPT },
							{
								role: "user",
								content: buildUserPrompt(
									text,
									upload.fileName,
								),
							},
						];

						send({ event: "critiquing" });

						let critique: string;
						try {
							critique = await requestCritique(messages);
						} catch (error) {
							const message =
								error instanceof Error
									? error.message
									: "El servicio de crítica no respondió.";
							send({ event: "error", error: message });
							return null;
						}

						const created = {
							fileName: upload.fileName,
							pageCount: pages,
							model: OPENROUTER_MODEL,
							cachedAt: new Date().toISOString(),
							markdown: critique,
						};

						await writeCachedCritique({
							hash,
							fileName: created.fileName,
							pageCount: created.pageCount,
							model: created.model,
							markdown: created.markdown,
						});

						return created;
					});
				}

				if (!entry) {
					return;
				}

				if (fromCache) {
					send({ event: "cached" });
				}

				send({
					event: "done",
					result: {
						fileName: entry.fileName,
						pageCount: entry.pageCount,
						model: entry.model,
						critique: entry.markdown,
						cached: fromCache,
					},
				});
			} finally {
				controller.close();
			}
		},
	});

	return new Response(stream, {
		status: 200,
		headers: {
			"Content-Type": "application/x-ndjson; charset=utf-8",
			"Cache-Control": "no-cache, no-transform",
			"X-Accel-Buffering": "no",
		},
	});
};