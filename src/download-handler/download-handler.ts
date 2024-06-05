import { Socket, createConnection } from "net";
import { DownloadDto, RequestDto } from "src/init-handler/dto";
import { join } from "path";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";

export class DownloadHandler {
	private socket: Socket;
	private ip: string;
	private stash: string;

	constructor(ip: string, stash: string) {
		this.ip = ip;
		this.stash = stash;

		this.socket = createConnection(9999, ip);
		console.log(`Connecting to ${this.ip}...`);

		this.socket.on('data', async (data: string) => {
			const parsed = await JSON.parse(data);
			if (parsed.error) throw new Error(parsed.error);

			const response: Array<DownloadDto> = parsed;
			// Sort the array so that you could make folders first, and only then write files into them
			response.sort((a: DownloadDto, b: DownloadDto) => {
				if (a.isDirectory && !b.isDirectory) {
					return -1;
				} else if (!a.isDirectory && b.isDirectory) {
					return 1;
				} else {
					return 0;
				}
			});

			// Create base directory
			const baseStashURL = join('./', stash)
			if (!existsSync(baseStashURL)) await mkdir(baseStashURL);

			// Start creating directories and files below
			for (let entry of response) {
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
			console.log(`Finished downloading files from the stash!`);
		});

	}

	async handle() {
		const request: RequestDto = { command: 'download', stash: this.stash };
		this.socket.write(JSON.stringify(request));
		console.log(`Downloading files...`);
	}

}
