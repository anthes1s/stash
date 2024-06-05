import { StashConfig } from 'src/stash-config/stash-config';
import { Server, Socket, createServer } from 'net';
import { mkdir, readdir, stat, writeFile, readFile } from 'fs/promises';
import { RequestDto } from './dto';
import { join } from 'path';
import { existsSync } from 'fs';

export class InitHandler {
	private server: Server;
	private config: StashConfig;

	constructor(config: StashConfig) {
		// NOTE: Maybe I should create another object that would run a server? 
		//		 I also need to run the server in the separate process.
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
						// Instead of throwing an error, send an error and close the connection
						if (!existsSync(join(`./`, message.stash))) {
							socket.write(JSON.stringify({ error: `${message.stash} doesn't exist!` }));
							socket.end();
							return;
						}

						const dir = await readdir(`./${message.stash}`, { withFileTypes: true, recursive: true });

						let files: Array<string> = new Array<string>();
						for (let value of dir) {
							files.push(join(value.path, value.name));
						}

						let response: Array<object> = [];
						for (let path of files) {
							const info = await stat(path);
							// Prepare data to be sent, before sending it back to the user
							if (info.isDirectory()) {
								response.push({
									path: path,
									isDirectory: true,
									data: '',
								});
							} else {
								response.push({
									path: path,
									isDirectory: false,
									data: await readFile(path, { encoding: 'utf-8' }),
								});
							}
						}
						socket.write(JSON.stringify(response));
						break;
					}
					case 'upload': {

						console.log(`Upload invoked`);
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
