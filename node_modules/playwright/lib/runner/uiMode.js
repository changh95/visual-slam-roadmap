"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runUIMode = runUIMode;
var _server = require("playwright-core/lib/server");
var _utils = require("playwright-core/lib/utils");
var _compilationCache = require("../transform/compilationCache");
var _internalReporter = require("../reporters/internalReporter");
var _teleEmitter = require("../reporters/teleEmitter");
var _reporters = require("./reporters");
var _tasks = require("./tasks");
var _utilsBundle = require("../utilsBundle");
var _utilsBundle2 = require("playwright-core/lib/utilsBundle");
var _list = _interopRequireDefault(require("../reporters/list"));
var _multiplexer = require("../reporters/multiplexer");
var _sigIntWatcher = require("./sigIntWatcher");
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

class UIMode {
  constructor(config) {
    this._config = void 0;
    this._transport = void 0;
    this._testRun = void 0;
    this.globalCleanup = void 0;
    this._globalWatcher = void 0;
    this._testWatcher = void 0;
    this._originalStdoutWrite = void 0;
    this._originalStderrWrite = void 0;
    this._config = config;
    process.env.PW_LIVE_TRACE_STACKS = '1';
    config.cliListOnly = false;
    config.cliPassWithNoTests = true;
    config.config.preserveOutput = 'always';
    for (const p of config.projects) {
      p.project.retries = 0;
      p.project.repeatEach = 1;
    }
    config.configCLIOverrides.use = config.configCLIOverrides.use || {};
    config.configCLIOverrides.use.trace = {
      mode: 'on',
      sources: false,
      _live: true
    };
    this._originalStdoutWrite = process.stdout.write;
    this._originalStderrWrite = process.stderr.write;
    this._globalWatcher = new Watcher('deep', () => this._dispatchEvent('listChanged', {}));
    this._testWatcher = new Watcher('flat', events => {
      const collector = new Set();
      events.forEach(f => (0, _compilationCache.collectAffectedTestFiles)(f.file, collector));
      this._dispatchEvent('testFilesChanged', {
        testFileNames: [...collector]
      });
    });
  }
  async runGlobalSetup() {
    const reporter = new _internalReporter.InternalReporter(new _list.default());
    const taskRunner = (0, _tasks.createTaskRunnerForWatchSetup)(this._config, reporter);
    reporter.onConfigure(this._config.config);
    const testRun = new _tasks.TestRun(this._config, reporter);
    const {
      status,
      cleanup: globalCleanup
    } = await taskRunner.runDeferCleanup(testRun, 0);
    await reporter.onEnd({
      status
    });
    await reporter.onExit();
    if (status !== 'passed') {
      await globalCleanup();
      return status;
    }
    this.globalCleanup = globalCleanup;
    return status;
  }
  async showUI(options, cancelPromise) {
    let queue = Promise.resolve();
    this._transport = {
      dispatch: async (method, params) => {
        if (method === 'ping') return;
        if (method === 'watch') {
          this._watchFiles(params.fileNames);
          return;
        }
        if (method === 'open' && params.location) {
          (0, _utilsBundle2.open)('vscode://file/' + params.location).catch(e => this._originalStderrWrite.call(process.stderr, String(e)));
          return;
        }
        if (method === 'resizeTerminal') {
          process.stdout.columns = params.cols;
          process.stdout.rows = params.rows;
          process.stderr.columns = params.cols;
          process.stderr.columns = params.rows;
          return;
        }
        if (method === 'stop') {
          void this._stopTests();
          return;
        }
        if (method === 'checkBrowsers') return {
          hasBrowsers: hasSomeBrowsers()
        };
        if (method === 'installBrowsers') {
          await installBrowsers();
          return;
        }
        queue = queue.then(() => this._queueListOrRun(method, params));
        await queue;
      },
      onclose: () => {}
    };
    const openOptions = {
      app: 'uiMode.html',
      headless: (0, _utils.isUnderTest)() && process.env.PWTEST_HEADED_FOR_TEST !== '1',
      transport: this._transport,
      host: options.host,
      port: options.port,
      persistentContextOptions: {
        handleSIGINT: false
      }
    };
    if (options.host !== undefined || options.port !== undefined) {
      await (0, _server.openTraceInBrowser)([], openOptions);
    } else {
      const page = await (0, _server.openTraceViewerApp)([], 'chromium', openOptions);
      page.on('close', () => cancelPromise.resolve());
    }
    if (!process.env.PWTEST_DEBUG) {
      process.stdout.write = chunk => {
        this._dispatchEvent('stdio', chunkToPayload('stdout', chunk));
        return true;
      };
      process.stderr.write = chunk => {
        this._dispatchEvent('stdio', chunkToPayload('stderr', chunk));
        return true;
      };
    }
    await cancelPromise;
    if (!process.env.PWTEST_DEBUG) {
      process.stdout.write = this._originalStdoutWrite;
      process.stderr.write = this._originalStderrWrite;
    }
  }
  async _queueListOrRun(method, params) {
    if (method === 'list') await this._listTests();
    if (method === 'run') await this._runTests(params.testIds, params.projects);
  }
  _dispatchEvent(method, params) {
    var _this$_transport$send, _this$_transport;
    (_this$_transport$send = (_this$_transport = this._transport).sendEvent) === null || _this$_transport$send === void 0 ? void 0 : _this$_transport$send.call(_this$_transport, method, params);
  }
  async _listTests() {
    const reporter = new _internalReporter.InternalReporter(new _teleEmitter.TeleReporterEmitter(e => this._dispatchEvent(e.method, e.params), true));
    this._config.cliListOnly = true;
    this._config.testIdMatcher = undefined;
    const taskRunner = (0, _tasks.createTaskRunnerForList)(this._config, reporter, 'out-of-process', {
      failOnLoadErrors: false
    });
    const testRun = new _tasks.TestRun(this._config, reporter);
    (0, _compilationCache.clearCompilationCache)();
    reporter.onConfigure(this._config.config);
    const status = await taskRunner.run(testRun, 0);
    await reporter.onEnd({
      status
    });
    await reporter.onExit();
    const projectDirs = new Set();
    const projectOutputs = new Set();
    for (const p of this._config.projects) {
      projectDirs.add(p.project.testDir);
      projectOutputs.add(p.project.outputDir);
    }
    this._globalWatcher.update([...projectDirs], [...projectOutputs], false);
  }
  async _runTests(testIds, projects) {
    await this._stopTests();
    const testIdSet = testIds ? new Set(testIds) : null;
    this._config.cliListOnly = false;
    this._config.cliProjectFilter = projects.length ? projects : undefined;
    this._config.testIdMatcher = id => !testIdSet || testIdSet.has(id);
    const reporters = await (0, _reporters.createReporters)(this._config, 'ui');
    reporters.push(new _teleEmitter.TeleReporterEmitter(e => this._dispatchEvent(e.method, e.params), true));
    const reporter = new _internalReporter.InternalReporter(new _multiplexer.Multiplexer(reporters));
    const taskRunner = (0, _tasks.createTaskRunnerForWatch)(this._config, reporter);
    const testRun = new _tasks.TestRun(this._config, reporter);
    (0, _compilationCache.clearCompilationCache)();
    reporter.onConfigure(this._config.config);
    const stop = new _utils.ManualPromise();
    const run = taskRunner.run(testRun, 0, stop).then(async status => {
      await reporter.onEnd({
        status
      });
      await reporter.onExit();
      this._testRun = undefined;
      this._config.testIdMatcher = undefined;
      return status;
    });
    this._testRun = {
      run,
      stop
    };
    await run;
  }
  _watchFiles(fileNames) {
    const files = new Set();
    for (const fileName of fileNames) {
      files.add(fileName);
      (0, _compilationCache.dependenciesForTestFile)(fileName).forEach(file => files.add(file));
    }
    this._testWatcher.update([...files], [], true);
  }
  async _stopTests() {
    var _this$_testRun, _this$_testRun$stop, _this$_testRun2;
    (_this$_testRun = this._testRun) === null || _this$_testRun === void 0 ? void 0 : (_this$_testRun$stop = _this$_testRun.stop) === null || _this$_testRun$stop === void 0 ? void 0 : _this$_testRun$stop.resolve();
    await ((_this$_testRun2 = this._testRun) === null || _this$_testRun2 === void 0 ? void 0 : _this$_testRun2.run);
  }
}
async function runUIMode(config, options) {
  var _uiMode$globalCleanup;
  const uiMode = new UIMode(config);
  const globalSetupStatus = await uiMode.runGlobalSetup();
  if (globalSetupStatus !== 'passed') return globalSetupStatus;
  const cancelPromise = new _utils.ManualPromise();
  const sigintWatcher = new _sigIntWatcher.SigIntWatcher();
  void sigintWatcher.promise().then(() => cancelPromise.resolve());
  try {
    await uiMode.showUI(options, cancelPromise);
  } finally {
    sigintWatcher.disarm();
  }
  return (await ((_uiMode$globalCleanup = uiMode.globalCleanup) === null || _uiMode$globalCleanup === void 0 ? void 0 : _uiMode$globalCleanup.call(uiMode))) || (sigintWatcher.hadSignal() ? 'interrupted' : 'passed');
}
function chunkToPayload(type, chunk) {
  if (chunk instanceof Buffer) return {
    type,
    buffer: chunk.toString('base64')
  };
  return {
    type,
    text: chunk
  };
}
class Watcher {
  constructor(mode, onChange) {
    this._onChange = void 0;
    this._watchedFiles = [];
    this._ignoredFolders = [];
    this._collector = [];
    this._fsWatcher = void 0;
    this._throttleTimer = void 0;
    this._mode = void 0;
    this._mode = mode;
    this._onChange = onChange;
  }
  update(watchedFiles, ignoredFolders, reportPending) {
    var _this$_fsWatcher;
    if (JSON.stringify([this._watchedFiles, this._ignoredFolders]) === JSON.stringify(watchedFiles, ignoredFolders)) return;
    if (reportPending) this._reportEventsIfAny();
    this._watchedFiles = watchedFiles;
    this._ignoredFolders = ignoredFolders;
    void ((_this$_fsWatcher = this._fsWatcher) === null || _this$_fsWatcher === void 0 ? void 0 : _this$_fsWatcher.close());
    this._fsWatcher = undefined;
    this._collector.length = 0;
    clearTimeout(this._throttleTimer);
    this._throttleTimer = undefined;
    if (!this._watchedFiles.length) return;
    this._fsWatcher = _utilsBundle.chokidar.watch(watchedFiles, {
      ignoreInitial: true,
      ignored: this._ignoredFolders
    }).on('all', async (event, file) => {
      if (this._throttleTimer) clearTimeout(this._throttleTimer);
      if (this._mode === 'flat' && event !== 'add' && event !== 'change') return;
      if (this._mode === 'deep' && event !== 'add' && event !== 'change' && event !== 'unlink' && event !== 'addDir' && event !== 'unlinkDir') return;
      this._collector.push({
        event,
        file
      });
      this._throttleTimer = setTimeout(() => this._reportEventsIfAny(), 250);
    });
  }
  _reportEventsIfAny() {
    if (this._collector.length) this._onChange(this._collector.slice());
    this._collector.length = 0;
  }
}
function hasSomeBrowsers() {
  for (const browserName of ['chromium', 'webkit', 'firefox']) {
    try {
      _server.registry.findExecutable(browserName).executablePathOrDie('javascript');
      return true;
    } catch {}
  }
  return false;
}
async function installBrowsers() {
  const executables = _server.registry.defaultExecutables();
  await _server.registry.install(executables, false);
}