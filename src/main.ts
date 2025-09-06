import "./style.css";

import { patch } from "./ips.ts";

let inputFile: Uint8Array | undefined = undefined;
let patchFile: Uint8Array | undefined = undefined;

let inputExt: string = "bin";

let outputFilename: string = "PatchedROM";
let outputExt: string = "bin";

document.querySelector<HTMLInputElement>("#input_file")!.addEventListener("change", (ev) => {
	const target = ev.target as HTMLInputElement;

	if (!target.files) throw new Error("No files in change event");

	const file = target.files[0];

	inputExt = file.name.split(".").pop()!;

	const reader = new FileReader();

	reader.addEventListener(
		"load",
		(ev) => {
			const dataBuffer = ev.target?.result as ArrayBuffer;
			inputFile = new Uint8Array(dataBuffer);
		},
		{ once: true }
	);

	reader.addEventListener(
		"error",
		(ev) => {
			throw ev.target?.error;
		},
		{ once: true }
	);

	reader.readAsArrayBuffer(file);
});

document.querySelector<HTMLInputElement>("#input_patch")!.addEventListener("change", (ev) => {
	const target = ev.target as HTMLInputElement;

	if (!target.files) throw new Error("No files in change event");

	const file = target.files[0];

	outputFilename = file.name.split(".").slice(0, -1).join(".");

	const reader = new FileReader();

	reader.addEventListener(
		"load",
		(ev) => {
			const dataBuffer = ev.target?.result as ArrayBuffer;
			patchFile = new Uint8Array(dataBuffer);
		},
		{ once: true }
	);

	reader.addEventListener(
		"error",
		(ev) => {
			throw ev.target?.error;
		},
		{ once: true }
	);

	reader.readAsArrayBuffer(file);
});

document.querySelector<HTMLFormElement>("#form")!.addEventListener("submit", (ev) => {
	ev.preventDefault();

	if (!inputFile || !patchFile) throw new Error("Invalid input or patch file");

	const patchedBytes = patch(inputFile, patchFile);

	const blob = new Blob([patchedBytes.buffer as BlobPart], { type: "application/octet-stream" });
	const blobUrl = URL.createObjectURL(blob);

	outputExt = inputExt;

	const a = document.createElement("a");
	a.href = blobUrl;
	a.download = `${outputFilename}.${outputExt}`;
	a.click();
});
