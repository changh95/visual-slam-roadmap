import { Index } from '../types/IndexType';
/**
 *
 * @param dependencies A dependencies collection
 * @returns Returns whether the user prefers ^, ~, .*, or .x
 * (simply counts the greatest number of occurrences) or `null` if
 * given no dependencies.
 */
declare function getPreferredWildcard(dependencies: Index<string | null>): string | null;
export default getPreferredWildcard;
