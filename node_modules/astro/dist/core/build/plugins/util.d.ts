import type { Rollup, Plugin as VitePlugin } from 'vite';
type OutputOptionsHook = Extract<VitePlugin['outputOptions'], Function>;
type OutputOptions = Parameters<OutputOptionsHook>[0];
type ExtendManualChunksHooks = {
    before?: Rollup.GetManualChunk;
    after?: Rollup.GetManualChunk;
};
export declare function extendManualChunks(outputOptions: OutputOptions, hooks: ExtendManualChunksHooks): void;
export declare const ASTRO_PAGE_EXTENSION_POST_PATTERN = "@_@";
/**
 * 1. We add a fixed prefix, which is used as virtual module naming convention;
 * 2. We replace the dot that belongs extension with an arbitrary string.
 *
 * @param virtualModulePrefix
 * @param path
 */
export declare function getVirtualModulePageNameFromPath(virtualModulePrefix: string, path: string): string;
/**
 *
 * @param virtualModulePrefix
 * @param id
 */
export declare function getPathFromVirtualModulePageName(virtualModulePrefix: string, id: string): string;
export {};
