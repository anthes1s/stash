import { Server, Socket, createServer } from "net";
import { StashConfig, getStashConfig } from "../stash-config";
import { existsSync } from "fs";
import { RequestDto } from "../init-handler/dto";
import { join } from "path";
import { StashReader } from "../stash-reader";
import { StashWriter } from "../stash-writer";

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
	}
}
