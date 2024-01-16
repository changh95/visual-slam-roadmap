import type { AstroConfig } from '../@types/astro.js';
export declare function getFileInfo(id: string, config: AstroConfig): {
    fileId: string;
    fileUrl: string | undefined;
};
/**
 * Normalizes different file names like:
 *
 * - /@fs/home/user/project/src/pages/index.astro
 * - /src/pages/index.astro
 *
 * as absolute file paths with forward slashes.
 */
export declare function normalizeFilename(filename: string, root: URL): string;
export declare function cleanUrl(url: string): string;
