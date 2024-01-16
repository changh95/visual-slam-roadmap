import { Cacher } from '../types/Cacher';
import { Options } from '../types/Options';
export declare const CACHE_DELIMITER = "___";
export declare const defaultCacheFilename = ".ncu-cache.json";
export declare const defaultCacheFile: string;
export declare const resolvedDefaultCacheFile: string;
/** Resolve the cache file path based on os/homedir. */
export declare function resolveCacheFile(optionsCacheFile: string): string;
/** Clear the default cache, or the cache file specified by --cacheFile. */
export declare function cacheClear(options: Options): Promise<void>;
/**
 * The cacher stores key (name + target) - value (new version) pairs
 * for quick updates across `ncu` calls.
 *
 * @returns
 */
export default function cacher(options: Omit<Options, 'cacher'>): Promise<Cacher | undefined>;
