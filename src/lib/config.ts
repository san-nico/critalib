export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_MODEL = "deepseek/deepseek-chat";

export const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY as
  | string
  | undefined;

export const OPENROUTER_SITE_TITLE = "critalib";
export const OPENROUTER_REFERER = "http://localhost:3000";

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024);
export const ACCEPTED_MIME_TYPE = "application/pdf";