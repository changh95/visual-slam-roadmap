import { Options } from '../types/Options';
/**
 * @param [options]
 * @param options.cwd
 * @param options.filter
 * @param options.global
 * @param options.packageManager
 * @param options.prefix
 * @param options.reject
 */
declare function getInstalledPackages(options?: Options): Promise<import("../types/IndexType").Index<string>>;
export default getInstalledPackages;
