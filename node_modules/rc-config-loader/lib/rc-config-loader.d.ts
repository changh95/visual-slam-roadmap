import type { PossibleUndefined, rcConfigLoaderOption, rcConfigResult } from "./types";
/**
 * Find and load rcfile, return { config, filePath }
 * If not found any rcfile, throw an Error.
 * @param {string} pkgName
 * @param {rcConfigLoaderOption} [opts]
 * @returns {{ config: Object, filePath:string } | undefined}
 */
export declare function rcFile<R extends {}>(pkgName: string, opts?: rcConfigLoaderOption): PossibleUndefined<rcConfigResult<R>>;
