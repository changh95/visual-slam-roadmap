// Manually “tree shaken” from:
// <https://github.com/nodejs/node/blob/45f5c9b/lib/internal/modules/package_json_reader.js>
// Last checked on: Nov 2, 2023.
// Removed the native dependency.
// Also: no need to cache, we do that in resolve already.

/**
 * @typedef {import('./errors.js').ErrnoException} ErrnoException
 *
 * @typedef {'commonjs' | 'module' | 'none'} PackageType
 *
 * @typedef PackageConfig
 * @property {string} pjsonPath
 * @property {boolean} exists
 * @property {string | undefined} main
 * @property {string | undefined} name
 * @property {PackageType} type
 * @property {Record<string, unknown> | undefined} exports
 * @property {Record<string, unknown> | undefined} imports
 */

import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {codes} from './errors.js'

const hasOwnProperty = {}.hasOwnProperty

const {ERR_INVALID_PACKAGE_CONFIG} = codes

/** @type {Map<string, PackageConfig>} */
const cache = new Map()

const reader = {read}
export default reader

/**
 * @param {string} jsonPath
 * @param {{specifier: URL | string, base?: URL}} options
 * @returns {PackageConfig}
 */
function read(jsonPath, {base, specifier}) {
  const existing = cache.get(jsonPath)

  if (existing) {
    return existing
  }

  /** @type {string | undefined} */
  let string

  try {
    string = fs.readFileSync(path.toNamespacedPath(jsonPath), 'utf8')
  } catch (error) {
    const exception = /** @type {ErrnoException} */ (error)

    if (exception.code !== 'ENOENT') {
      throw exception
    }
  }

  /** @type {PackageConfig} */
  const result = {
    exists: false,
    pjsonPath: jsonPath,
    main: undefined,
    name: undefined,
    type: 'none', // Ignore unknown types for forwards compatibility
    exports: undefined,
    imports: undefined
  }

  if (string !== undefined) {
    /** @type {Record<string, unknown>} */
    let parsed

    try {
      parsed = JSON.parse(string)
    } catch (error_) {
      const cause = /** @type {ErrnoException} */ (error_)
      const error = new ERR_INVALID_PACKAGE_CONFIG(
        jsonPath,
        (base ? `"${specifier}" from ` : '') + fileURLToPath(base || specifier),
        cause.message
      )
      // @ts-expect-error: fine.
      error.cause = cause
      throw error
    }

    result.exists = true

    if (
      hasOwnProperty.call(parsed, 'name') &&
      typeof parsed.name === 'string'
    ) {
      result.name = parsed.name
    }

    if (
      hasOwnProperty.call(parsed, 'main') &&
      typeof parsed.main === 'string'
    ) {
      result.main = parsed.main
    }

    if (hasOwnProperty.call(parsed, 'exports')) {
      // @ts-expect-error: assume valid.
      result.exports = parsed.exports
    }

    if (hasOwnProperty.call(parsed, 'imports')) {
      // @ts-expect-error: assume valid.
      result.imports = parsed.imports
    }

    // Ignore unknown types for forwards compatibility
    if (
      hasOwnProperty.call(parsed, 'type') &&
      (parsed.type === 'commonjs' || parsed.type === 'module')
    ) {
      result.type = parsed.type
    }
  }

  cache.set(jsonPath, result)

  return result
}
