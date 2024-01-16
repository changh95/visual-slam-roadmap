"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyValueBy = void 0;
/** Generates an object from an array or object. Simpler than reduce or _.transform. The KeyValueGenerator passes (key, value) if the input is an object, and (value, i) if it is an array. The return object from each iteration is merged into the accumulated object. Return null to skip an item. */
function keyValueBy(input, 
// if no keyValue is given, sets all values to true
keyValue, accum = {}) {
    const isArray = Array.isArray(input);
    keyValue = keyValue || ((key) => ({ [key]: true }));
    // considerably faster than Array.prototype.reduce
    Object.entries(input || {}).forEach(([key, value], i) => {
        const o = isArray
            ? keyValue(value, i, accum)
            : keyValue(key, value, accum);
        Object.entries(o || {}).forEach(entry => {
            accum[entry[0]] = entry[1];
        });
    });
    return accum;
}
exports.keyValueBy = keyValueBy;
exports.default = keyValueBy;
//# sourceMappingURL=keyValueBy.js.map