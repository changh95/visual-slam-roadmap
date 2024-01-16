import type { AstroSettings } from '../../../@types/astro.js';
import { type BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';
export declare const ASTRO_PAGE_MODULE_ID = "@astro-page:";
export declare const ASTRO_PAGE_RESOLVED_MODULE_ID: string;
/**
 * 1. We add a fixed prefix, which is used as virtual module naming convention;
 * 2. We replace the dot that belongs extension with an arbitrary string.
 *
 * @param path
 */
export declare function getVirtualModulePageNameFromPath(path: string): string;
export declare function getVirtualModulePageIdFromPath(path: string): string;
export declare function shouldBundleMiddleware(settings: AstroSettings): boolean;
export declare function pluginPages(opts: StaticBuildOptions, internals: BuildInternals): AstroBuildPlugin;
