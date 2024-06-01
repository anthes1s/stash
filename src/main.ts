import * as fs from 'fs/promises';

async function main() {
	// TODO: Create handles for args: init, download, upload
	// TODO: stash init [REPO NAME] -> create a directory and a .json file inside that directory that would define some properties of that stash (author, version, ip, port?, idfk)	
	try {
		const args: Array<string> = process.argv;
		console.log(args);

		for (let i = 0; i < args.length; i++) {
			if (args[i] == 'init') {
				console.log('init envoked');
				const stashName: string = args[i + 1];
				if (!stashName) throw new Error('missing repo name!');
				fs.mkdir(`./${stashName}`);
				console.log(`repo initiated`);
				// TODO: Create a default stash.json file and write some shit into it
				const defaultConfigFile = JSON.stringify({
					author: "",
					title: stashName,
					version: "0.0.1",
					ip: 'localhost', // TODO: create a class that would return localhost ip
					port: 9999,
					// NOTE: Maybe i'll need something else, but i don't know what at the moment
				});
				await fs.writeFile(`./${stashName}/stash.json`, defaultConfigFile);
			}
		}

		return 0;
	} catch (error) {
		console.log(error);
	}
}

main();
