import { Index } from '../types/IndexType';
import { Options } from '../types/Options';
import { Version } from '../types/Version';
import { VersionSpec } from '../types/VersionSpec';
/**
 * Upgrade a dependencies collection based on latest available versions. Supports npm aliases.
 *
 * @param currentDependencies current dependencies collection object
 * @param latestVersions latest available versions collection object
 * @param [options={}]
 * @returns upgraded dependency collection object
 */
declare function upgradeDependencies(currentDependencies: Index<VersionSpec | null>, latestVersions: Index<Version>, options?: Options): Index<VersionSpec>;
export default upgradeDependencies;
