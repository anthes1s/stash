import { join } from "path";
import { DownloadDto } from "../init-handler/dto";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";

export class StashWriter {
	private stash: string;
	private data: string;

	constructor(stash: string, data: string) {
		this.stash = stash;
		this.data = data;
	}

	async write() {
		const parsed = await JSON.parse(this.data);
		if (parsed.error) throw new Error(parsed.error);

		const files: Array<DownloadDto> = parsed;
		// Sort the array so that you could make folders first, and only then write files into them
		files.sort((a: DownloadDto, b: DownloadDto) => {
			if (a.isDirectory && !b.isDirectory) {
				return -1;
			} else if (!a.isDirectory && b.isDirectory) {
				return 1;
			} else {
				return 0;
			}
		});

		// Create base directory
		const baseStashURL = join('./', this.stash)
		if (!existsSync(baseStashURL)) await mkdir(baseStashURL);

		// Start creating directories and files below
		for (let entry of files) {
			if (entry.isDirectory) {
				// Check if the directory exists
				const directoryPath = entry.path;
				if (!existsSync(directoryPath)) await mkdir(join('./', entry.path));
				else continue;
				// Create a directory
			} else {
				// Write to a file
				await writeFile(join('./', entry.path), entry.data);
				console.log(`${entry.path} downloaded!`);
			}
		}
	}
}
