/// <reference types="node" resolution-mode="require"/>
import type fsMod from 'node:fs';
import { type Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import { type Logger } from '../core/logger/core.js';
export declare function getEnvTsPath({ srcDir }: {
    srcDir: URL;
}): URL;
export declare function astroInjectEnvTsPlugin({ settings, logger, fs, }: {
    settings: AstroSettings;
    logger: Logger;
    fs: typeof fsMod;
}): Plugin;
export declare function setUpEnvTs({ settings, logger, fs, }: {
    settings: AstroSettings;
    logger: Logger;
    fs: typeof fsMod;
}): Promise<void>;
