import { Index } from '../types/IndexType';
import { Options } from '../types/Options';
import { VersionResult } from '../types/VersionResult';
import { VersionSpec } from '../types/VersionSpec';
/**
 * Returns a 3-tuple of upgradedDependencies, their latest versions and the resulting peer dependencies.
 *
 * @param currentDependencies
 * @param options
 * @returns
 */
export declare function upgradePackageDefinitions(currentDependencies: Index<VersionSpec>, options: Options): Promise<[Index<VersionSpec>, Index<VersionResult>, Index<Index<VersionSpec>>?]>;
export default upgradePackageDefinitions;
