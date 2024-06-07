import { StashConfig } from '../stash-config/stash-config';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { StashServer } from '../stash-server';

export class InitHandler {
	private server: StashServer;
	private config: StashConfig;

	constructor(config: StashConfig) {
		this.config = config;
		this.server = new StashServer(this.config);
	}

	async handle() {
		if (!this.config) throw new Error('StashConfig is undefined');
		if (existsSync(join('./', this.config.title))) {
			console.log(`${this.config.title} already exists!`);
			console.log(`Checking if configuration folder exists...`);
		} else {
			await mkdir(`./${this.config.title}`);
		}
		if (existsSync(join('./', this.config.title, '/.stash'))) {
			console.log(`Folder that holds configuration files exists!`);
			console.log(`Checking if configuration file exists...`);
		} else {
			await mkdir(`./${this.config.title}/.stash`);
		}
		if (existsSync(join('./', this.config.title, '/.stash', '/stash.json'))) {
			console.log(`Configuration file exists!`);
			console.log(`Stash initialization finished.'`);
		} else {
			await writeFile(`./${this.config.title}/.stash/stash.json`, JSON.stringify(this.config, null, 2));
		}
	}
}
