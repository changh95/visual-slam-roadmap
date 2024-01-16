/// <reference types="node" resolution-mode="require"/>
import type { AstroSettings, ManifestData } from '../../../@types/astro.js';
import type { Logger } from '../../logger/core.js';
import nodeFs from 'node:fs';
export interface CreateRouteManifestParams {
    /** Astro Settings object */
    settings: AstroSettings;
    /** Current working directory */
    cwd?: string;
    /** fs module, for testing */
    fsMod?: typeof nodeFs;
}
/** Create manifest of all static routes */
export declare function createRouteManifest({ settings, cwd, fsMod }: CreateRouteManifestParams, logger: Logger): ManifestData;
