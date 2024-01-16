import type { GetModuleInfo } from 'rollup';
import type { AstroSettings } from '../../@types/astro.js';
export declare function shortHashedName(id: string, ctx: {
    getModuleInfo: GetModuleInfo;
}): string;
export declare function createNameHash(baseId: string | undefined, hashIds: string[]): string;
export declare function createSlugger(settings: AstroSettings): (id: string, ctx: {
    getModuleInfo: GetModuleInfo;
}) => string;
