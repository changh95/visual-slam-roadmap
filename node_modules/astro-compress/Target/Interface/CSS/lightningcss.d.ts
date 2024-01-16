/**
 * @module CSS
 *
 */
export default interface Type extends Omit<TransformOptions<CustomAtRules>, "filename" | "code"> {
    /**
     * Whether to enable minification
     *
     * @default AstroCompress true
     * @default lightningcss false
     */
    minify?: boolean;
}
import type { TransformOptions, CustomAtRules } from "lightningcss";
