/// <reference types="node" resolution-mode="require"/>
import type nodeFs from 'node:fs';
import type { AstroInlineConfig } from '../../@types/astro.js';
import type { Container } from './container.js';
export declare function shouldRestartContainer({ settings, inlineConfig, restartInFlight }: Container, changedFile: string): boolean;
export declare function restartContainer(container: Container): Promise<Container | Error>;
export interface CreateContainerWithAutomaticRestart {
    inlineConfig?: AstroInlineConfig;
    fs: typeof nodeFs;
}
interface Restart {
    container: Container;
    restarted: () => Promise<Error | null>;
}
export declare function createContainerWithAutomaticRestart({ inlineConfig, fs, }: CreateContainerWithAutomaticRestart): Promise<Restart>;
export {};
