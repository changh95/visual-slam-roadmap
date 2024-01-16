import type { OutputChunk } from 'rollup';
import type { SerializedSSRManifest } from '../../app/types.js';
import { type BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';
export declare const SSR_MANIFEST_VIRTUAL_MODULE_ID = "@astrojs-manifest";
export declare const RESOLVED_SSR_MANIFEST_VIRTUAL_MODULE_ID: string;
export declare function pluginManifest(options: StaticBuildOptions, internals: BuildInternals): AstroBuildPlugin;
export declare function createManifest(buildOpts: StaticBuildOptions, internals: BuildInternals): Promise<SerializedSSRManifest>;
/**
 * It injects the manifest in the given output rollup chunk. It returns the new emitted code
 * @param buildOpts
 * @param internals
 * @param chunk
 */
export declare function injectManifest(manifest: SerializedSSRManifest, chunk: Readonly<OutputChunk>): string;
