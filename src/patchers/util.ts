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

/**
 * @param file The file to read into an `Uint8Array`
 * @returns A `Promise`, which is fulfilled once the file is full read by the `FileReader`
 */
export function readFileAsBytes(file: File): Promise<Uint8Array> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.addEventListener(
			"load",
			(ev) => {
				const dataBuffer = ev.target?.result as ArrayBuffer;
				resolve(new Uint8Array(dataBuffer));
			},
			{ once: true }
		);

		reader.addEventListener(
			"error",
			(ev) => {
				reject(ev.target?.error);
			},
			{ once: true }
		);

		reader.readAsArrayBuffer(file);
	});
}
