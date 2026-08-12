import "./pdf-polyfill";
import { PDFParse } from "pdf-parse";

export interface ExtractedText {
	text: string;
	pages: number;
}

export class PdfExtractionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PdfExtractionError";
	}
}

export async function extractTextFromPdf(
	data: ArrayBuffer,
): Promise<ExtractedText> {
	const parser = new PDFParse({ data });
	try {
		const result = await parser.getText();
		const text = result.text.trim();
		if (!text) {
			throw new PdfExtractionError(
				"No se pudo extraer texto del PDF. Es posible que el documento sea un escaneo (imágenes) sin capa de texto.",
			);
		}
		return { text, pages: result.total };
	} finally {
		await parser.destroy().catch(() => {});
	}
}