import { Index } from '../types/IndexType';
import { Options } from '../types/Options';
import { VersionResult } from '../types/VersionResult';
import { VersionSpec } from '../types/VersionSpec';
/**
 * Get the latest or greatest versions from the NPM repository based on the version target.
 *
 * @param packageMap   An object whose keys are package name and values are current versions. May include npm aliases, i.e. { "package": "npm:other-package@1.0.0" }
 * @param [options={}] Options. Default: { target: 'latest' }.
 * @returns Promised {packageName: version} collection
 */
declare function queryVersions(packageMap: Index<VersionSpec>, options?: Options): Promise<Index<VersionResult>>;
export default queryVersions;
