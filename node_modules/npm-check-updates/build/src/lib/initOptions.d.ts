import { Options } from '../types/Options';
import { RunOptions } from '../types/RunOptions';
/** Initializes, validates, sets defaults, and consolidates program options. */
declare function initOptions(runOptions: RunOptions, { cli }?: {
    cli?: boolean;
}): Promise<Options>;
export default initOptions;
