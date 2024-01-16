import { Index } from '../types/IndexType';
import { Options } from '../types/Options';
import { VersionSpec } from '../types/VersionSpec';
/** Get peer dependencies from installed packages */
declare function getPeerDependencies(current: Index<VersionSpec>, options: Options): Promise<Index<Index<string>>>;
export default getPeerDependencies;
