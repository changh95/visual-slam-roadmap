/// <reference types="node" />
/// <reference types="node" />
import { BinaryLike, KeyLike } from 'crypto';
export declare function createPublicKey(key: string | Buffer): KeyLike;
export declare function verifyBlob(data: Buffer, key: KeyLike, signature: Buffer, algorithm?: string): boolean;
export declare function hash(data: BinaryLike): Buffer;
export declare function randomBytes(count: number): Buffer;
export declare function bufferEqual(a: Buffer, b: Buffer): boolean;
