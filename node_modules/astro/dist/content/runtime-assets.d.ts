import type { PluginContext } from 'rollup';
import { z } from 'zod';
export declare function createImage(pluginContext: PluginContext, entryFilePath: string): () => z.ZodEffects<z.ZodString, z.ZodNever | {
    ASTRO_ASSET: string;
    src: string;
    width: number;
    height: number;
    format: "jpeg" | "jpg" | "png" | "tiff" | "webp" | "gif" | "svg" | "avif";
    orientation?: number | undefined;
    fsPath: string;
}, string>;
