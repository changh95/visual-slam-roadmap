/**
 * @module Image
 *
 */
export default interface Type {
    [key: string]: undefined | boolean | AvifOptions | GifOptions | HeifOptions | JpegOptions | PngOptions | TiffOptions | WebpOptions;
    avif?: boolean | AvifOptions;
    gif?: boolean | GifOptions;
    heif?: boolean | HeifOptions;
    jpeg?: boolean | JpegOptions;
    png?: boolean | PngOptions;
    tiff?: boolean | TiffOptions;
    webp?: boolean | WebpOptions;
}
import type { AvifOptions, GifOptions, HeifOptions, JpegOptions, PngOptions, TiffOptions, WebpOptions } from "sharp";
