import { StashConfig } from 'src/stash-config/stash-config';
import { Server, createServer } from 'net';
import { mkdir, writeFile } from 'fs/promises';

export class InitHandler {
	private server: Server;
	private config: StashConfig;

	constructor(config: StashConfig) {
		this.server = createServer();
		this.server.listen(config.port, config.ip, () => {
			console.log(`Stash is listening on ${config.ip}:${config.port}`);
		});
		this.config = config;
	}

	async handle() {
		if (!this.config) throw new Error('StashConfig is undefined');
		await mkdir(`./${this.config.title}`);
		await mkdir(`./${this.config.title}/.stash`);
		await writeFile(`./${this.config.title}/.stash/stash.json`, JSON.stringify(this.config, null, 2));
	}
}
