import "./style.css";

import IPSPatcher from "./patchers/ips.ts";
import BPSPatcher from "./patchers/bps.ts";
import Logger from "./logger.ts";

let romFile: File | undefined = undefined;
let patchFile: File | undefined = undefined;

const logger = Logger.instance;

document.addEventListener("DOMContentLoaded", () => {
	const preElement = document.querySelector<HTMLPreElement>("#log")!;
	logger.setDestination(preElement);
});

document.querySelector<HTMLInputElement>("#input_file")!.addEventListener("change", (ev) => {
	const target = ev.target as HTMLInputElement;

	if (!target.files) throw new Error("No files in change event");

	romFile = target.files[0];
	logger.println(`Selected ROM: ${romFile.name}`);

	document.querySelector<HTMLInputElement>("#input_patch")!.disabled = false;
});

document.querySelector<HTMLInputElement>("#input_patch")!.addEventListener("change", (ev) => {
	const target = ev.target as HTMLInputElement;

	if (!target.files) throw new Error("No files in change event");

	patchFile = target.files[0];
	logger.println(`Selected patch: ${patchFile.name}`);

	document.querySelector<HTMLButtonElement>("#button_apply")!.disabled = false;
});

document.querySelector<HTMLFormElement>("#form")!.addEventListener("submit", async (ev) => {
	ev.preventDefault();

	if (!romFile) {
		logger.println("ROM file missing.");
		return;
	}

	if (!patchFile) {
		logger.println("Patch file missing.");
		return;
	}

	try {
		const patchExt = patchFile.name.split(".").pop();
		const romExt = romFile.name.split(".").pop();
		const targetName = patchFile.name.split(".").slice(0, -1).join(".");

		let patcher: IPSPatcher | BPSPatcher;

		switch (patchExt?.toLowerCase()) {
			case "ips":
				patcher = new IPSPatcher();
				break;

			case "bps":
				patcher = new BPSPatcher();
				break;

			default:
				logger.println("Unknown patch file extension.");
				return;
		}

		await patcher.loadRomFile(romFile);
		await patcher.loadPatchFile(patchFile);

		const targetBuffer = patcher.patch();

		logger.println(`ROM patched successfully!`);

		const blob = new Blob([targetBuffer.buffer as BlobPart], {
			type: "application/octet-stream",
		});
		const blobUrl = URL.createObjectURL(blob);

		logger.println(`Downloading ${targetName}.${romExt} (${blob.size} bytes)`);

		const a = document.createElement("a");
		a.href = blobUrl;
		a.download = `${targetName}.${romExt}`;
		a.click();
	} catch (err) {
		if (err instanceof Error) logger.println(err.message);
	}
});
