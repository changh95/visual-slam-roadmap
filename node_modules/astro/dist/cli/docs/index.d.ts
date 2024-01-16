import type yargs from 'yargs-parser';
interface DocsOptions {
    flags: yargs.Arguments;
}
export declare function docs({ flags }: DocsOptions): Promise<import("execa").ExecaReturnValue<string> | undefined>;
export {};
