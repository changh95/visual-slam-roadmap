/**
 * @module Apply
 *
 */
export default interface Type {
    /**
     * The function `Apply` takes a function `_Function` and a test value `Test`, and applies `_Function` to `Test` based
     * on its type (Map, Set, Array, or other) and returns the result.
     *
     * @param _Function - _Function is a parameter that represents a function. It can be any type of function.
     *
     * @param Test - The `Test` parameter can be any value that you want to apply the function `_Function` to. It can be a single value, an array of values, a set of values, or a map of key-value pairs.
     *
     */
    (_Function: (Test: any) => any, Test: any): Promise<any>;
}
