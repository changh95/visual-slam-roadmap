import { type ESBuildTransformResult } from 'vite';
import { type CompileProps, type CompileResult } from '../core/compile/index.js';
import type { Logger } from '../core/logger/core.js';
interface CachedFullCompilation {
    compileProps: CompileProps;
    logger: Logger;
}
interface FullCompileResult extends Omit<CompileResult, 'map'> {
    map: ESBuildTransformResult['map'];
}
export declare function cachedFullCompilation({ compileProps, logger, }: CachedFullCompilation): Promise<FullCompileResult>;
export {};
