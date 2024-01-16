import type { AstroConfig, AstroSettings, SSRManifest } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import { Pipeline } from '../core/pipeline.js';
import type { Environment } from '../core/render/index.js';
export default class DevPipeline extends Pipeline {
    #private;
    constructor({ manifest, logger, settings, loader, }: {
        manifest: SSRManifest;
        logger: Logger;
        settings: AstroSettings;
        loader: ModuleLoader;
    });
    clearRouteCache(): void;
    getSettings(): Readonly<AstroSettings>;
    getConfig(): Readonly<AstroConfig>;
    getModuleLoader(): Readonly<ModuleLoader>;
    get logger(): Readonly<Logger>;
    loadRenderers(): Promise<void>;
    static createDevelopmentEnvironment(manifest: SSRManifest, settings: AstroSettings, logger: Logger, loader: ModuleLoader): Environment;
    handleFallback(): Promise<void>;
}
