import type yargs from 'yargs-parser';
import type { AstroConfig, AstroUserConfig } from '../../@types/astro.js';
interface InfoOptions {
    flags: yargs.Arguments;
}
export declare function getInfoOutput({ userConfig, print, }: {
    userConfig: AstroUserConfig | AstroConfig;
    print: boolean;
}): Promise<string>;
export declare function printInfo({ flags }: InfoOptions): Promise<void>;
export {};
