import { Index } from '../types/IndexType';
import { Options } from '../types/Options';
import { VersionSpec } from '../types/VersionSpec';
/**
 * Get the latest or greatest versions from the NPM repository based on the version target.
 *
 * @param packageMap   An object whose keys are package name and values are version
 * @param [options={}] Options.
 * @returns Promised {packageName: peer dependencies} collection
 */
declare function getPeerDependenciesFromRegistry(packageMap: Index<VersionSpec>, options: Options): Promise<{}>;
export default getPeerDependenciesFromRegistry;
