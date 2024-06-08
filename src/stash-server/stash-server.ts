import { Server, Socket, createServer } from "net";
import { StashConfig, getStashConfig } from "../stash-config";
import { existsSync } from "fs";
import { DownloadDto, RequestDto } from "../init-handler/dto";
import { join } from "path";
import { StashReader } from "../stash-reader";
import { StashWriter } from "../stash-writer";
import { rm } from "fs/promises";

export class StashServer {
	private server: Server;

	constructor(config: StashConfig) {
		this.server = createServer();

		this.server.on('connection', async (socket: Socket) => {
			console.log(`${socket.remoteAddress} connected`);
			const data: RequestDto = {
				command: 'config',
				stash: config.title,
				data: JSON.stringify(await getStashConfig(config.title)),
			}
			socket.write(JSON.stringify(data));

			socket.on('end', () => {
				console.log(`${socket.remoteAddress} disconnected`);
			});

			socket.on('data', async (data: string) => { // NOTE: .json string received
				const message: RequestDto = await JSON.parse(data);
				switch (message.command) {
					case 'download': {
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
						const reader = new StashReader(config.title);
						const remoteStashFiles: Array<DownloadDto> = await JSON.parse(await reader.read());
						const localStashFiles: Array<DownloadDto> = await JSON.parse(message.data ?? 'undefined');

						let remotePaths: Array<string> = remoteStashFiles.map((obj: DownloadDto) => obj.path);
						let localPaths: Array<string> = localStashFiles.map((obj: DownloadDto) => obj.path);

						remotePaths.forEach(async (path: string) => {
							if (!localPaths.includes(path)) await rm(path, { recursive: true });
						});

						const writer = new StashWriter(message.stash, JSON.stringify(localStashFiles));
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
	}
}
