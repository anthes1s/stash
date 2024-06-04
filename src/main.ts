import { InitHandler } from './init-handler/init-handler';
import { StashConfig, createDefaultStashConfig } from './stash-config';

async function main() {
	// TODO: Create handles for args: init, download, upload
	// TODO: stash init [REPO NAME] -> create a directory and a .json file inside that directory that would define some properties of that stash (author, version, ip, port?, idfk)	

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
					console.log('download invoked');
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
