"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addToCompilationCache = addToCompilationCache;
exports.belongsToNodeModules = belongsToNodeModules;
exports.clearCompilationCache = clearCompilationCache;
exports.collectAffectedTestFiles = collectAffectedTestFiles;
exports.currentFileDepsCollector = currentFileDepsCollector;
exports.dependenciesForTestFile = dependenciesForTestFile;
exports.fileDependenciesForTest = fileDependenciesForTest;
exports.getFromCompilationCache = getFromCompilationCache;
exports.installSourceMapSupportIfNeeded = installSourceMapSupportIfNeeded;
exports.serializeCompilationCache = serializeCompilationCache;
exports.setExternalDependencies = setExternalDependencies;
exports.startCollectingFileDeps = startCollectingFileDeps;
exports.stopCollectingFileDeps = stopCollectingFileDeps;
var _fs = _interopRequireDefault(require("fs"));
var _os = _interopRequireDefault(require("os"));
var _path = _interopRequireDefault(require("path"));
var _utilsBundle = require("../utilsBundle");
var _globals = require("../common/globals");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Assumptions for the compilation cache:
// - Files in the temp directory we work with can disappear at any moment, either some of them or all together.
// - Multiple workers can be trying to read from the compilation cache at the same time.
// - There is a single invocation of the test runner at a time.
//
// Therefore, we implement the following logic:
// - Never assume that file is present, always try to read it to determine whether it's actually present.
// - Never write to the cache from worker processes to avoid "multiple writers" races.
// - Since we perform all static imports in the runner beforehand, most of the time
//   workers should be able to read from the cache.
// - For workers-only dynamic imports or some cache problems, we will re-transpile files in
//   each worker anew.
const cacheDir = process.env.PWTEST_CACHE_DIR || (() => {
  if (process.platform === 'win32') return _path.default.join(_os.default.tmpdir(), `playwright-transform-cache`);
  // Use `geteuid()` instead of more natural `os.userInfo().username`
  // since `os.userInfo()` is not always available.
  // Note: `process.geteuid()` is not available on windows.
  // See https://github.com/microsoft/playwright/issues/22721
  return _path.default.join(_os.default.tmpdir(), `playwright-transform-cache-` + process.geteuid());
})();
const sourceMaps = new Map();
const memoryCache = new Map();
// Dependencies resolved by the loader.
const fileDependencies = new Map();
// Dependencies resolved by the external bundler.
const externalDependencies = new Map();
let sourceMapSupportInstalled = false;
function installSourceMapSupportIfNeeded() {
  if (sourceMapSupportInstalled) return;
  sourceMapSupportInstalled = true;
  Error.stackTraceLimit = 200;
  _utilsBundle.sourceMapSupport.install({
    environment: 'node',
    handleUncaughtExceptions: false,
    retrieveSourceMap(source) {
      if (!sourceMaps.has(source)) return null;
      const sourceMapPath = sourceMaps.get(source);
      try {
        return {
          map: JSON.parse(_fs.default.readFileSync(sourceMapPath, 'utf-8')),
          url: source
        };
      } catch {
        return null;
      }
    }
  });
}
function _innerAddToCompilationCache(filename, options) {
  sourceMaps.set(options.moduleUrl || filename, options.sourceMapPath);
  memoryCache.set(filename, options);
}
function getFromCompilationCache(filename, hash, moduleUrl) {
  // First check the memory cache by filename, this cache will always work in the worker,
  // because we just compiled this file in the loader.
  const cache = memoryCache.get(filename);
  if (cache !== null && cache !== void 0 && cache.codePath) {
    try {
      return {
        cachedCode: _fs.default.readFileSync(cache.codePath, 'utf-8')
      };
    } catch {
      // Not able to read the file - fall through.
    }
  }

  // Then do the disk cache, this cache works between the Playwright Test runs.
  const cachePath = calculateCachePath(filename, hash);
  const codePath = cachePath + '.js';
  const sourceMapPath = cachePath + '.map';
  try {
    const cachedCode = _fs.default.readFileSync(codePath, 'utf8');
    _innerAddToCompilationCache(filename, {
      codePath,
      sourceMapPath,
      moduleUrl
    });
    return {
      cachedCode
    };
  } catch {}
  return {
    addToCache: (code, map) => {
      if ((0, _globals.isWorkerProcess)()) return;
      _fs.default.mkdirSync(_path.default.dirname(cachePath), {
        recursive: true
      });
      if (map) _fs.default.writeFileSync(sourceMapPath, JSON.stringify(map), 'utf8');
      _fs.default.writeFileSync(codePath, code, 'utf8');
      _innerAddToCompilationCache(filename, {
        codePath,
        sourceMapPath,
        moduleUrl
      });
    }
  };
}
function serializeCompilationCache() {
  return {
    sourceMaps: [...sourceMaps.entries()],
    memoryCache: [...memoryCache.entries()],
    fileDependencies: [...fileDependencies.entries()].map(([filename, deps]) => [filename, [...deps]]),
    externalDependencies: [...externalDependencies.entries()].map(([filename, deps]) => [filename, [...deps]])
  };
}
function clearCompilationCache() {
  sourceMaps.clear();
  memoryCache.clear();
}
function addToCompilationCache(payload) {
  for (const entry of payload.sourceMaps) sourceMaps.set(entry[0], entry[1]);
  for (const entry of payload.memoryCache) memoryCache.set(entry[0], entry[1]);
  for (const entry of payload.fileDependencies) fileDependencies.set(entry[0], new Set(entry[1]));
  for (const entry of payload.externalDependencies) externalDependencies.set(entry[0], new Set(entry[1]));
}
function calculateCachePath(filePath, hash) {
  const fileName = _path.default.basename(filePath, _path.default.extname(filePath)).replace(/\W/g, '') + '_' + hash;
  return _path.default.join(cacheDir, hash[0] + hash[1], fileName);
}

