import { argv } from 'node:process'



async function main() {
	// TODO: Create handles for args: init, download, upload
	// TODO: stash init [REPO NAME] -> create a directory and a .json file inside that directory that would define some properties of that stash (author, version, ip, port?, idfk)

	console.log(process.argv);
	return 0;
}

main();
