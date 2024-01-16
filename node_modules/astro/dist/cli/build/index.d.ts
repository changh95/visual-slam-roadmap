import type yargs from 'yargs-parser';
interface BuildOptions {
    flags: yargs.Arguments;
}
export declare function build({ flags }: BuildOptions): Promise<void>;
export {};
