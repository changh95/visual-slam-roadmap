/**
 * @module In
 *
 */
export default interface Type {
    /**
     * The function `In` takes a `Path` and a `Paths` object, and adds the `Path` to the `Paths` object.
     *
     *
     * @param Path - The `Path` parameter is a string or URL that represents the path to a file or
     * directory.
     *
     * @param Paths - Paths is a variable of type Plan["Paths"]. It is likely an object or a map that
     * stores key-value pairs.
     *
     */
    (Path: Path, Paths: Plan["Paths"]): Promise<Plan["Paths"]>;
}
import type Path from "../Type/Path.js";
import type Plan from "../Interface/Plan.js";
