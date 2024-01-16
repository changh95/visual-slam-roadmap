import type { AstroInlineConfig } from '../../@types/astro.js';
import type { Logger } from '../logger/core.js';
export type ProcessExit = 0 | 1;
export type SyncOptions = {};
export type SyncInternalOptions = SyncOptions & {
    logger: Logger;
};
/**
 * Generates TypeScript types for all Astro modules. This sets up a `src/env.d.ts` file for type inferencing,
 * and defines the `astro:content` module for the Content Collections API.
 *
 * @experimental The JavaScript API is experimental
 */
export default function sync(inlineConfig: AstroInlineConfig, options?: SyncOptions): Promise<ProcessExit>;
