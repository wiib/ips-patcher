import Logger from "../logger";

export default class IPSPatcher {
	private static IPS_OFFSET_SIZE = 3;
	private static IPS_PAYLOAD_LENGTH_SIZE = 2;
	private static IPS_RUN_LENGTH_SIZE = 2;

	private romBuffer: Uint8Array = new Uint8Array();
	private patchBuffer: Uint8Array = new Uint8Array();

	// Use a regular array since JS allows insertion at any index
	private targetArray: number[] = [];

	private ptr: number = 0;

	private logger: Logger;

	constructor() {
		this.logger = Logger.instance;
	}

	public patch(): Uint8Array {
		if (this.romBuffer.length === 0 && this.patchBuffer.length === 0) {
			throw new Error("Patcher is not ready. Make sure to load both files!");
		}

		// 1. Check for PATCH header

		if (this.readString(5) !== "PATCH") {
			throw new Error("PATCH header not found. Patch file is not valid.");
		}

		this.logger.println("PATCH header found, patching...");

		this.ptr += 5;
		let recordCount = 0;

		// 2. Apply patches

		this.targetArray = Array.from(this.romBuffer);

		while (this.ptr < this.patchBuffer.length) {
			const targetOffset = this.readNumber(IPSPatcher.IPS_OFFSET_SIZE);
			this.ptr += IPSPatcher.IPS_OFFSET_SIZE;

			const payloadLength = this.readNumber(IPSPatcher.IPS_PAYLOAD_LENGTH_SIZE);
			this.ptr += IPSPatcher.IPS_PAYLOAD_LENGTH_SIZE;

			if (payloadLength === 0) {
				// RLE record, byte is repeated an amount of times starting at offset
				const runLength = this.readNumber(IPSPatcher.IPS_RUN_LENGTH_SIZE);
				this.ptr += IPSPatcher.IPS_RUN_LENGTH_SIZE;

				const runValue = this.patchBuffer[this.ptr];

				for (let i = 0; i < runLength; i++) {
					this.targetArray[targetOffset + i] = runValue;
				}

				this.ptr += 1;
			} else {
				// Regular record, payload is written at ofset
				this.patchBuffer
					.slice(this.ptr, this.ptr + payloadLength)
					.forEach((val, payloadOffset) => {
						this.targetArray[targetOffset + payloadOffset] = val;
					});

				this.ptr += payloadLength;
			}

			recordCount += 1;

			// Check for EOF marker
			if (this.readString(3) == "EOF") {
				this.logger.println(`Wrote ${recordCount} records.`);
				this.logger.println("EOF marker reached.");
				break;
			}
		}

		return new Uint8Array(this.targetArray);
	}

	public loadRomFile(file: File) {
		const reader = new FileReader();

		reader.addEventListener(
			"load",
			(ev) => {
				const dataBuffer = ev.target?.result as ArrayBuffer;
				this.romBuffer = new Uint8Array(dataBuffer);

				this.logger.println(`Loaded ROM: ${file.name} (${file.size} bytes)`);
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
	}

	public loadPatchFile(file: File) {
		const reader = new FileReader();

		reader.addEventListener(
			"load",
			(ev) => {
				const dataBuffer = ev.target?.result as ArrayBuffer;
				this.patchBuffer = new Uint8Array(dataBuffer);

				this.logger.println(`Loaded patch: ${file.name} (${file.size} bytes)`);
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
	}

	/**
	 * Reads a length of bytes from the patch buffer into a number
	 * @param length The length of bytes to read from the patch buffer
	 * @returns The number located between `ptr` and `ptr + length`
	 */
	private readNumber(length: number): number {
		let num = 0;

		for (let i = 0; i < length; i++) {
			num = (num << 8) + this.patchBuffer![this.ptr + i];
		}

		return num;
	}

	/**
	 * Reads a length of bytes from the patch buffer into a string
	 * @param length The length of bytes to read from the patch buffer
	 * @returns The non null-terminated string located between `ptr` and `ptr + length`
	 */
	private readString(length: number): string {
		let str = "";

		for (let i = 0; i < length; i++) {
			str += String.fromCharCode(this.patchBuffer[this.ptr + i]);
		}

		return str;
	}
}
