import Patcher from "./patcher";
import { readNumber, readString } from "./util";

export default class IPSPatcher extends Patcher {
	private static IPS_OFFSET_SIZE = 3;
	private static IPS_PAYLOAD_LENGTH_SIZE = 2;
	private static IPS_RUN_LENGTH_SIZE = 2;

	// Use a regular array since JS allows insertion at any index
	private targetArray: number[] = [];

	private ptr: number = 0;

	constructor() {
		super();
	}

	public patch(): Uint8Array {
		if (this.romBuffer.length === 0 && this.patchBuffer.length === 0) {
			throw new Error("Patcher is not ready. Make sure to load both files!");
		}

		// 1. Check for PATCH header

		this.ptr = 0;
		this.targetArray = [];

		if (readString(this.patchBuffer, this.ptr, 5) !== "PATCH") {
			throw new Error("PATCH header not found. Patch file is not valid.");
		}

		this.logger.println("PATCH header found, patching...");

		this.ptr += 5;
		let recordCount = 0;

		// 2. Apply patches

		this.targetArray = Array.from(this.romBuffer);

		while (this.ptr < this.patchBuffer.length) {
			const targetOffset = readNumber(this.patchBuffer, this.ptr, IPSPatcher.IPS_OFFSET_SIZE);
			this.ptr += IPSPatcher.IPS_OFFSET_SIZE;

			const payloadLength = readNumber(this.patchBuffer, this.ptr, IPSPatcher.IPS_PAYLOAD_LENGTH_SIZE);
			this.ptr += IPSPatcher.IPS_PAYLOAD_LENGTH_SIZE;

			if (payloadLength === 0) {
				// RLE record, byte is repeated an amount of times starting at offset
				const runLength = readNumber(this.patchBuffer, this.ptr, IPSPatcher.IPS_RUN_LENGTH_SIZE);
				this.ptr += IPSPatcher.IPS_RUN_LENGTH_SIZE;

				const runValue = this.patchBuffer[this.ptr];

				for (let i = 0; i < runLength; i++) {
					this.targetArray[targetOffset + i] = runValue;
				}

				this.ptr += 1;
			} else {
				// Regular record, payload is written at ofset
				this.patchBuffer.slice(this.ptr, this.ptr + payloadLength).forEach((val, payloadOffset) => {
					this.targetArray[targetOffset + payloadOffset] = val;
				});

				this.ptr += payloadLength;
			}

			recordCount += 1;

			// Check for EOF marker
			if (readString(this.patchBuffer, this.ptr, 3) == "EOF") {
				this.logger.println(`Wrote ${recordCount} records.`);
				this.logger.println("EOF marker reached.");
				break;
			}
		}

		return new Uint8Array(this.targetArray);
	}
}
