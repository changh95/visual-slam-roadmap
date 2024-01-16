/**
 * @module Image
 *
 */
export default interface Type extends Omit<File, "Buffer"> {
    Buffer: {
        [key: string]: any;
    } & Sharp;
}
import type File from "files-pipe/Target/Interface/File.js";
import type { Sharp } from "sharp";
