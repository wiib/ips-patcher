export default class Logger {
	static #instance: Logger;

	private destination: HTMLPreElement | undefined;
	private lines: string[] = [];

	private constructor() {}

	public static get instance(): Logger {
		if (!Logger.#instance) Logger.#instance = new Logger();

		return Logger.#instance;
	}

	private render(): void {
		if (!this.destination) throw new Error("Logger destination is not defined.");

		this.destination.innerHTML = "";

		this.lines.forEach((item) => {
			const span = document.createElement("span");
			span.textContent = item;

			this.destination!.appendChild(span);
		});
	}

	public setDestination(destination: HTMLPreElement): void {
		this.destination = destination;
		this.println("Logs will be written to this element.");
	}

	public println(text: string): void {
		this.lines.push(text.trimEnd() + "\n");
		this.render();
	}
}
