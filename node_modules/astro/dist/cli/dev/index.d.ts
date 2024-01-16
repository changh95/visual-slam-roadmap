import type yargs from 'yargs-parser';
interface DevOptions {
    flags: yargs.Arguments;
}
export declare function dev({ flags }: DevOptions): Promise<import("../../core/dev/dev.js").DevServer | undefined>;
export {};
