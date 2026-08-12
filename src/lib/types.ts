export interface CritiqueResponse {
	fileName: string;
	pageCount: number;
	critique: string;
	model: string;
}

export interface CritiqueErrorResponse {
	error: string;
}