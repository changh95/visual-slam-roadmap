import type * as vite from 'vite';
import type { AstroSettings } from '../@types/astro.js';
interface EnvPluginOptions {
    settings: AstroSettings;
}
export default function envVitePlugin({ settings }: EnvPluginOptions): vite.Plugin;
export {};
