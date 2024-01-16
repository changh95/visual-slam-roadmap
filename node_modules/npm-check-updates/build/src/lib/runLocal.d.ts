import { Index } from '../types/IndexType';
import { Maybe } from '../types/Maybe';
import { Options } from '../types/Options';
import { PackageFile } from '../types/PackageFile';
import { Version } from '../types/Version';
import { VersionSpec } from '../types/VersionSpec';
/**
 * Return a promise which resolves to object storing package owner changed status for each dependency.
 *
 * @param fromVersion current packages version.
 * @param toVersion target packages version.
 * @param options
 * @returns
 */
export declare function getOwnerPerDependency(fromVersion: Index<Version>, toVersion: Index<Version>, options: Options): Promise<Index<boolean>>;
/** Checks local project dependencies for upgrades. */
declare function runLocal(options: Options, pkgData?: Maybe<string>, pkgFile?: Maybe<string>): Promise<PackageFile | Index<VersionSpec>>;
export default runLocal;
