import { InitHandler } from './init-handler';
import { StashConfig, createDefaultStashConfig } from './stash-config';
import { DownloadHandler } from './download-handler';
import { existsSync } from 'fs';
import { UploadHandler } from './upload-handler';
import { ExitStatus } from 'typescript';

async function main() {
	const commands: Array<string> = ['init', 'download', 'upload', 'help'];
	const args: Array<string> = process.argv;
	const manual = `stash init <name> - initialize a stash and listen to the connections\nstash download <ip> <name> - pretty self explanatory; downloads a stash\nstash upload <name> <method (patch | minor | major)> - upload a stash to the server and increment a version according to the method:\n\t patch -> increments the last digit of the version (e.g. "0.0.1" -> "0.0.2")\n\t minor -> increments the middle digit of the version (e.g. "0.0.1" -> "0.1.1")\n\t major -> increments the first digit of the version (e.g. "0.0.1" -> "1.0.1")`;

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

					if (!ip) throw new Error(`IP is missing! Example 'stash download <ip> <stash-name>'`);
					if (!stash) throw new Error(`Name of a stash is missing! Example 'stash download <ip> <stash-name>'`);

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
				case 'help': {
					console.log(manual);
					break;
				}
				default: {
					console.error(`'${args[i]}' command not found. Try 'stash help'`);
					break;
				}
			}
		}
		return 0;
	} catch (error: any) {
		console.error(error?.message);
	}
}

main();

