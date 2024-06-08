import { existsSync, readFileSync } from "fs";
import { address } from "ip";
import { hostname } from "os";

export interface StashConfig {
	author: string,
	title: string,
	version: string,
	ip: string,
	port: number,
}

export async function createDefaultStashConfig(stash: string) {
	return {
		author: hostname(),
		title: stash,
		version: "0.0.1",
		ip: address(),
		port: 9999,
	}
}

export async function compareStashVersion(remoteStashConfig: StashConfig, localStashConfig: StashConfig) {
	const remoteVersion = remoteStashConfig.version.split('.');
	const localVersion = localStashConfig.version.split('.');

	for (let i = 0; (i < remoteVersion.length) && (i < localVersion.length); i++) {
		let remoteNum = Number(remoteVersion[i]);
		let localNum = Number(localVersion[i]);

		if (remoteNum > localNum) return true;
	}
	return false;
}

export async function getStashConfig(stash: string) {
	const path = `./${stash}/.stash/stash.json`;
	if (!existsSync(path)) throw new Error(`stash.json is absent!`);

	let config: StashConfig = JSON.parse(readFileSync(path, { encoding: 'utf-8' }));
	return config;
}

export async function incrementStashVersion(config: StashConfig, method: string) {
	let version = config.version.split('.');
	let [major, minor, patch] = version;

	switch (method) {
		case 'major': {
			let increment = Number(major);
			increment++;
			config.version = [String(increment), minor, patch].join('.');
			break;
		}
		case 'minor': {
			let increment = Number(minor);
			increment++;
			config.version = [major, String(increment), patch].join('.');
			break;
		}
		case 'patch': {
			let increment = Number(patch);
			increment++;
			config.version = [major, minor, String(increment)].join('.');
			break;
		}
		default: {
			throw new Error(`${method} upload method doesn't exist`);
		}
	}
	return config;
}
