import type { ModuleLoader } from '../core/module-loader/index.js';
import type { AstroConfig } from '../@types/astro.js';
import type DevPipeline from './devPipeline.js';
export declare function recordServerError(loader: ModuleLoader, config: AstroConfig, pipeline: DevPipeline, _err: unknown): {
    error: Error;
    errorWithMetadata: import("../core/errors/errors.js").ErrorWithMetadata;
};
