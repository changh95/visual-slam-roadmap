/**
 * @module Image
 *
 */
declare const _default: {
    avif: {
        chromaSubsampling: string;
        effort: number;
    };
    gif: {
        effort: number;
    };
    jpeg: {
        chromaSubsampling: string;
        mozjpeg: true;
        trellisQuantisation: true;
        overshootDeringing: true;
        optimiseScans: true;
    };
    png: {
        compressionLevel: number;
        palette: true;
    };
    raw: {};
    tiff: {
        compression: string;
    };
    webp: {
        effort: number;
    };
};
export default _default;
