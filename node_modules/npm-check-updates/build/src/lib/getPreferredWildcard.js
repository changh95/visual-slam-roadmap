"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const groupBy_1 = __importDefault(require("lodash/groupBy"));
const sortBy_1 = __importDefault(require("lodash/sortBy"));
const version_util_1 = require("./version-util");
/**
 *
 * @param dependencies A dependencies collection
 * @returns Returns whether the user prefers ^, ~, .*, or .x
 * (simply counts the greatest number of occurrences) or `null` if
 * given no dependencies.
 */
function getPreferredWildcard(dependencies) {
    // if there are no dependencies, return null.
    if (Object.keys(dependencies).length === 0) {
        return null;
    }
    // group the dependencies by wildcard
    const groups = (0, groupBy_1.default)(Object.values(dependencies), dep => version_util_1.WILDCARDS.find((wildcard) => dep && dep.includes(wildcard)));
    delete groups.undefined; // eslint-disable-line fp/no-delete
    const arrOfGroups = Object.entries(groups).map(([wildcard, instances]) => ({ wildcard, instances }));
    // reverse sort the groups so that the wildcard with the most appearances is at the head, then return it.
    const sorted = (0, sortBy_1.default)(arrOfGroups, wildcardObject => -wildcardObject.instances.length);
    return sorted.length > 0 ? sorted[0].wildcard : null;
}
exports.default = getPreferredWildcard;
//# sourceMappingURL=getPreferredWildcard.js.map