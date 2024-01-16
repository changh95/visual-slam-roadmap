import { type Logger } from '../core/logger/core.js';
type GetPackageOptions = {
    skipAsk?: boolean;
    cwd?: string;
};
export declare function getPackage<T>(packageName: string, logger: Logger, options: GetPackageOptions, otherDeps?: string[]): Promise<T | undefined>;
export {};
