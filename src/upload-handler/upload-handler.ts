import { existsSync, readFileSync, writeFileSync } from "fs";
import { Socket, createConnection } from "net";
import { RequestDto } from "../init-handler/dto";
import { StashConfig } from "../stash-config";
import { StashReader } from "../stash-reader";

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
		// NOTE: I probably should turn StashConfig into a class and add this method to it, instead of using this in a handler
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
		const reader = new StashReader(this.stash);

		const request: RequestDto = {
			command: 'upload',
			stash: this.stash,
			data: await reader.read(),
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
