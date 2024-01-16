/**
 * @module Files
 *
 */
export default interface Type {
    /**
     * The function `In` takes a path and updates the `Plan.Paths` property with the input and output
     * paths.
     *
     * @param Path parameter is a string that represents the path to a file or
     * directory. It has a default value of "./", which means it will use the current directory if no path
     * is provided.
     *
     */
    In: (Path: Path) => Promise<ThisType<Type>>;
    /**
     * The function `By` takes a file pattern or an array of file patterns and returns a promise that
     * resolves to the results of executing the patterns on the specified paths.
     *
     * @param File parameter is of type `Pattern` or
     * `Pattern[]`. It represents the file or files that you want to search for. The `Pattern` type is a
     * string pattern that can include wildcards to match multiple files.
     *
     */
    By: (File: Pattern | Pattern[]) => Promise<ThisType<Type>>;
    /**
     * The function `Not` takes a `File` parameter and excludes it from the `Plan.Results` array.
     *
     * @param File - The parameter "File" is of type "Option['Exclude']".
     *
     */
    Not: (File: Option["Exclude"]) => Promise<ThisType<Type>>;
    /**
     * The function `Pipe` is a TypeScript async function that takes an optional {@link "Action"}
     * parameter and returns the result of calling {@link "Pipe"} with `this.Plan` and {@link "Action"}.
     *
     * @param Action - The Action parameter is an optional parameter that
     * specifies the execution strategy to be used in the Pipe function. It has a default value of
     * Default.Pipe, which means that if no Action parameter is provided when calling the Pipe
     * function, it will use the default execution strategy.
     *
     */
    Pipe: (Action?: Action) => Promise<ThisType<Type>>;
    Plan: Plan;
}
import type Action from "./Action.js";
import type Option from "./Option.js";
import type Path from "../Type/Path.js";
import type Plan from "./Plan.js";
import type { Pattern } from "fast-glob";
