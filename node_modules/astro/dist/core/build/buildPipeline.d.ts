import type { AstroConfig, AstroSettings } from '../../@types/astro.js';
import type { SSRManifest } from '../app/types.js';
import type { Logger } from '../logger/core.js';
import { Pipeline } from '../pipeline.js';
import type { BuildInternals } from './internal.js';
import type { PageBuildData, StaticBuildOptions } from './types.js';
/**
 * This pipeline is responsible to gather the files emitted by the SSR build and generate the pages by executing these files.
 */
export declare class BuildPipeline extends Pipeline {
    #private;
    constructor(staticBuildOptions: StaticBuildOptions, internals: BuildInternals, manifest: SSRManifest);
    getInternals(): Readonly<BuildInternals>;
    getSettings(): Readonly<AstroSettings>;
    getStaticBuildOptions(): Readonly<StaticBuildOptions>;
    getConfig(): AstroConfig;
    getManifest(): SSRManifest;
    getLogger(): Logger;
    /**
     * The SSR build emits two important files:
     * - dist/server/manifest.mjs
     * - dist/renderers.mjs
     *
     * These two files, put together, will be used to generate the pages.
     *
     * ## Errors
     *
     * It will throw errors if the previous files can't be found in the file system.
     *
     * @param staticBuildOptions
     */
    static retrieveManifest(staticBuildOptions: StaticBuildOptions, internals: BuildInternals): Promise<SSRManifest>;
    /**
     * It collects the routes to generate during the build.
     *
     * It returns a map of page information and their relative entry point as a string.
     */
    retrieveRoutesToGenerate(): Map<PageBuildData, string>;
}
