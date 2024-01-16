"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TeleReporterEmitter = void 0;
var _path = _interopRequireDefault(require("path"));
var _utils = require("playwright-core/lib/utils");
var _config = require("../common/config");
var _teleReceiver = require("../isomorphic/teleReceiver");
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

class TeleReporterEmitter {
  constructor(messageSink, skipBuffers) {
    this._messageSink = void 0;
    this._rootDir = void 0;
    this._skipBuffers = void 0;
    this._messageSink = messageSink;
    this._skipBuffers = skipBuffers;
  }
  version() {
    return 'v2';
  }
  onConfigure(config) {
    this._rootDir = config.rootDir;
    this._messageSink({
      method: 'onConfigure',
      params: {
        config: this._serializeConfig(config)
      }
    });
  }
  onBegin(suite) {
    const projects = suite.suites.map(projectSuite => this._serializeProject(projectSuite));
    for (const project of projects) this._messageSink({
      method: 'onProject',
      params: {
        project
      }
    });
    this._messageSink({
      method: 'onBegin',
      params: undefined
    });
  }
  onTestBegin(test, result) {
    result[idSymbol] = (0, _utils.createGuid)();
    this._messageSink({
      method: 'onTestBegin',
      params: {
        testId: test.id,
        result: this._serializeResultStart(result)
      }
    });
  }
  onTestEnd(test, result) {
    const testEnd = {
      testId: test.id,
      expectedStatus: test.expectedStatus,
      annotations: test.annotations,
      timeout: test.timeout
    };
    this._messageSink({
      method: 'onTestEnd',
      params: {
        test: testEnd,
        result: this._serializeResultEnd(result)
      }
    });
  }
  onStepBegin(test, result, step) {
    step[idSymbol] = (0, _utils.createGuid)();
    this._messageSink({
      method: 'onStepBegin',
      params: {
        testId: test.id,
        resultId: result[idSymbol],
        step: this._serializeStepStart(step)
      }
    });
  }
  onStepEnd(test, result, step) {
    this._messageSink({
      method: 'onStepEnd',
      params: {
        testId: test.id,
        resultId: result[idSymbol],
        step: this._serializeStepEnd(step)
      }
    });
  }
  onError(error) {
    this._messageSink({
      method: 'onError',
      params: {
        error
      }
    });
  }
  onStdOut(chunk, test, result) {
    this._onStdIO('stdout', chunk, test, result);
  }
  onStdErr(chunk, test, result) {
    this._onStdIO('stderr', chunk, test, result);
  }
  _onStdIO(type, chunk, test, result) {
    const isBase64 = typeof chunk !== 'string';
    const data = isBase64 ? chunk.toString('base64') : chunk;
    this._messageSink({
      method: 'onStdIO',
      params: {
        testId: test === null || test === void 0 ? void 0 : test.id,
        resultId: result ? result[idSymbol] : undefined,
        type,
        data,
        isBase64
      }
    });
  }
  async onEnd(result) {
    const resultPayload = {
      status: result.status,
      startTime: result.startTime.getTime(),
      duration: result.duration
    };
    this._messageSink({
      method: 'onEnd',
      params: {
        result: resultPayload
      }
    });
  }
  async onExit() {}
  printsToStdio() {
    return false;
  }
  _serializeConfig(config) {
    var _FullConfigInternal$f;
    return {
      configFile: this._relativePath(config.configFile),
      globalTimeout: config.globalTimeout,
      maxFailures: config.maxFailures,
      metadata: config.metadata,
      rootDir: config.rootDir,
      version: config.version,
      workers: config.workers,
      listOnly: !!((_FullConfigInternal$f = _config.FullConfigInternal.from(config)) !== null && _FullConfigInternal$f !== void 0 && _FullConfigInternal$f.cliListOnly)
    };
  }
  _serializeProject(suite) {
    const project = suite.project();
    const report = {
      id: (0, _config.getProjectId)(project),
      metadata: project.metadata,
      name: project.name,
      outputDir: this._relativePath(project.outputDir),
      repeatEach: project.repeatEach,
      retries: project.retries,
      testDir: this._relativePath(project.testDir),
      testIgnore: (0, _teleReceiver.serializeRegexPatterns)(project.testIgnore),
      testMatch: (0, _teleReceiver.serializeRegexPatterns)(project.testMatch),
      timeout: project.timeout,
      suites: suite.suites.map(fileSuite => {
        return this._serializeSuite(fileSuite);
      }),
      grep: (0, _teleReceiver.serializeRegexPatterns)(project.grep),
      grepInvert: (0, _teleReceiver.serializeRegexPatterns)(project.grepInvert || []),
      dependencies: project.dependencies,
      snapshotDir: this._relativePath(project.snapshotDir),
      teardown: project.teardown
    };
    return report;
  }
  _serializeSuite(suite) {
    const result = {
      type: suite._type,
      title: suite.title,
      fileId: suite._fileId,
      parallelMode: suite._parallelMode,
      location: this._relativeLocation(suite.location),
      suites: suite.suites.map(s => this._serializeSuite(s)),
      tests: suite.tests.map(t => this._serializeTest(t))
    };
    return result;
  }
  _serializeTest(test) {
    return {
      testId: test.id,
      title: test.title,
      location: this._relativeLocation(test.location),
      retries: test.retries
    };
  }
  _serializeResultStart(result) {
    return {
      id: result[idSymbol],
      retry: result.retry,
      workerIndex: result.workerIndex,
      parallelIndex: result.parallelIndex,
      startTime: +result.startTime
    };
  }
  _serializeResultEnd(result) {
    return {
      id: result[idSymbol],
      duration: result.duration,
      status: result.status,
      errors: result.errors,
      attachments: this._serializeAttachments(result.attachments)
    };
  }
  _serializeAttachments(attachments) {
    return attachments.map(a => {
      return {
        ...a,
        // There is no Buffer in the browser, so there is no point in sending the data there.
        base64: a.body && !this._skipBuffers ? a.body.toString('base64') : undefined
      };
    });
  }
  _serializeStepStart(step) {
    var _step$parent;
    return {
      id: step[idSymbol],
      parentStepId: (_step$parent = step.parent) === null || _step$parent === void 0 ? void 0 : _step$parent[idSymbol],
      title: step.title,
      category: step.category,
      startTime: +step.startTime,
      location: this._relativeLocation(step.location)
    };
  }
  _serializeStepEnd(step) {
    return {
      id: step[idSymbol],
      duration: step.duration,
      error: step.error
    };
  }
  _relativeLocation(location) {
    if (!location) return location;
    return {
      ...location,
      file: this._relativePath(location.file)
    };
  }
  _relativePath(absolutePath) {
    if (!absolutePath) return absolutePath;
    return _path.default.relative(this._rootDir, absolutePath);
  }
}
exports.TeleReporterEmitter = TeleReporterEmitter;
const idSymbol = Symbol('id');