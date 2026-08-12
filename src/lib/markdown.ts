import { marked, type TokensList } from "marked";

export function renderMarkdown(markdown: string): string {
	return marked.parse(markdown, {
		async: false,
		gfm: true,
		breaks: true,
	}) as string;
}

export function truncateFileName(fileName: string, max = 48): string {
	return fileName.length > max
		? `${fileName.slice(0, max - 3)}...`
		: fileName;
}

export type { TokensList };