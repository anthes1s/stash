import { address } from "ip";
import { hostname } from "os";

export interface StashConfig {
	author: string,
	title: string,
	version: string,
	ip: string,
	port: number,
}

export function createDefaultStashConfig(stashName: string) {
	const config: StashConfig = {
		author: hostname(),
		title: stashName,
		version: "0.0.1",
		ip: address(),
		port: 9999,
	}
	return config;
}
