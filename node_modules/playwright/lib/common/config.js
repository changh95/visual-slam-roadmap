"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defaultTimeout = exports.defaultReporter = exports.defaultGrep = exports.builtInReporters = exports.FullProjectInternal = exports.FullConfigInternal = void 0;
exports.getProjectId = getProjectId;
exports.takeFirst = takeFirst;
exports.toReporters = toReporters;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _os = _interopRequireDefault(require("os"));
var _util = require("../util");
var _transform = require("../transform/transform");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright Microsoft Corporation. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const defaultTimeout = exports.defaultTimeout = 30000;
class FullConfigInternal {
  // TODO: when merging reports, there could be no internal config. This is very unfortunate.
  static from(config) {
    return config[configInternalSymbol];
  }
  constructor(configDir, configFile, config, configCLIOverrides) {
    var _build, _config$build;
    this.config = void 0;
    this.globalOutputDir = void 0;
    this.configDir = void 0;
    this.configCLIOverrides = void 0;
    this.storeDir = void 0;
    this.ignoreSnapshots = void 0;
    this.webServers = void 0;
    this.plugins = void 0;
    this.projects = [];
    this.cliArgs = [];
    this.cliGrep = void 0;
    this.cliGrepInvert = void 0;
    this.cliProjectFilter = void 0;
    this.cliListOnly = false;
    this.cliPassWithNoTests = void 0;
    this.testIdMatcher = void 0;
    this.defineConfigWasUsed = false;
    if (configCLIOverrides.projects && config.projects) throw new Error(`Cannot use --browser option when configuration file defines projects. Specify browserName in the projects instead.`);
    const packageJsonPath = (0, _util.getPackageJsonPath)(configDir);
    const packageJsonDir = packageJsonPath ? _path.default.dirname(packageJsonPath) : undefined;
    const throwawayArtifactsPath = packageJsonDir || process.cwd();
    this.configDir = configDir;
    this.configCLIOverrides = configCLIOverrides;
    this.storeDir = _path.default.resolve(configDir, config._storeDir || 'playwright');
    this.globalOutputDir = takeFirst(configCLIOverrides.outputDir, pathResolve(configDir, config.outputDir), throwawayArtifactsPath, _path.default.resolve(process.cwd()));
    this.ignoreSnapshots = takeFirst(configCLIOverrides.ignoreSnapshots, config.ignoreSnapshots, false);
    this.plugins = (config._plugins || []).map(p => ({
      factory: p
    }));
    this.config = {
      configFile,
      rootDir: pathResolve(configDir, config.testDir) || configDir,
      forbidOnly: takeFirst(configCLIOverrides.forbidOnly, config.forbidOnly, false),
      fullyParallel: takeFirst(configCLIOverrides.fullyParallel, config.fullyParallel, false),
      globalSetup: takeFirst(resolveScript(config.globalSetup, configDir), null),
      globalTeardown: takeFirst(resolveScript(config.globalTeardown, configDir), null),
      globalTimeout: takeFirst(configCLIOverrides.globalTimeout, config.globalTimeout, 0),
      grep: takeFirst(config.grep, defaultGrep),
      grepInvert: takeFirst(config.grepInvert, null),
      maxFailures: takeFirst(configCLIOverrides.maxFailures, config.maxFailures, 0),
      metadata: takeFirst(config.metadata, {}),
      preserveOutput: takeFirst(config.preserveOutput, 'always'),
      reporter: takeFirst(configCLIOverrides.reporter, resolveReporters(config.reporter, configDir), [[defaultReporter]]),
      reportSlowTests: takeFirst(config.reportSlowTests, {
        max: 5,
        threshold: 15000
      }),
      quiet: takeFirst(configCLIOverrides.quiet, config.quiet, false),
      projects: [],
      shard: takeFirst(configCLIOverrides.shard, config.shard, null),
      updateSnapshots: takeFirst(configCLIOverrides.updateSnapshots, config.updateSnapshots, 'missing'),
      version: require('../../package.json').version,
      workers: 0,
      webServer: null
    };
    this.config[configInternalSymbol] = this;
    const workers = takeFirst(configCLIOverrides.workers, config.workers, '50%');
    if (typeof workers === 'string') {
      if (workers.endsWith('%')) {
        const cpus = _os.default.cpus().length;
        this.config.workers = Math.max(1, Math.floor(cpus * (parseInt(workers, 10) / 100)));
      } else {
        this.config.workers = parseInt(workers, 10);
      }
    } else {
      this.config.workers = workers;
    }
    const webServers = takeFirst(config.webServer, null);
    if (Array.isArray(webServers)) {
      // multiple web server mode
      // Due to previous choices, this value shows up to the user in globalSetup as part of FullConfig. Arrays are not supported by the old type.
      this.config.webServer = null;
      this.webServers = webServers;
    } else if (webServers) {
      // legacy singleton mode
      this.config.webServer = webServers;
      this.webServers = [webServers];
    } else {
      this.webServers = [];
    }
    const projectConfigs = configCLIOverrides.projects || config.projects || [config];
    this.projects = projectConfigs.map(p => new FullProjectInternal(configDir, config, this, p, this.configCLIOverrides, throwawayArtifactsPath));
    resolveProjectDependencies(this.projects);
    this._assignUniqueProjectIds(this.projects);
    (0, _transform.setTransformConfig)({
      babelPlugins: ((_build = config.build) === null || _build === void 0 ? void 0 : _build.babelPlugins) || [],
      external: ((_config$build = config.build) === null || _config$build === void 0 ? void 0 : _config$build.external) || []
    });
    this.config.projects = this.projects.map(p => p.project);
  }
  _assignUniqueProjectIds(projects) {
    const usedNames = new Set();
    for (const p of projects) {
      const name = p.project.name || '';
      for (let i = 0; i < projects.length; ++i) {
        const candidate = name + (i ? i : '');
        if (usedNames.has(candidate)) continue;
        p.id = candidate;
        p.project.__projectId = p.id;
        usedNames.add(candidate);
        break;
      }
    }
  }
}
exports.FullConfigInternal = FullConfigInternal;
class FullProjectInternal {
  constructor(configDir, config, fullConfig, projectConfig, configCLIOverrides, throwawayArtifactsPath) {
    this.project = void 0;
    this.fullConfig = void 0;
    this.fullyParallel = void 0;
    this.expect = void 0;
    this.respectGitIgnore = void 0;
    this.snapshotPathTemplate = void 0;
    this.id = '';
    this.deps = [];
    this.teardown = void 0;
    this.fullConfig = fullConfig;
    const testDir = takeFirst(pathResolve(configDir, projectConfig.testDir), pathResolve(configDir, config.testDir), fullConfig.configDir);
    const defaultSnapshotPathTemplate = '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{-snapshotSuffix}{ext}';
    this.snapshotPathTemplate = takeFirst(projectConfig.snapshotPathTemplate, config.snapshotPathTemplate, defaultSnapshotPathTemplate);
    this.project = {
      grep: takeFirst(projectConfig.grep, config.grep, defaultGrep),
      grepInvert: takeFirst(projectConfig.grepInvert, config.grepInvert, null),
      outputDir: takeFirst(configCLIOverrides.outputDir, pathResolve(configDir, projectConfig.outputDir), pathResolve(configDir, config.outputDir), _path.default.join(throwawayArtifactsPath, 'test-results')),
      // Note: we either apply the cli override for repeatEach or not, depending on whether the
      // project is top-level vs dependency. See collectProjectsAndTestFiles in loadUtils.
      repeatEach: takeFirst(projectConfig.repeatEach, config.repeatEach, 1),
      retries: takeFirst(configCLIOverrides.retries, projectConfig.retries, config.retries, 0),
      metadata: takeFirst(projectConfig.metadata, config.metadata, undefined),
      name: takeFirst(projectConfig.name, config.name, ''),
      testDir,
      snapshotDir: takeFirst(pathResolve(configDir, projectConfig.snapshotDir), pathResolve(configDir, config.snapshotDir), testDir),
      testIgnore: takeFirst(projectConfig.testIgnore, config.testIgnore, []),
      testMatch: takeFirst(projectConfig.testMatch, config.testMatch, '**/*.@(spec|test).?(c|m)[jt]s?(x)'),
      timeout: takeFirst(configCLIOverrides.timeout, projectConfig.timeout, config.timeout, defaultTimeout),
      use: (0, _util.mergeObjects)(config.use, projectConfig.use, configCLIOverrides.use),
      dependencies: projectConfig.dependencies || [],
      teardown: projectConfig.teardown
    };
    this.fullyParallel = takeFirst(configCLIOverrides.fullyParallel, projectConfig.fullyParallel, config.fullyParallel, undefined);
    this.expect = takeFirst(projectConfig.expect, config.expect, {});
    this.respectGitIgnore = !projectConfig.testDir && !config.testDir;
  }
}
exports.FullProjectInternal = FullProjectInternal;
function takeFirst(...args) {
  for (const arg of args) {
    if (arg !== undefined) return arg;
  }
  return undefined;
}
function pathResolve(baseDir, relative) {
  if (!relative) return undefined;
  return _path.default.resolve(baseDir, relative);
}
function resolveReporters(reporters, rootDir) {
  var _toReporters;
  return (_toReporters = toReporters(reporters)) === null || _toReporters === void 0 ? void 0 : _toReporters.map(([id, arg]) => {
    if (builtInReporters.includes(id)) return [id, arg];
    return [require.resolve(id, {
      paths: [rootDir]
    }), arg];
  });
}
function resolveProjectDependencies(projects) {
  const teardownSet = new Set();
  for (const project of projects) {
    for (const dependencyName of project.project.dependencies) {
      const dependencies = projects.filter(p => p.project.name === dependencyName);
      if (!dependencies.length) throw new Error(`Project '${project.project.name}' depends on unknown project '${dependencyName}'`);
      if (dependencies.length > 1) throw new Error(`Project dependencies should have unique names, reading ${dependencyName}`);
      project.deps.push(...dependencies);
    }
    if (project.project.teardown) {
      const teardowns = projects.filter(p => p.project.name === project.project.teardown);
      if (!teardowns.length) throw new Error(`Project '${project.project.name}' has unknown teardown project '${project.project.teardown}'`);
      if (teardowns.length > 1) throw new Error(`Project teardowns should have unique names, reading ${project.project.teardown}`);
      const teardown = teardowns[0];
      project.teardown = teardown;
      teardownSet.add(teardown);
    }
  }
  for (const teardown of teardownSet) {
    if (teardown.deps.length) throw new Error(`Teardown project ${teardown.project.name} must not have dependencies`);
  }
  for (const project of projects) {
    for (const dep of project.deps) {
      if (teardownSet.has(dep)) throw new Error(`Project ${project.project.name} must not depend on a teardown project ${dep.project.name}`);
    }
  }
}
function toReporters(reporters) {
  if (!reporters) return;
  if (typeof reporters === 'string') return [[reporters]];
  return reporters;
}
const builtInReporters = exports.builtInReporters = ['list', 'line', 'dot', 'json', 'junit', 'null', 'github', 'html', 'blob', 'markdown'];
function resolveScript(id, rootDir) {
  if (!id) return undefined;
  const localPath = _path.default.resolve(rootDir, id);
  if (_fs.default.existsSync(localPath)) return localPath;
  return require.resolve(id, {
    paths: [rootDir]
  });
}
const defaultGrep = exports.defaultGrep = /.*/;
const defaultReporter = exports.defaultReporter = process.env.CI ? 'dot' : 'list';
const configInternalSymbol = Symbol('configInternalSymbol');
function getProjectId(project) {
  return project.__projectId;
}