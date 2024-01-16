// Manually “tree shaken” from:
// <https://github.com/nodejs/node/blob/45f5c9b/lib/internal/modules/esm/package_config.js>
// Last checked on: Nov 2, 2023.

/**
 * @typedef {import('./package-json-reader.js').PackageConfig} PackageConfig
 */

import {URL, fileURLToPath} from 'node:url'
import packageJsonReader from './package-json-reader.js'

/**
 * @param {URL | string} resolved
 * @returns {PackageConfig}
 */
export function getPackageScopeConfig(resolved) {
  let packageJSONUrl = new URL('package.json', resolved)

  while (true) {
    const packageJSONPath = packageJSONUrl.pathname
    if (packageJSONPath.endsWith('node_modules/package.json')) {
      break
    }

    const packageConfig = packageJsonReader.read(
      fileURLToPath(packageJSONUrl),
      {specifier: resolved}
    )

    if (packageConfig.exists) {
      return packageConfig
    }

    const lastPackageJSONUrl = packageJSONUrl
    packageJSONUrl = new URL('../package.json', packageJSONUrl)

    // Terminates at root where ../package.json equals ../../package.json
    // (can't just check "/package.json" for Windows support).
    if (packageJSONUrl.pathname === lastPackageJSONUrl.pathname) {
      break
    }
  }

  const packageJSONPath = fileURLToPath(packageJSONUrl)

  return {
    pjsonPath: packageJSONPath,
    exists: false,
    main: undefined,
    name: undefined,
    type: 'none',
    exports: undefined,
    imports: undefined
  }
}
