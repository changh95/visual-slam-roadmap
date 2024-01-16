"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.baseFullConfig = exports.TeleTestCase = exports.TeleSuite = exports.TeleReporterReceiver = void 0;
exports.parseRegexPatterns = parseRegexPatterns;
exports.serializeRegexPatterns = serializeRegexPatterns;
var _stringInternPool = require("./stringInternPool");
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

class TeleReporterReceiver {
  constructor(pathSeparator, reporter, reuseTestCases, reportConfig) {
    this._rootSuite = void 0;
    this._pathSeparator = void 0;
    this._reporter = void 0;
    this._tests = new Map();
    this._rootDir = void 0;
    this._listOnly = false;
    this._clearPreviousResultsWhenTestBegins = false;
    this._reuseTestCases = void 0;
    this._reportConfig = void 0;
    this._config = void 0;
    this._stringPool = new _stringInternPool.StringInternPool();
    this._rootSuite = new TeleSuite('', 'root');
    this._pathSeparator = pathSeparator;
    this._reporter = reporter;
    this._reuseTestCases = reuseTestCases;
    this._reportConfig = reportConfig;
  }
  dispatch(message) {
    const {
      method,
      params
    } = message;
    if (method === 'onConfigure') {
      this._onConfigure(params.config);
      return;
    }
    if (method === 'onProject') {
      this._onProject(params.project);
      return;
    }
    if (method === 'onBegin') {
      this._onBegin();
      return;
    }
    if (method === 'onTestBegin') {
      this._onTestBegin(params.testId, params.result);
      return;
    }
    if (method === 'onTestEnd') {
      this._onTestEnd(params.test, params.result);
      return;
    }
    if (method === 'onStepBegin') {
      this._onStepBegin(params.testId, params.resultId, params.step);
      return;
    }
    if (method === 'onStepEnd') {
      this._onStepEnd(params.testId, params.resultId, params.step);
      return;
    }
    if (method === 'onError') {
      this._onError(params.error);
      return;
    }
    if (method === 'onStdIO') {
      this._onStdIO(params.type, params.testId, params.resultId, params.data, params.isBase64);
      return;
    }
    if (method === 'onEnd') return this._onEnd(params.result);
    if (method === 'onExit') return this._onExit();
  }
  _setClearPreviousResultsWhenTestBegins() {
    this._clearPreviousResultsWhenTestBegins = true;
  }
  _onConfigure(config) {
    var _this$_reporter$onCon, _this$_reporter;
    this._rootDir = config.rootDir;
    this._listOnly = config.listOnly;
    this._config = this._parseConfig(config);
    (_this$_reporter$onCon = (_this$_reporter = this._reporter).onConfigure) === null || _this$_reporter$onCon === void 0 ? void 0 : _this$_reporter$onCon.call(_this$_reporter, this._config);
  }
  _onProject(project) {
    let projectSuite = this._rootSuite.suites.find(suite => suite.project().__projectId === project.id);
    if (!projectSuite) {
      projectSuite = new TeleSuite(project.name, 'project');
      this._rootSuite.suites.push(projectSuite);
      projectSuite.parent = this._rootSuite;
    }
    const p = this._parseProject(project);
    projectSuite.project = () => p;
    this._mergeSuitesInto(project.suites, projectSuite);

    // Remove deleted tests when listing. Empty suites will be auto-filtered
    // in the UI layer.
    if (this._listOnly) {
      const testIds = new Set();
      const collectIds = suite => {
        suite.tests.map(t => t.testId).forEach(testId => testIds.add(testId));
        suite.suites.forEach(collectIds);
      };
      project.suites.forEach(collectIds);
      const filterTests = suite => {
        suite.tests = suite.tests.filter(t => testIds.has(t.id));
        suite.suites.forEach(filterTests);
      };
      filterTests(projectSuite);
    }
  }
  _onBegin() {
    var _this$_reporter$onBeg, _this$_reporter2;
    (_this$_reporter$onBeg = (_this$_reporter2 = this._reporter).onBegin) === null || _this$_reporter$onBeg === void 0 ? void 0 : _this$_reporter$onBeg.call(_this$_reporter2, this._rootSuite);
  }
  _onTestBegin(testId, payload) {
    var _this$_reporter$onTes, _this$_reporter3;
    const test = this._tests.get(testId);
    if (this._clearPreviousResultsWhenTestBegins) test._clearResults();
    const testResult = test._createTestResult(payload.id);
    testResult.retry = payload.retry;
    testResult.workerIndex = payload.workerIndex;
    testResult.parallelIndex = payload.parallelIndex;
    testResult.setStartTimeNumber(payload.startTime);
    testResult.statusEx = 'running';
    (_this$_reporter$onTes = (_this$_reporter3 = this._reporter).onTestBegin) === null || _this$_reporter$onTes === void 0 ? void 0 : _this$_reporter$onTes.call(_this$_reporter3, test, testResult);
  }
  _onTestEnd(testEndPayload, payload) {
    var _result$errors, _this$_reporter$onTes2, _this$_reporter4;
    const test = this._tests.get(testEndPayload.testId);
    test.timeout = testEndPayload.timeout;
    test.expectedStatus = testEndPayload.expectedStatus;
    test.annotations = testEndPayload.annotations;
    const result = test.resultsMap.get(payload.id);
    result.duration = payload.duration;
    result.status = payload.status;
    result.statusEx = payload.status;
    result.errors = payload.errors;
    result.error = (_result$errors = result.errors) === null || _result$errors === void 0 ? void 0 : _result$errors[0];
    result.attachments = this._parseAttachments(payload.attachments);
    (_this$_reporter$onTes2 = (_this$_reporter4 = this._reporter).onTestEnd) === null || _this$_reporter$onTes2 === void 0 ? void 0 : _this$_reporter$onTes2.call(_this$_reporter4, test, result);
    // Free up the memory as won't see these step ids.
    result.stepMap = new Map();
  }
  _onStepBegin(testId, resultId, payload) {
    var _this$_reporter$onSte, _this$_reporter5;
    const test = this._tests.get(testId);
    const result = test.resultsMap.get(resultId);
    const parentStep = payload.parentStepId ? result.stepMap.get(payload.parentStepId) : undefined;
    const location = this._absoluteLocation(payload.location);
    const step = new TeleTestStep(payload, parentStep, location);
    if (parentStep) parentStep.steps.push(step);else result.steps.push(step);
    result.stepMap.set(payload.id, step);
    (_this$_reporter$onSte = (_this$_reporter5 = this._reporter).onStepBegin) === null || _this$_reporter$onSte === void 0 ? void 0 : _this$_reporter$onSte.call(_this$_reporter5, test, result, step);
  }
  _onStepEnd(testId, resultId, payload) {
    var _this$_reporter$onSte2, _this$_reporter6;
    const test = this._tests.get(testId);
    const result = test.resultsMap.get(resultId);
    const step = result.stepMap.get(payload.id);
    step.duration = payload.duration;
    step.error = payload.error;
    (_this$_reporter$onSte2 = (_this$_reporter6 = this._reporter).onStepEnd) === null || _this$_reporter$onSte2 === void 0 ? void 0 : _this$_reporter$onSte2.call(_this$_reporter6, test, result, step);
  }
  _onError(error) {
    var _this$_reporter$onErr, _this$_reporter7;
    (_this$_reporter$onErr = (_this$_reporter7 = this._reporter).onError) === null || _this$_reporter$onErr === void 0 ? void 0 : _this$_reporter$onErr.call(_this$_reporter7, error);
  }
  _onStdIO(type, testId, resultId, data, isBase64) {
    const chunk = isBase64 ? globalThis.Buffer ? Buffer.from(data, 'base64') : atob(data) : data;
    const test = testId ? this._tests.get(testId) : undefined;
    const result = test && resultId ? test.resultsMap.get(resultId) : undefined;
    if (type === 'stdout') {
      var _this$_reporter$onStd, _this$_reporter8;
      result === null || result === void 0 ? void 0 : result.stdout.push(chunk);
      (_this$_reporter$onStd = (_this$_reporter8 = this._reporter).onStdOut) === null || _this$_reporter$onStd === void 0 ? void 0 : _this$_reporter$onStd.call(_this$_reporter8, chunk, test, result);
    } else {
      var _this$_reporter$onStd2, _this$_reporter9;
      result === null || result === void 0 ? void 0 : result.stderr.push(chunk);
      (_this$_reporter$onStd2 = (_this$_reporter9 = this._reporter).onStdErr) === null || _this$_reporter$onStd2 === void 0 ? void 0 : _this$_reporter$onStd2.call(_this$_reporter9, chunk, test, result);
    }
  }
  async _onEnd(result) {
    var _this$_reporter$onEnd, _this$_reporter10;
    await ((_this$_reporter$onEnd = (_this$_reporter10 = this._reporter).onEnd) === null || _this$_reporter$onEnd === void 0 ? void 0 : _this$_reporter$onEnd.call(_this$_reporter10, {
      status: result.status,
      startTime: new Date(result.startTime),
      duration: result.duration
    }));
  }
  _onExit() {
    var _this$_reporter$onExi, _this$_reporter11;
    // Free up the memory from the string pool.
    this._stringPool = new _stringInternPool.StringInternPool();
    return (_this$_reporter$onExi = (_this$_reporter11 = this._reporter).onExit) === null || _this$_reporter$onExi === void 0 ? void 0 : _this$_reporter$onExi.call(_this$_reporter11);
  }
  _parseConfig(config) {
    const result = {
      ...baseFullConfig,
      ...config
    };
    if (this._reportConfig) {
      result.configFile = this._reportConfig.configFile;
      result.reportSlowTests = this._reportConfig.reportSlowTests;
      result.quiet = this._reportConfig.quiet;
      result.reporter = [...this._reportConfig.reporter];
    }
    return result;
  }
  _parseProject(project) {
    return {
      __projectId: project.id,
      metadata: project.metadata,
      name: project.name,
      outputDir: this._absolutePath(project.outputDir),
      repeatEach: project.repeatEach,
      retries: project.retries,
      testDir: this._absolutePath(project.testDir),
      testIgnore: parseRegexPatterns(project.testIgnore),
      testMatch: parseRegexPatterns(project.testMatch),
      timeout: project.timeout,
      grep: parseRegexPatterns(project.grep),
      grepInvert: parseRegexPatterns(project.grepInvert),
      dependencies: project.dependencies,
      teardown: project.teardown,
      snapshotDir: this._absolutePath(project.snapshotDir),
      use: {}
    };
  }
  _parseAttachments(attachments) {
    return attachments.map(a => {
      return {
        ...a,
        body: a.base64 && globalThis.Buffer ? Buffer.from(a.base64, 'base64') : undefined
      };
    });
  }
  _mergeSuitesInto(jsonSuites, parent) {
    for (const jsonSuite of jsonSuites) {
      let targetSuite = parent.suites.find(s => s.title === jsonSuite.title);
      if (!targetSuite) {
        targetSuite = new TeleSuite(jsonSuite.title, jsonSuite.type);
        targetSuite.parent = parent;
        parent.suites.push(targetSuite);
      }
      targetSuite.location = this._absoluteLocation(jsonSuite.location);
      targetSuite._fileId = jsonSuite.fileId;
      targetSuite._parallelMode = jsonSuite.parallelMode;
      this._mergeSuitesInto(jsonSuite.suites, targetSuite);
      this._mergeTestsInto(jsonSuite.tests, targetSuite);
    }
  }
  _mergeTestsInto(jsonTests, parent) {
    for (const jsonTest of jsonTests) {
      let targetTest = this._reuseTestCases ? parent.tests.find(s => s.title === jsonTest.title) : undefined;
      if (!targetTest) {
        targetTest = new TeleTestCase(jsonTest.testId, jsonTest.title, this._absoluteLocation(jsonTest.location));
        targetTest.parent = parent;
        parent.tests.push(targetTest);
        this._tests.set(targetTest.id, targetTest);
      }
      this._updateTest(jsonTest, targetTest);
    }
  }
  _updateTest(payload, test) {
    test.id = payload.testId;
    test.location = this._absoluteLocation(payload.location);
    test.retries = payload.retries;
    return test;
  }
  _absoluteLocation(location) {
    if (!location) return location;
    return {
      ...location,
      file: this._absolutePath(location.file)
    };
  }
  _absolutePath(relativePath) {
    if (!relativePath) return relativePath;
    return this._stringPool.internString(this._rootDir + this._pathSeparator + relativePath);
  }
}
exports.TeleReporterReceiver = TeleReporterReceiver;
class TeleSuite {
  constructor(title, type) {
    this.title = void 0;
    this.location = void 0;
    this.parent = void 0;
    this._requireFile = '';
    this.suites = [];
    this.tests = [];
    this._timeout = void 0;
    this._retries = void 0;
    this._fileId = void 0;
    this._parallelMode = 'none';
    this._type = void 0;
    this.title = title;
    this._type = type;
  }
  allTests() {
    const result = [];
    const visit = suite => {
      for (const entry of [...suite.suites, ...suite.tests]) {
        if (entry instanceof TeleSuite) visit(entry);else result.push(entry);
      }
    };
    visit(this);
    return result;
  }
  titlePath() {
    const titlePath = this.parent ? this.parent.titlePath() : [];
    // Ignore anonymous describe blocks.
    if (this.title || this._type !== 'describe') titlePath.push(this.title);
    return titlePath;
  }
  project() {
    return undefined;
  }
}
exports.TeleSuite = TeleSuite;
class TeleTestCase {
  constructor(id, title, location) {
    this.title = void 0;
    this.fn = () => {};
    this.results = [];
    this.location = void 0;
    this.parent = void 0;
    this.expectedStatus = 'passed';
    this.timeout = 0;
    this.annotations = [];
    this.retries = 0;
    this.repeatEachIndex = 0;
    this.id = void 0;
    this.resultsMap = new Map();
    this.id = id;
    this.title = title;
    this.location = location;
  }
  titlePath() {
    const titlePath = this.parent ? this.parent.titlePath() : [];
    titlePath.push(this.title);
    return titlePath;
  }
  outcome() {
    // Ignore initial skips that may be a result of "skipped because previous test in serial mode failed".
    const results = [...this.results];
    while (((_results$ = results[0]) === null || _results$ === void 0 ? void 0 : _results$.status) === 'skipped' || ((_results$2 = results[0]) === null || _results$2 === void 0 ? void 0 : _results$2.status) === 'interrupted') {
      var _results$, _results$2;
      results.shift();
    }

    // All runs were skipped.
    if (!results.length) return 'skipped';
    const failures = results.filter(result => result.status !== 'skipped' && result.status !== 'interrupted' && result.status !== this.expectedStatus);
    if (!failures.length)
      // all passed
      return 'expected';
    if (failures.length === results.length)
      // all failed
      return 'unexpected';
    return 'flaky'; // mixed bag
  }

