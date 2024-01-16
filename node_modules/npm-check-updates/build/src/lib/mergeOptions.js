"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Merges two arrays into one, removing duplicates. */
function mergeArrays(arr1, arr2) {
    return Array.from(new Set([...(arr1 || []), ...(arr2 || [])]));
}
/**
 * Shallow merge (specific or all) properties.
 * If some properties both are arrays, then merge them also.
 */
function mergeOptions(rawOptions1, rawOptions2) {
    const options1 = rawOptions1 || {};
    const options2 = rawOptions2 || {};
    const result = { ...options1, ...options2 };
    Object.keys(result).forEach(key => {
        if (Array.isArray(options1[key]) && Array.isArray(options2[key])) {
            result[key] = mergeArrays(options1[key], options2[key]);
        }
    });
    return result;
}
exports.default = mergeOptions;
//# sourceMappingURL=mergeOptions.js.map