import { StashConfig } from 'src/stash-config/stash-config';
import { Server, Socket, createServer } from 'net';
import { mkdir, readdir, stat, writeFile, readFile } from 'fs/promises';
import { DownloadDto, RequestDto } from './dto';
import { join } from 'path';
import { existsSync } from 'fs';

export class InitHandler {
	private server: Server;
	private config: StashConfig;

	constructor(config: StashConfig) {
		// NOTE:	Q: Maybe I should create another object that would run a server? 
		//			A: Yes. 
		//			Q: I also need to run the server in the separate process?
		//			A: Yes. 
		//			Q: So I could spawn multiple servers for multiple stashes? 
		//			A: No. You just need it to run in the background. A single instance of server can handle downloads/uploads.

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
						const parsed = await JSON.parse(message.data ?? 'undefined');
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
						const baseStashURL = join('./', message.stash)
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
								console.log(`${entry.path} uploaded!`);
							}
						}

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
