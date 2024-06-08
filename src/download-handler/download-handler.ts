import { Socket, createConnection } from "net";
import { RequestDto } from "../init-handler/dto";
import { StashWriter } from "../stash-writer";

export class DownloadHandler {
	private socket: Socket;
	private ip: string;
	private stash: string;

	constructor(ip: string, stash: string) {
		this.ip = ip;
		this.stash = stash;
		this.socket = createConnection(9999, ip);
		console.log(`Connecting to ${this.ip}...`);

		this.socket.on('error', (error: any) => {
			console.error(error?.message);
		});

		this.socket.on('data', async (data: string) => {
			const message: RequestDto = await JSON.parse(data);

			switch (message.command) {
				case 'config': {
					// NOTE: I thought i was going to put something here, but I didn't, so whatever
					break;
				}
				default: {
					const writer = new StashWriter(this.stash, data);
					await writer.write();
					console.log(`Finished downloading files from the ${this.stash}!`);
					break;
				}
			}
		});
	}

	async handle() {
		const request: RequestDto = { command: 'download', stash: this.stash };
		this.socket.write(JSON.stringify(request));
		console.log(`Downloading files...`);
	}

}
