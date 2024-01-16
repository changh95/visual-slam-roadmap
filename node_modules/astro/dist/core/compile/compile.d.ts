import type { TransformResult } from '@astrojs/compiler';
import type { ResolvedConfig } from 'vite';
import type { AstroConfig } from '../../@types/astro.js';
import type { AstroPreferences } from '../../preferences/index.js';
export interface CompileProps {
    astroConfig: AstroConfig;
    viteConfig: ResolvedConfig;
    preferences: AstroPreferences;
    filename: string;
    source: string;
}
export interface CompileResult extends TransformResult {
    cssDeps: Set<string>;
    source: string;
}
export declare function compile({ astroConfig, viteConfig, preferences, filename, source, }: CompileProps): Promise<CompileResult>;
