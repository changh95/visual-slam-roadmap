import type { OutputAsset, OutputChunk } from 'rollup';
import type { AstroSettings, SSRLoadedRenderer, SSRManifest } from '../../@types/astro.js';
import { type BuildInternals } from '../../core/build/internal.js';
import type { StaticBuildOptions } from './types.js';
export declare function rootRelativeFacadeId(facadeId: string, settings: AstroSettings): string;
export declare function chunkIsPage(settings: AstroSettings, output: OutputAsset | OutputChunk, internals: BuildInternals): boolean;
export declare function generatePages(opts: StaticBuildOptions, internals: BuildInternals): Promise<void>;
/**
 * It creates a `SSRManifest` from the `AstroSettings`.
 *
 * Renderers needs to be pulled out from the page module emitted during the build.
 * @param settings
 * @param renderers
 */
export declare function createBuildManifest(settings: AstroSettings, internals: BuildInternals, renderers: SSRLoadedRenderer[]): SSRManifest;
