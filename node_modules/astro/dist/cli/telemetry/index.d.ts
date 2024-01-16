import type yargs from 'yargs-parser';
interface TelemetryOptions {
    flags: yargs.Arguments;
}
export declare function notify(): Promise<void>;
export declare function update(subcommand: string, { flags }: TelemetryOptions): Promise<void>;
export {};
