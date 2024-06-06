import { StashConfig } from '../stash-config/stash-config';
import { Server, Socket, createServer } from 'net';
import { mkdir, writeFile } from 'fs/promises';
import { RequestDto } from './dto';
import { join } from 'path';
import { existsSync } from 'fs';
import { StashReader } from '../stash-reader';
import { StashWriter } from '../stash-writer';

export class InitHandler {
	private server: Server;
	private config: StashConfig;

	constructor(config: StashConfig) {
		this.server = createServer();

		this.server.on('connection', (socket: Socket) => {
			console.log(`${socket.remoteAddress} connected`);
			socket.on('end', () => {
				console.log(`${socket.remoteAddress} disconnected`);
			});

			socket.on('data', async (data: string) => { // NOTE: .json string received
				const message: RequestDto = await JSON.parse(data);

				switch (message.command) {
					case 'download': {
						// Check if message.stash exists
						if (!existsSync(join(`./`, message.stash))) {
							socket.write(JSON.stringify({ error: `${message.stash} doesn't exist!` }));
							socket.end();
							return;
						}

						const reader = new StashReader(message.stash);
						socket.write(await reader.read());
						break;
					}
					case 'upload': {
						const writer = new StashWriter(message.stash, message.data ?? 'undefined');
						writer.write();
						console.log(`Finished uploading files from the ${message.stash}!`);
						break;
					}
					default: {
						console.log(`Unknown error`);
						break;
					}
				}

				socket.end();
			})
		});

		this.server.listen(config.port, config.ip, () => {
			console.log(`${config.title} is listening on ${config.ip}:${config.port}`);
		});
		this.config = config;
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
