import type yargs from 'yargs-parser';
interface PreviewOptions {
    flags: yargs.Arguments;
}
export declare function preview({ flags }: PreviewOptions): Promise<import("../../@types/astro.js").PreviewServer | undefined>;
export {};