  ok() {
    const status = this.outcome();
    return status === 'expected' || status === 'flaky' || status === 'skipped';
  }
  _clearResults() {
    this.results = [];
    this.resultsMap.clear();
  }
  _createTestResult(id) {
    const result = new TeleTestResult(this.results.length);
    this.results.push(result);
    this.resultsMap.set(id, result);
    return result;
  }
}
exports.TeleTestCase = TeleTestCase;
class TeleTestStep {
  constructor(payload, parentStep, location) {
    this.title = void 0;
    this.category = void 0;
    this.location = void 0;
    this.parent = void 0;
    this.duration = -1;
    this.steps = [];
    this._startTime = 0;
    this.title = payload.title;
    this.category = payload.category;
    this.location = location;
    this.parent = parentStep;
    this._startTime = payload.startTime;
  }
  titlePath() {
    var _this$parent;
    const parentPath = ((_this$parent = this.parent) === null || _this$parent === void 0 ? void 0 : _this$parent.titlePath()) || [];
    return [...parentPath, this.title];
  }
  get startTime() {
    return new Date(this._startTime);
  }
  set startTime(value) {
    this._startTime = +value;
  }
}
class TeleTestResult {
  constructor(retry) {
    this.retry = void 0;
    this.parallelIndex = -1;
    this.workerIndex = -1;
    this.duration = -1;
    this.stdout = [];
    this.stderr = [];
    this.attachments = [];
    this.status = 'skipped';
    this.steps = [];
    this.errors = [];
    this.error = void 0;
    this.stepMap = new Map();
    this.statusEx = 'scheduled';
    this._startTime = 0;
    this.retry = retry;
  }
  setStartTimeNumber(startTime) {
    this._startTime = startTime;
  }
  get startTime() {
    return new Date(this._startTime);
  }
  set startTime(value) {
    this._startTime = +value;
  }
}
const baseFullConfig = exports.baseFullConfig = {
  forbidOnly: false,
  fullyParallel: false,
  globalSetup: null,
  globalTeardown: null,
  globalTimeout: 0,
  grep: /.*/,
  grepInvert: null,
  maxFailures: 0,
  metadata: {},
  preserveOutput: 'always',
  projects: [],
  reporter: [[process.env.CI ? 'dot' : 'list']],
  reportSlowTests: {
    max: 5,
    threshold: 15000
  },
  configFile: '',
  rootDir: '',
  quiet: false,
  shard: null,
  updateSnapshots: 'missing',
  version: '',
  workers: 0,
  webServer: null
};
function serializeRegexPatterns(patterns) {
  if (!Array.isArray(patterns)) patterns = [patterns];
  return patterns.map(s => {
    if (typeof s === 'string') return {
      s
    };
    return {
      r: {
        source: s.source,
        flags: s.flags
      }
    };
  });
}
function parseRegexPatterns(patterns) {
  return patterns.map(p => {
    if (p.s) return p.s;
    return new RegExp(p.r.source, p.r.flags);
  });
}