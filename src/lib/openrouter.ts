import {
	OPENROUTER_API_KEY,
	OPENROUTER_MODEL,
	OPENROUTER_REFERER,
	OPENROUTER_SITE_TITLE,
	OPENROUTER_URL,
} from "./config";

export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export class OpenRouterError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "OpenRouterError";
		this.status = status;
	}
}

export async function requestCritique(
	messages: ChatMessage[],
): Promise<string> {
	if (!OPENROUTER_API_KEY) {
		throw new Error(
			"Falta configurar OPENROUTER_API_KEY en el archivo .env del servidor.",
		);
	}

	const response = await fetch(OPENROUTER_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${OPENROUTER_API_KEY}`,
			"Content-Type": "application/json",
			"HTTP-Referer": OPENROUTER_REFERER,
			"X-Title": OPENROUTER_SITE_TITLE,
		},
		body: JSON.stringify({
			model: OPENROUTER_MODEL,
			messages,
		}),
	});

	if (!response.ok) {
		const detail = await response.text();
		throw new OpenRouterError(
			`OpenRouter respondió con estado ${response.status}: ${detail}`,
			response.status,
		);
	}

	const result = await response.json();
	const content: string | undefined =
		result?.choices?.[0]?.message?.content;

	return content ?? "";
}