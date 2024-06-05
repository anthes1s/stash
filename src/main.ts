import { Socket, createConnection } from 'net';
import { InitHandler } from './init-handler/init-handler';
import { StashConfig, createDefaultStashConfig } from './stash-config';
import { DownloadDto, RequestDto } from './init-handler/dto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

async function main() {
	const commands: Array<string> = ['init', 'download', 'upload'];
	const args: Array<string> = process.argv;

	try {
		for (let i = 2; i < args.length && commands.includes(args[i]); i++) {
			switch (args[i]) {
				case 'init': {
					const stashName: string = args[i + 1];
					if (!stashName) throw new Error('Missing stash name!');
					const defaultConfig: StashConfig = createDefaultStashConfig(stashName);
					const handler = new InitHandler(defaultConfig);
					await handler.handle();
					break;
				}
				case 'download': {
					const ip: string = args[i + 1];
					const stashName: string = args[i + 2];

					const skt: Socket = createConnection(9999, ip);
					skt.on('data', async (data: string) => {
						const response: Array<DownloadDto> = await JSON.parse(data);
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
						const baseStashURL = join('./', stashName)
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
							}
						}
					});

					const request: RequestDto = { command: 'download', stash: stashName };
					skt.write(JSON.stringify(request));

					console.log(`Trying to connect to ${ip}:9999 and download ${stashName}`);
					break;
				}
				case 'upload': {
					console.log('upload invoked');
					break;
				}
				default: {
					console.error(`'${args[i]}' command not found. Try stash --help`);
					break;
				}
			}
		}
		return 0;
	} catch (error) {
		console.error(error);
	}
}

main();

// NOTE: I think I should implement handlers as EventEmmiter object. So, when I parse arguments I could emit events (e.g. .emit('init', options) .emit('upload', options) etc.) to handle them. 
