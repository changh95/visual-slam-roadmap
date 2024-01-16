/// <reference types="node" resolution-mode="require"/>
import nodeFs from 'node:fs';
import * as vite from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import type { Logger } from './logger/core.js';
interface CreateViteOptions {
    settings: AstroSettings;
    logger: Logger;
    mode: 'dev' | 'build' | string;
    command?: 'dev' | 'build';
    fs?: typeof nodeFs;
}
/** Return a common starting point for all Vite actions */
export declare function createVite(commandConfig: vite.InlineConfig, { settings, logger, mode, command, fs }: CreateViteOptions): Promise<vite.InlineConfig>;
export {};
