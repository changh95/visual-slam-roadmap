/**
 * @module Not
 *
 */
export default interface Type {
    /**
     *
     * The function `Not` filters out files from the `Files` array based on the provided `Pattern`
     * parameter.
     *
     * @param Pattern - The `Pattern` parameter is of type `Option["Exclude"]`. It represents the patterns
     * or filters that will be used to exclude certain files from the `Results` array.
     *
     * @param Results - The `Results` parameter is expected to be an array of results from a plan. Each element
     * in the array should be an array itself, with two elements. The first element represents the file
     * name, and the second element represents the file content.
     *
     */
    (Pattern: Option["Exclude"], Results: Plan["Results"]): Promise<Plan["Results"]>;
}
import type Option from "./Option.js";
import type Plan from "./Plan.js";
