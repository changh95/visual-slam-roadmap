import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../../@types/astro.js';
import type { BuildInternals } from '../internal.js';
import type { AstroBuildPlugin } from '../plugin.js';
import type { StaticBuildOptions } from '../types.js';
export declare function vitePluginHoistedScripts(settings: AstroSettings, internals: BuildInternals): VitePlugin;
export declare function pluginHoistedScripts(options: StaticBuildOptions, internals: BuildInternals): AstroBuildPlugin;
