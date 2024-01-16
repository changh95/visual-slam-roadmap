/**
 * @module Option
 *
 */
export default interface Type extends Option {
    /**
     * csso, lightningcss option properties
     *
     */
    CSS?: boolean | {
        csso?: csso;
        lightningcss?: lightningcss;
    };
    /**
     * html-minifier-terser option properties
     *
     */
    HTML?: boolean | {
        "html-minifier-terser"?: html_minifier_terser;
    };
    /**
     * sharp option properties
     *
     */
    Image?: boolean | {
        sharp?: sharp;
    };
    /**
     * terser option properties
     *
     */
    JavaScript?: boolean | {
        terser?: terser;
    };
    /**
     * svgo option properties
     *
     */
    SVG?: boolean | {
        svgo?: svgo;
    };
    /**
     * Map to different file paths
     *
     */
    Map?: boolean | _Map;
    /**
     * Parsers for different file types
     *
     */
    Parser?: Parser;
}
import type html_minifier_terser from "../Type/HTML/html-minifier-terser.js";
import type terser from "../Type/JavaScript/terser.js";
import type svgo from "../Type/SVG/svgo.js";
import type csso from "./CSS/csso.js";
import type lightningcss from "./CSS/lightningcss.js";
import type sharp from "./Image/sharp.js";
import type _Map from "./Map.js";
import type Parser from "./Parser.js";
import type Option from "files-pipe/Target/Interface/Option.js";
