import { TrustedRoot } from '@sigstore/protobuf-specs';
import { TUFOptions as RequiredTUFOptions, TUF } from './client';
export type TUFOptions = Partial<RequiredTUFOptions>;
export declare function getTrustedRoot(options?: TUFOptions): Promise<TrustedRoot>;
export declare function initTUF(options?: TUFOptions): Promise<TUF>;
export type { TUF } from './client';
export { TUFError } from './error';
