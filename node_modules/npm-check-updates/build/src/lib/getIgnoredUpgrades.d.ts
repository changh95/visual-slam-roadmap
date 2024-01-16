import { IgnoredUpgrade } from '../types/IgnoredUpgrade';
import { Index } from '../types/IndexType';
import { Options } from '../types/Options';
import { Version } from '../types/Version';
import { VersionSpec } from '../types/VersionSpec';
/** Get all upgrades that are ignored due to incompatible peer dependencies. */
export declare function getIgnoredUpgrades(current: Index<VersionSpec>, upgraded: Index<VersionSpec>, upgradedPeerDependencies: Index<Index<Version>>, options?: Options): Promise<Index<IgnoredUpgrade>>;
export default getIgnoredUpgrades;
