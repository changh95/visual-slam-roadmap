"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tsConfigLoader = tsConfigLoader;
exports.walkForTsConfig = walkForTsConfig;
var path = _interopRequireWildcard(require("path"));
var fs = _interopRequireWildcard(require("fs"));
var _utilsBundle = require("../utilsBundle");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Jonas Kello
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/* eslint-disable */

/**
 * Typing for the parts of tsconfig that we care about
 */

function tsConfigLoader({
  cwd
}) {
  const loadResult = loadSyncDefault(cwd);
  loadResult.serialized = JSON.stringify(loadResult);
  return loadResult;
}
function loadSyncDefault(cwd) {
  var _config$compilerOptio;
  // Tsconfig.loadSync uses path.resolve. This is why we can use an absolute path as filename

  const configPath = resolveConfigPath(cwd);
  if (!configPath) {
    return {
      tsConfigPath: undefined,
      baseUrl: undefined,
      paths: undefined,
      serialized: undefined,
      allowJs: false
    };
  }
  const config = loadTsconfig(configPath);
  return {
    tsConfigPath: configPath,
    baseUrl: config && config.compilerOptions && config.compilerOptions.baseUrl,
    paths: config && config.compilerOptions && config.compilerOptions.paths,
    serialized: undefined,
    allowJs: !!(config !== null && config !== void 0 && (_config$compilerOptio = config.compilerOptions) !== null && _config$compilerOptio !== void 0 && _config$compilerOptio.allowJs)
  };
}
function resolveConfigPath(cwd) {
  if (fs.statSync(cwd).isFile()) {
    return path.resolve(cwd);
  }
  const configAbsolutePath = walkForTsConfig(cwd);
  return configAbsolutePath ? path.resolve(configAbsolutePath) : undefined;
}
function walkForTsConfig(directory, existsSync = fs.existsSync) {
  const tsconfigPath = path.join(directory, "./tsconfig.json");
  if (existsSync(tsconfigPath)) {
    return tsconfigPath;
  }
  const jsconfigPath = path.join(directory, "./jsconfig.json");
  if (existsSync(jsconfigPath)) {
    return jsconfigPath;
  }
  const parentDirectory = path.join(directory, "../");

  // If we reached the top
  if (directory === parentDirectory) {
    return undefined;
  }
  return walkForTsConfig(parentDirectory, existsSync);
}
function loadTsconfig(configFilePath) {
  var _config$compilerOptio2;
  if (!fs.existsSync(configFilePath)) {
    return undefined;
  }
  const configString = fs.readFileSync(configFilePath, 'utf-8');
  const cleanedJson = StripBom(configString);
  const parsedConfig = _utilsBundle.json5.parse(cleanedJson);
  let config = {};
  const extendsArray = Array.isArray(parsedConfig.extends) ? parsedConfig.extends : parsedConfig.extends ? [parsedConfig.extends] : [];
  for (let extendedConfig of extendsArray) {
    if (typeof extendedConfig === "string" && extendedConfig.indexOf(".json") === -1) {
      extendedConfig += ".json";
    }
    const currentDir = path.dirname(configFilePath);
    let extendedConfigPath = path.join(currentDir, extendedConfig);
    if (extendedConfig.indexOf("/") !== -1 && extendedConfig.indexOf(".") !== -1 && !fs.existsSync(extendedConfigPath)) {
      extendedConfigPath = path.join(currentDir, "node_modules", extendedConfig);
    }
    const base = loadTsconfig(extendedConfigPath) || {};

    // baseUrl should be interpreted as relative to the base tsconfig,
    // but we need to update it so it is relative to the original tsconfig being loaded
    if (base.compilerOptions && base.compilerOptions.baseUrl) {
      const extendsDir = path.dirname(extendedConfig);
      base.compilerOptions.baseUrl = path.join(extendsDir, base.compilerOptions.baseUrl);
    }
    config = mergeConfigs(config, base);
  }
  config = mergeConfigs(config, parsedConfig);
  // The only top-level property that is excluded from inheritance is "references".
  // https://www.typescriptlang.org/tsconfig#extends
  config.references = parsedConfig.references;
  if (path.basename(configFilePath) === 'jsconfig.json' && ((_config$compilerOptio2 = config.compilerOptions) === null || _config$compilerOptio2 === void 0 ? void 0 : _config$compilerOptio2.allowJs) === undefined) {
    config.compilerOptions = config.compilerOptions || {};
    config.compilerOptions.allowJs = true;
  }
  return config;
}
function mergeConfigs(base, override) {
  return {
    ...base,
    ...override,
    compilerOptions: {
      ...base.compilerOptions,
      ...override.compilerOptions
    }
  };
}
function StripBom(string) {
  if (typeof string !== 'string') {
    throw new TypeError(`Expected a string, got ${typeof string}`);
  }

  // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
  // conversion translates it to FEFF (UTF-16 BOM).
  if (string.charCodeAt(0) === 0xFEFF) {
    return string.slice(1);
  }
  return string;
}