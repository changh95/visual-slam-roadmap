/**
 * @module Parser
 *
 */
export default interface Type {
    [key: string]: any;
    CSS?: CSS | CSS[];
    HTML?: HTML | HTML[];
    Image?: Image | Image[];
    JavaScript?: JavaScript | JavaScript[];
    SVG?: SVG | SVG[];
}
import type CSS from "../Type/Parser/CSS.js";
import type HTML from "../Type/Parser/HTML.js";
import type Image from "../Type/Parser/Image.js";
import type JavaScript from "../Type/Parser/JavaScript.js";
import type SVG from "../Type/Parser/SVG.js";