// Since ESM and CJS collect dependencies differently,
// we go via the global state to collect them.
let depsCollector;
function startCollectingFileDeps() {
  depsCollector = new Set();
}
function stopCollectingFileDeps(filename) {
  if (!depsCollector) return;
  depsCollector.delete(filename);
  for (const dep of depsCollector) {
    if (belongsToNodeModules(dep)) depsCollector.delete(dep);
  }
  fileDependencies.set(filename, depsCollector);
  depsCollector = undefined;
}
function currentFileDepsCollector() {
  return depsCollector;
}
function setExternalDependencies(filename, deps) {
  const depsSet = new Set(deps.filter(dep => !belongsToNodeModules(dep) && dep !== filename));
  externalDependencies.set(filename, depsSet);
}
function fileDependenciesForTest() {
  return fileDependencies;
}
function collectAffectedTestFiles(dependency, testFileCollector) {
  testFileCollector.add(dependency);
  for (const [testFile, deps] of fileDependencies) {
    if (deps.has(dependency)) testFileCollector.add(testFile);
  }
  for (const [testFile, deps] of externalDependencies) {
    if (deps.has(dependency)) testFileCollector.add(testFile);
  }
}
function dependenciesForTestFile(filename) {
  const result = new Set();
  for (const dep of fileDependencies.get(filename) || []) result.add(dep);
  for (const dep of externalDependencies.get(filename) || []) result.add(dep);
  return result;
}

// These two are only used in the dev mode, they are specifically excluding
// files from packages/playwright*. In production mode, node_modules covers
// that.
const kPlaywrightInternalPrefix = _path.default.resolve(__dirname, '../../../playwright');
const kPlaywrightCoveragePrefix = _path.default.resolve(__dirname, '../../../../tests/config/coverage.js');
function belongsToNodeModules(file) {
  if (file.includes(`${_path.default.sep}node_modules${_path.default.sep}`)) return true;
  if (file.startsWith(kPlaywrightInternalPrefix) && file.endsWith('.js')) return true;
  if (file.startsWith(kPlaywrightCoveragePrefix) && file.endsWith('.js')) return true;
  return false;
}