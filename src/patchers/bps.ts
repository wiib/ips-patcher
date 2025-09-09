import Patcher from "./patcher";
import { readNumber, readString } from "./util";

export default class BPSPatcher extends Patcher {
	private targetArray: Uint8Array = new Uint8Array();

	private ptr: number = 0;

	constructor() {
		super();
	}

	public patch(): Uint8Array {
		if (this.romBuffer.length === 0 && this.patchBuffer.length === 0) {
			throw new Error("Patcher is not ready. Make sure to load both files!");
		}

		// 1. Check for BPS1 header

		this.ptr = 0;

		if (readString(this.patchBuffer, this.ptr, 4) !== "BPS1") {
			throw new Error("BPS1 header not found. Patch file is not valid.");
		}

		this.logger.println("BPS1 header found, patching...");

		this.ptr += 4;

		// 2. Read sizes

		const sourceSize = this.decode();
		this.ptr += 1;

		this.logger.println(`Expected source size: ${sourceSize} bytes`);

		const targetSize = this.decode();
		this.ptr += 1;

		this.logger.println(`Expected target size: ${targetSize} bytes`);

		const metadataSize = this.decode();
		this.ptr += 1;

		const metadata = readString(this.patchBuffer, this.ptr, metadataSize);
		this.ptr += metadataSize;

		this.logger.println(`Patch metadata: \n\t${metadata.length > 0 ? metadata : "None found"}`);

		return new Uint8Array(this.targetArray);
	}

	/**
	 * This function is copied straight from the BPS format spec
	 * @returns The variable-length encoded number contained at the current ptr position
	 */
	private decode(): number {
		let data = 0;
		let shift = 1;

		while (true) {
			let x = readNumber(this.patchBuffer, this.ptr, 1);
			this.ptr += 1;

			data += (x & 0x7f) * shift;
			if (x & 0x80) break;

			shift <<= 7;
			data += shift;
		}

		this.ptr -= 1;
		return data;
	}
}
