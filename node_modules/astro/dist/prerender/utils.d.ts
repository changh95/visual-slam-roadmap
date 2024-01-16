import type { AstroConfig } from '../@types/astro.js';
export declare function isServerLikeOutput(config: AstroConfig): boolean;
export declare function getPrerenderDefault(config: AstroConfig): boolean;
/**
 * Returns the correct output directory of hte SSR build based on the configuration
 */
export declare function getOutputDirectory(config: AstroConfig): URL;
