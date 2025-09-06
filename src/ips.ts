const IPS_OFFSET_SIZE = 3;
const IPS_PAYLOAD_LENGTH_SIZE = 2;
const IPS_RUN_LENGTH_SIZE = 2;

export function patch(inputBytes: Uint8Array, patchBytes: Uint8Array): Uint8Array {
	/*
		1. Check for PATCH header
	*/

	const magicNumberSlice = patchBytes.slice(0, 5);

	if (
		magicNumberSlice[0] !== 0x50 || // P
		magicNumberSlice[1] !== 0x41 || // A
		magicNumberSlice[2] !== 0x54 || // T
		magicNumberSlice[3] !== 0x43 || // c
		magicNumberSlice[4] !== 0x48 // H
	) {
		throw new Error("The patch file provided is not an IPS patch");
	}

	/*
		2. Apply patches
	*/

	// Make a normal array so we can add values past the initial size of the input file,
	const patchedBytes = Array.from(inputBytes);
	let ptr = 5;

	console.log(patchBytes.length);

	while (ptr < patchBytes.length) {
		const offsetSlice = patchBytes.slice(ptr, ptr + IPS_OFFSET_SIZE);
		ptr += IPS_OFFSET_SIZE;

		const plLengthSlice = patchBytes.slice(ptr, ptr + IPS_PAYLOAD_LENGTH_SIZE);
		ptr += IPS_PAYLOAD_LENGTH_SIZE;

		const offset = bytesToNumber(offsetSlice);
		const payloadLength = bytesToNumber(plLengthSlice);

		if (payloadLength > 0) {
			// Regular hunk, payload is written at offset
			const payloadSlice = patchBytes.slice(ptr, ptr + payloadLength);

			for (let i = 0; i < payloadLength; i++) {
				patchedBytes[offset + i] = payloadSlice[i];
			}

			ptr += payloadLength;
		} else {
			// RLE hunk, byte is written an amount of times
			const runLengthSlice = patchBytes.slice(ptr, ptr + IPS_RUN_LENGTH_SIZE);
			ptr += IPS_RUN_LENGTH_SIZE;

			const runLength = bytesToNumber(runLengthSlice);

			for (let i = 0; i < runLength; i++) {
				patchedBytes[offset + i] = patchBytes[ptr];
			}

			ptr += 1;
		}

		// Check for "EOF" marker
		const eofSlice = patchBytes.slice(ptr, ptr + 3);

		if (
			eofSlice[0] == 0x45 && // E
			eofSlice[1] == 0x4f && // O
			eofSlice[2] == 0x46 // F
		) {
			break;
		}
	}

	return new Uint8Array(patchedBytes);
}

function bytesToNumber(buffer: Uint8Array): number {
	let num = 0;

	for (let i = 0; i < buffer.length; i++) {
		num = (num << 8) + buffer[i];
	}

	return num;
}
