import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";

export class StashReader {
	private stash: string;

	constructor(stash: string) {
		this.stash = stash;
	}

	async read() {
		// TODO: !!! REFACTOR BELOW !!!
		// Start reading files from local repo
		const dir = await readdir(`./${this.stash}`, { withFileTypes: true, recursive: true });

		let files: Array<string> = new Array<string>();
		for (let value of dir) {
			files.push(join(value.path, value.name));
		}

		let data: Array<object> = [];
		for (let path of files) {
			const info = await stat(path);
			// Prepare data to be sent, before sending it back to the user
			if (info.isDirectory()) {
				data.push({
					path: path,
					isDirectory: true,
					data: '',
				});
			} else {
				console.log(`Reading ${path}...`);
				data.push({
					path: path,
					isDirectory: false,
					data: await readFile(path, { encoding: 'utf-8' }),
				});
			}
		}
		// TODO: !!! REFACTOR ABOVE !!!
		// Finish reading files from local repo 

		return JSON.stringify(data);
	}
}
