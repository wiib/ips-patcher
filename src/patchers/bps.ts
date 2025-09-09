import Patcher from "./patcher";
import { readString } from "./util";

export default class BPSPatcher extends Patcher {
	private targetBuffer: Uint8Array = new Uint8Array();

	private ptr: number = 0;
	private outputOffset: number = 0;
	private sourceRelativeOffset: number = 0;
	private targetRelativeOffset: number = 0;

	constructor() {
		super();
	}

	public patch(): Uint8Array {
		if (this.sourceBuffer.length === 0 && this.patchBuffer.length === 0) {
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

		this.targetBuffer = new Uint8Array(targetSize);

		this.logger.println(`Expected target size: ${targetSize} bytes`);

		const metadataSize = this.decode();
		this.ptr += 1;

		const metadata = readString(this.patchBuffer, this.ptr, metadataSize);
		this.ptr += metadataSize;

		this.logger.println(`Patch metadata: \n\t${metadata.length > 0 ? metadata : "None found"}`);

		while (this.ptr < this.patchBuffer.length - 12) {
			// Read the data of the command to perform
			const data = this.decode();
			this.ptr += 1;

			const command = data & 3;
			let length = (data >> 2) + 1;

			// Perform the command
			switch (command) {
				// SourceRead
				case 0:
					while (length--) {
						this.targetBuffer[this.outputOffset] = this.sourceBuffer[this.outputOffset];
						this.outputOffset += 1;
					}
					break;

				// TargetRead
				case 1:
					while (length--) {
						this.targetBuffer[this.outputOffset] = this.patchBuffer[this.ptr];

						this.outputOffset += 1;
						this.ptr += 1;
					}
					break;

				// SourceCopy
				case 2:
					const scData = this.decode();
					this.ptr += 1;

					this.sourceRelativeOffset += (scData & 1 ? -1 : +1) * (scData >> 1);

					while (length--) {
						this.targetBuffer[this.outputOffset] = this.sourceBuffer[this.sourceRelativeOffset];
						this.sourceRelativeOffset += 1;
						this.outputOffset += 1;
					}
					break;

				// TargetCopy
				case 3:
					const tcData = this.decode();
					this.ptr += 1;

					this.targetRelativeOffset += (tcData & 1 ? -1 : +1) * (tcData >> 1);

					while (length--) {
						this.targetBuffer[this.outputOffset] = this.targetBuffer[this.targetRelativeOffset];
						this.targetRelativeOffset += 1;
						this.outputOffset += 1;
					}
					break;

				default:
					throw new Error("Unknown command detected in patch file.");
			}
		}

		return new Uint8Array(this.targetBuffer);
	}

	/**
	 * This function is copied straight from the BPS format spec
	 * @returns The variable-length encoded number contained at the current ptr position
	 */
	private decode(): number {
		let data = 0;
		let shift = 1;

		while (true) {
			let x = this.patchBuffer[this.ptr];
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
