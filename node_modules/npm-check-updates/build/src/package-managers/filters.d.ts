import { Index } from '../types/IndexType';
import { Maybe } from '../types/Maybe';
import { Options } from '../types/Options';
import { Packument } from '../types/Packument';
import { Version } from '../types/Version';
/**
 * @param versionResult  Available version
 * @param options     Options
 * @returns         True if deprecated versions are allowed or the version is not deprecated
 */
export declare function allowDeprecatedOrIsNotDeprecated(versionResult: Packument, options: Options): boolean;
/**
 * @param versionResult  Available version
 * @param options     Options
 * @returns         True if pre-releases are allowed or the version is not a pre-release
 */
export declare function allowPreOrIsNotPre(versionResult: Packument, options: Options): boolean;
/**
 * Returns true if the node engine requirement is satisfied or not specified for a given package version.
 *
 * @param versionResult     Version object returned by pacote.packument.
 * @param nodeEngineVersion The value of engines.node in the package file.
 * @returns                 True if the node engine requirement is satisfied or not specified.
 */
export declare function satisfiesNodeEngine(versionResult: Packument, nodeEngineVersion: Maybe<string>): boolean;
/**
 * Returns true if the peer dependencies requirement is satisfied or not specified for a given package version.
 *
 * @param versionResult     Version object returned by pacote.packument.
 * @param peerDependencies  The list of peer dependencies.
 * @returns                 True if the peer dependencies are satisfied or not specified.
 */
export declare function satisfiesPeerDependencies(versionResult: Packument, peerDependencies: Index<Index<Version>>): boolean;
/** Returns a composite predicate that filters out deprecated, prerelease, and node engine incompatibilies from version objects returns by pacote.packument. */
export declare function filterPredicate(options: Options): (o: Packument) => boolean;
