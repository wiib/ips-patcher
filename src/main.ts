import "./style.css";

import IPSPatcher from "./patchers/ips.ts";
import Logger from "./logger.ts";

let inputExt: string = "bin";

let outputFilename: string = "PatchedROM";
let outputExt: string = "bin";

const logger = Logger.instance;
const ipsPatcher = new IPSPatcher();

document.addEventListener("DOMContentLoaded", (ev) => {
	const preElement = document.querySelector<HTMLPreElement>("#log")!;
	logger.setDestination(preElement);
});

document.querySelector<HTMLInputElement>("#input_file")!.addEventListener("change", (ev) => {
	const target = ev.target as HTMLInputElement;

	if (!target.files) throw new Error("No files in change event");

	const file = target.files[0];
	ipsPatcher.loadRomFile(file);

	inputExt = file.name.split(".").pop()!;
});

document.querySelector<HTMLInputElement>("#input_patch")!.addEventListener("change", (ev) => {
	const target = ev.target as HTMLInputElement;

	if (!target.files) throw new Error("No files in change event");

	const file = target.files[0];
	ipsPatcher.loadPatchFile(file);

	outputFilename = file.name.split(".").slice(0, -1).join(".");
});

document.querySelector<HTMLFormElement>("#form")!.addEventListener("submit", (ev) => {
	ev.preventDefault();

	try {
		const patchedBytes = ipsPatcher.patch();

		logger.println(`ROM patched successfully!`);

		const blob = new Blob([patchedBytes.buffer as BlobPart], {
			type: "application/octet-stream",
		});
		const blobUrl = URL.createObjectURL(blob);

		outputExt = inputExt;
		logger.println(`Downloading ${outputFilename}.${outputExt} (${blob.size} bytes)`);

		const a = document.createElement("a");
		a.href = blobUrl;
		a.download = `${outputFilename}.${outputExt}`;
		a.click();
	} catch (err) {
		if (err instanceof Error) logger.println(err.message);
	}
});
