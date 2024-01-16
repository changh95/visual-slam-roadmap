import type { ComponentInstance } from '../@types/astro.js';
import type DevPipeline from './devPipeline.js';
export declare function preload({ pipeline, filePath, }: {
    pipeline: DevPipeline;
    filePath: URL;
}): Promise<ComponentInstance>;
export { createController, runWithErrorHandling } from './controller.js';
export { default as vitePluginAstroServer } from './plugin.js';
export { handleRequest } from './request.js';
