export const MAX_TEXT_CHARS = 120_000;

export function buildUserPrompt(
	extractedText: string,
	fileName: string,
): string {
	const text =
		extractedText.length > MAX_TEXT_CHARS
			? extractedText.slice(0, MAX_TEXT_CHARS)
			: extractedText;

	return `El libro a criticar se llama "${fileName}".

A continuación va el texto extraído del PDF (puede estar incompleto o con errores de extracción):

--- INICIO DEL TEXTO ---
${text}
--- FIN DEL TEXTO ---

Escribe la crítica siguiendo la estructura indicada y en el idioma del texto.`;
}