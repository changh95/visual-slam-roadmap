/// <reference types="node" resolution-mode="require"/>
/**
 * @param {URL | string} resolved
 * @returns {PackageConfig}
 */
export function getPackageScopeConfig(resolved: URL | string): PackageConfig;
export type PackageConfig = import('./package-json-reader.js').PackageConfig;
import { URL } from 'node:url';
