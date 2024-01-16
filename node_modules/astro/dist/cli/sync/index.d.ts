import type yargs from 'yargs-parser';
interface SyncOptions {
    flags: yargs.Arguments;
}
export declare function sync({ flags }: SyncOptions): Promise<import("../../core/sync/index.js").ProcessExit>;
export {};
