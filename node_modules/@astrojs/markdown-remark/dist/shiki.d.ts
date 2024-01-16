import type { ShikiConfig } from './types.js';
export interface ShikiHighlighter {
    highlight(code: string, lang?: string, options?: {
        inline?: boolean;
    }): string;
}
export declare function createShikiHighlighter({ langs, theme, experimentalThemes, wrap, }?: ShikiConfig): Promise<ShikiHighlighter>;
