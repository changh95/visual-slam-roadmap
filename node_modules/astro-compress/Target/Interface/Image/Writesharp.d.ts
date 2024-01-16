/**
 * @module Image
 *
 */
export default interface Type {
    (Option: Option, On: On): Promise<any>;
}
import type On from "./Onsharp.js";
import type Option from "./sharp.js";
