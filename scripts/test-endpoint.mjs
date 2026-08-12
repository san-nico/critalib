import { readFileSync } from "node:fs";

const filePath = process.argv[2];
const baseUrl = process.argv[3] ?? "http://localhost:4321";
const pdf = readFileSync(filePath);

const form = new FormData();
form.append("file", new Blob([pdf], { type: "application/pdf" }), "prueba.pdf");

const res = await fetch(`${baseUrl}/api/critique`, {
	method: "POST",
	headers: { Origin: baseUrl },
	body: form,
});
console.log("status:", res.status);
if (!res.ok || !res.body) {
	console.log("error:", res.status);
	process.exit(1);
}

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
let result;

while (true) {
	const { done, value } = await reader.read();
	if (done) break;
	buffer += decoder.decode(value, { stream: true });
	const lines = buffer.split("\n");
	buffer = lines.pop() ?? "";
	for (const line of lines) {
		if (!line.trim()) continue;
		const message = JSON.parse(line);
		if (message.event === "error") {
			console.log("error:", message.error);
			process.exit(1);
		}
		console.log("event:", message.event);
		result = message.result ?? result;
	}
}

if (!result) {
	console.log("error: the server did not return a critique");
	process.exit(1);
}
console.log("fileName:", result.fileName);
console.log("pageCount:", result.pageCount);
console.log("model:", result.model);
console.log("critique (first 300 chars):");
console.log(result.critique.slice(0, 300));