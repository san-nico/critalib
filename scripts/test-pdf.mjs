import { PDFParse } from "pdf-parse";
import { readFile } from "node:fs/promises";

const [filePath] = process.argv.slice(2);
const buf = await readFile(filePath);
const parser = new PDFParse({ data: buf });
try {
	const result = await parser.getText();
	console.log("TEXT:", result.text.trim());
	console.log("TOTAL:", result.total);
} finally {
	await parser.destroy();
}