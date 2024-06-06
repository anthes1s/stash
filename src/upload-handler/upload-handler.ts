import { existsSync, readFileSync, writeFileSync } from "fs";
import { readFile, readdir, stat } from "fs/promises";
import { Socket, createConnection } from "net";
import { join } from "path";
import { RequestDto } from "src/init-handler/dto";
import { StashConfig } from "src/stash-config";

export class UploadHandler {
	private socket: Socket;
	private stash: string;
	private config: StashConfig;

	constructor(stash: string, method: string) {
		this.stash = stash;
		const path = `./${stash}/.stash/stash.json`;

		if (!existsSync(path)) throw new Error(`stash.json is absent!`);

		this.config = JSON.parse(readFileSync(path, { encoding: 'utf-8' }));
		// Change the version of the stash inside .stash
		this.incrementVersion(this.config, method);
		writeFileSync(path, JSON.stringify(this.config, null, 2), { encoding: 'utf-8' });
		this.config = JSON.parse(readFileSync(path, { encoding: 'utf-8' }));

		this.socket = createConnection(this.config.port, this.config.ip);
		console.log(`Connecting to ${this.config.ip}...`);

		this.socket.on('error', (error: any) => {
			throw new Error(error?.message);
		});

		this.socket.on('end', () => {
			console.log(`Finished uploading files!`);
		});
	}

	async handle() {
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

		const request: RequestDto = {
			command: 'upload',
			stash: this.stash,
			data: JSON.stringify(data),
		};

		this.socket.write(JSON.stringify(request));
		console.log(`Uploading files...`);
	}

	private async incrementVersion(config: StashConfig, method: string) {
		let version = config.version.split('.');
		let [major, minor, patch] = version;

		switch (method) {
			case 'major': {
				let increment = Number(major);
				increment++;
				config.version = [String(increment), minor, patch].join('.');
				break;
			}
			case 'minor': {
				let increment = Number(minor);
				increment++;
				config.version = [major, String(increment), patch].join('.');
				break;
			}
			case 'patch': {
				let increment = Number(patch);
				increment++;
				config.version = [major, minor, String(increment)].join('.');
				break;
			}
			default: {
				throw new Error(`${method} upload method doesn't exist`);
			}
		}
		return config;
	}
}
