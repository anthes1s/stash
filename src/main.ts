import { InitHandler } from './init-handler';
import { StashConfig, createDefaultStashConfig } from './stash-config';
import { DownloadHandler } from './download-handler';
import { existsSync } from 'fs';
import { UploadHandler } from './upload-handler';

async function main() {
	const commands: Array<string> = ['init', 'download', 'upload'];
	const args: Array<string> = process.argv;

	try {
		for (let i = 2; i < args.length && commands.includes(args[i]); i++) {
			switch (args[i]) {
				case 'init': {
					const stashName: string = args[i + 1];
					if (!stashName) throw new Error('Missing stash name!');

					const defaultConfig: StashConfig = await createDefaultStashConfig(stashName);

					const handler = new InitHandler(defaultConfig);
					await handler.handle();

					break;
				}
				case 'download': {
					const ip: string = args[i + 1];
					const stash: string = args[i + 2];

					if (!ip) throw new Error(`IP is missing! Example 'stash download 192.168.0.0 stash-name'`);
					if (!stash) throw new Error(`Name of a stash is missing! Example 'stash download 192.168.0.0 stash-name'`);

					const handler = new DownloadHandler(ip, stash);
					await handler.handle();

					break;
				}
				case 'upload': {
					const stash: string = args[i + 1];
					let method: string = args[i + 2];
					if (!stash) throw new Error(`Name of the stash is missing! Example - 'stash upload stash-name'`);
					if (!method) {
						console.log(`Method not specified. 'stash upload patch' will be used as default`);
						method = 'patch';
					}
					if (!existsSync(`./${stash}`)) throw new Error(`${stash} doesn't exist!`);

					const handler = new UploadHandler(stash, method);
					await handler.handle();

					break;
				}
				default: {
					// NOTE: Just log a manual to console 
					console.error(`'${args[i]}' command not found. Try stash help`);
					break;
				}
			}
		}
		return 0;
	} catch (error: any) {
		console.error(error?.message);
		return process.exit(1);
	}
}

main();

