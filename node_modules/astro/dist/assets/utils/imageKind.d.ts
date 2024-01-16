import type { ImageMetadata } from '../types.js';
export declare function isESMImportedImage(src: ImageMetadata | string): src is ImageMetadata;
export declare function isRemoteImage(src: ImageMetadata | string): src is string;
