import { existsSync, readFileSync, writeFileSync } from "fs";
import { Socket, createConnection } from "net";
import { RequestDto } from "../init-handler/dto";
import { StashConfig, compareStashVersion, getStashConfig, incrementStashVersion } from "../stash-config";
import { StashReader } from "../stash-reader";
import { EventEmitter } from "stream";

export class UploadHandler extends EventEmitter {
	private socket: Socket;
	private stash: string;
	private method: string;
	private config: StashConfig;

	constructor(stash: string, method: string) {
		super();
		this.stash = stash;
		this.method = method;
		const path = `./${stash}/.stash/stash.json`;

		if (!existsSync(path)) throw new Error(`stash.json is absent!`);

		this.config = JSON.parse(readFileSync(path, { encoding: 'utf-8' }));

		this.socket = createConnection(this.config.port, this.config.ip);
		console.log(`Connecting to ${this.config.ip}...`);

		this.socket.on('data', async (data: string) => {
			const message: RequestDto = await JSON.parse(data);

			switch (message.command) {
				case 'config': {
					const remoteStashConfig: StashConfig = await JSON.parse(message.data ?? 'undefined');
					const localStashConfig: StashConfig = await getStashConfig(this.stash);
					if (await compareStashVersion(remoteStashConfig, localStashConfig)) {
						throw new Error(`Detected version differences. You must 'stash download ${this.config.ip} ${this.config.title}' before uploading`);
					} else {
						await incrementStashVersion(this.config, this.method);
						writeFileSync(path, JSON.stringify(this.config, null, 2), { encoding: 'utf-8' });
						this.config = JSON.parse(readFileSync(path, { encoding: 'utf-8' }));
					}
					this.emit('finished');
					break;
				}
			}

		});


		this.socket.on('error', (error: any) => {
			throw new Error(error?.message);
		});

		this.socket.on('end', () => {
			console.log(`Finished uploading files from ${this.config.title}!`);
		});
	}

	async handle() {
		const reader = new StashReader(this.stash);

		this.on('finished', async () => {
			const request: RequestDto = {
				command: 'upload',
				stash: this.stash,
				data: await reader.read(),
			};
			this.socket.write(JSON.stringify(request));
			console.log(`Uploading files...`);
		});
	}
}
