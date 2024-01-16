import type { UserConfig } from 'vite';
import type { AstroUserConfig } from '../@types/astro.js';
export declare function defineConfig(config: AstroUserConfig): AstroUserConfig;
export declare function getViteConfig(inlineConfig: UserConfig): ({ mode, command }: {
    mode: string;
    command: 'serve' | 'build';
}) => Promise<Record<string, any>>;
