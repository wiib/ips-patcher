import Logger from "../logger";
import { readFileAsBytes } from "./util";

export default class Patcher {
	protected sourceBuffer: Uint8Array = new Uint8Array();
	protected patchBuffer: Uint8Array = new Uint8Array();

	protected logger: Logger;

	constructor() {
		this.logger = Logger.instance;
	}

	public loadRomFile(file: File): Promise<void> {
		return new Promise((resolve, reject) => {
			readFileAsBytes(file)
				.then((buffer) => {
					this.sourceBuffer = buffer;
					this.logger.println(`Loaded ROM: ${file.name} (${file.size} bytes)`);

					resolve();
				})
				.catch((reason) => reject(reason));
		});
	}

	public loadPatchFile(file: File): Promise<void> {
		return new Promise((resolve, reject) => {
			readFileAsBytes(file)
				.then((buffer) => {
					this.patchBuffer = buffer;
					this.logger.println(`Loaded patch: ${file.name} (${file.size} bytes)`);

					resolve();
				})
				.catch((reason) => reject(reason));
		});
	}
}
