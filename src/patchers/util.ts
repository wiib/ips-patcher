/**
 * Reads `length` bytes from `buffer` starting at `offset`, into a number
 * @returns The number located between `offset` and `offset + length`
 */
export function readNumber(buffer: Uint8Array, offset: number, length: number): number {
	let num = 0;

	for (let i = 0; i < length; i++) {
		num = (num << 8) + buffer[offset + i];
	}

	return num;
}

/**
 * Reads `length` bytes from `buffer` starting at `offset`, into a string
 * @returns The non null-terminated string located between `offset` and `offset + length`
 */
export function readString(buffer: Uint8Array, offset: number, length: number): string {
	let str = "";

	for (let i = 0; i < length; i++) {
		str += String.fromCharCode(buffer[offset + i]);
	}

	return str;
}
