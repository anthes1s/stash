"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs/promises"));
async function main() {
    try {
        const args = process.argv;
        console.log(args);
        for (let i = 0; i < args.length; i++) {
            if (args[i] == 'init') {
                console.log('init envoked');
                const stashName = args[i + 1];
                if (!stashName)
                    throw new Error('missing repo name!');
                fs.mkdir(`./${stashName}`);
                console.log(`repo initiated`);
                const defaultConfigFile = JSON.stringify({
                    author: "",
                    title: stashName,
                    version: "0.0.1",
                    ip: 'localhost',
                    port: 9999,
                });
                await fs.writeFile(`./${stashName}/stash.json`, defaultConfigFile);
            }
        }
        return 0;
    }
    catch (error) {
        console.log(error);
    }
}
main();
