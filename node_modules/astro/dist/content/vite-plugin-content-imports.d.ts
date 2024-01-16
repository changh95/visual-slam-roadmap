/// <reference types="node" resolution-mode="require"/>
import type fsMod from 'node:fs';
import type { Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
export declare function astroContentImportPlugin({ fs, settings, }: {
    fs: typeof fsMod;
    settings: AstroSettings;
}): Plugin[];
