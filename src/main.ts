import { InitHandler } from './init-handler/init-handler';
import { StashConfig, createDefaultStashConfig } from './stash-config';
import { DownloadHandler } from './download-handler/download-handler';

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
					const stash: string = args[i + 2];

					const handler = new DownloadHandler(ip, stash);
					await handler.handle();

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
