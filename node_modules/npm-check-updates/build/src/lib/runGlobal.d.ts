import { Index } from '../types/IndexType';
import { Options } from '../types/Options';
/** Checks global dependencies for upgrades. */
declare function runGlobal(options: Options): Promise<Index<string> | void>;
export default runGlobal;
