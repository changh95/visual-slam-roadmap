import { type Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';
interface AstroPluginJSXOptions {
    settings: AstroSettings;
    logger: Logger;
}
/** Use Astro config to allow for alternate or multiple JSX renderers (by default Vite will assume React) */
export default function mdxVitePlugin({ settings }: AstroPluginJSXOptions): Plugin;
export {};
