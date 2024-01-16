import type { AstroConfig } from '../@types/astro.js';
import { type ImageService } from './services/service.js';
import type { GetImageResult, UnresolvedImageTransform } from './types.js';
export declare function getConfiguredImageService(): Promise<ImageService>;
export declare function getImage(options: UnresolvedImageTransform, imageConfig: AstroConfig['image']): Promise<GetImageResult>;
