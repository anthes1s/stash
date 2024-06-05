import { StashConfig } from 'src/stash-config/stash-config';
import { Server, Socket, createServer } from 'net';
import { mkdir, readdir, stat, writeFile, readFile } from 'fs/promises';
import { RequestDto } from './dto';
import { join } from 'path';

export class InitHandler {
	private server: Server;
	private config: StashConfig;

	constructor(config: StashConfig) {
		// NOTE: Maybe I should create another object that would run a server? 
		this.server = createServer();
		this.server.on('connection', (socket: Socket) => {
			console.log(`somebody connected`);

			socket.on('data', async (data: string) => { // NOTE: .json string received
				const message: RequestDto = await JSON.parse(data);

				switch (message.command) {
					case 'download': {
						// NOTE: Get every url possible in stash mentioned in message.stash
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
							} // TODO: Send that it's a directory so client can create a directory on his side
						}
						socket.write(JSON.stringify(response));
						break;
					}
					default: {
						console.log(`default invoked :/`);
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
		await mkdir(`./${this.config.title}`);
		await mkdir(`./${this.config.title}/.stash`);
		await writeFile(`./${this.config.title}/.stash/stash.json`, JSON.stringify(this.config, null, 2));
	}
}
