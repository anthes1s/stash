import * as fs from 'fs/promises';
import * as os from 'os';
import * as ip from 'ip';
import * as net from 'net';

async function main() {
	// TODO: Create handles for args: init, download, upload
	// TODO: stash init [REPO NAME] -> create a directory and a .json file inside that directory that would define some properties of that stash (author, version, ip, port?, idfk)	
	let srv: net.Server;

	try {
		const args: Array<string> = process.argv;
		for (let i = 0; i < args.length; i++) {
			if (args[i] == 'init') {
				const stashName: string = args[i + 1];
				if (!stashName) throw new Error('Missing stash name!');
				fs.mkdir(`./${stashName}`);

				const defaultConfig = {
					author: os.hostname(),
					title: stashName,
					version: "0.0.1",
					ip: ip.address(),
					port: 9999,
				};

				await fs.writeFile(`./${stashName}/stash.json`, JSON.stringify(defaultConfig, null, 2));

				// TODO: Now start a Server that would receive requests to download/upload a file
				srv = net.createServer();
				srv.on('connection', () => console.log(`somebody connected`));
				srv.on('download', () => { console.log('somebody asked to download') });
				srv.listen(defaultConfig.port, () => console.log(`stash is listening on port ${defaultConfig.port}`));
			}
		}
		return 0;
	} catch (error) {
		console.error(error);
	}
}

main();

// NOTE: I think I should implement handlers as EventEmmiter object. So, when I parse arguments I could emit events (e.g. .emit('init', options) .emit('upload', options) etc.) to handle them. 
