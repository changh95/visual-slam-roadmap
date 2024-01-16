"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMergedReport = createMergedReport;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _teleReceiver = require("../isomorphic/teleReceiver");
var _stringInternPool = require("../isomorphic/stringInternPool");
var _reporters = require("../runner/reporters");
var _multiplexer = require("./multiplexer");
var _utils = require("playwright-core/lib/utils");
var _blob = require("./blob");
var _util = require("../util");
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

async function createMergedReport(config, dir, reporterDescriptions, rootDirOverride) {
  const reporters = await (0, _reporters.createReporters)(config, 'merge', reporterDescriptions);
  const multiplexer = new _multiplexer.Multiplexer(reporters);
  const receiver = new _teleReceiver.TeleReporterReceiver(_path.default.sep, multiplexer, false, config.config);
  const stringPool = new _stringInternPool.StringInternPool();
  let printStatus = () => {};
  if (!multiplexer.printsToStdio()) {
    printStatus = printStatusToStdout;
    printStatus(`merging reports from ${dir}`);
  }
  const shardFiles = await sortedShardFiles(dir);
  if (shardFiles.length === 0) throw new Error(`No report files found in ${dir}`);
  const eventData = await mergeEvents(dir, shardFiles, stringPool, printStatus, rootDirOverride);
  printStatus(`processing test events`);
  const dispatchEvents = async events => {
    for (const event of events) {
      if (event.method === 'onEnd') printStatus(`building final report`);
      await receiver.dispatch(event);
      if (event.method === 'onEnd') printStatus(`finished building report`);
    }
  };
  await dispatchEvents(eventData.prologue);
  for (const {
    reportFile,
    idsPatcher
  } of eventData.reports) {
    const reportJsonl = await _fs.default.promises.readFile(reportFile);
    const events = parseTestEvents(reportJsonl);
    new _stringInternPool.JsonStringInternalizer(stringPool).traverse(events);
    idsPatcher.patchEvents(events);
    patchAttachmentPaths(events, dir);
    await dispatchEvents(events);
  }
  await dispatchEvents(eventData.epilogue);
}
function patchAttachmentPaths(events, resourceDir) {
  for (const event of events) {
    if (event.method !== 'onTestEnd') continue;
    for (const attachment of event.params.result.attachments) {
      if (!attachment.path) continue;
      attachment.path = _path.default.join(resourceDir, attachment.path);
    }
  }
}
const commonEventNames = ['onBlobReportMetadata', 'onConfigure', 'onProject', 'onBegin', 'onEnd'];
const commonEvents = new Set(commonEventNames);
const commonEventRegex = new RegExp(`${commonEventNames.join('|')}`);
function parseCommonEvents(reportJsonl) {
  return splitBufferLines(reportJsonl).map(line => line.toString('utf8')).filter(line => commonEventRegex.test(line)) // quick filter
  .map(line => JSON.parse(line)).filter(event => commonEvents.has(event.method));
}
function parseTestEvents(reportJsonl) {
  return splitBufferLines(reportJsonl).map(line => line.toString('utf8')).filter(line => line.length).map(line => JSON.parse(line)).filter(event => !commonEvents.has(event.method));
}
function splitBufferLines(buffer) {
  const lines = [];
  let start = 0;
  while (start < buffer.length) {
    // 0x0A is the byte for '\n'
    const end = buffer.indexOf(0x0A, start);
    if (end === -1) {
      lines.push(buffer.slice(start));
      break;
    }
    lines.push(buffer.slice(start, end));
    start = end + 1;
  }
  return lines;
}
async function extractAndParseReports(dir, shardFiles, internalizer, printStatus) {
  const shardEvents = [];
  await _fs.default.promises.mkdir(_path.default.join(dir, 'resources'), {
    recursive: true
  });
  const reportNames = new UniqueFileNameGenerator();
  for (const file of shardFiles) {
    const absolutePath = _path.default.join(dir, file);
    printStatus(`extracting: ${(0, _util.relativeFilePath)(absolutePath)}`);
    const zipFile = new _utils.ZipFile(absolutePath);
    const entryNames = await zipFile.entries();
    for (const entryName of entryNames.sort()) {
      let fileName = _path.default.join(dir, entryName);
      const content = await zipFile.read(entryName);
      if (entryName.endsWith('.jsonl')) {
        fileName = reportNames.makeUnique(fileName);
        const parsedEvents = parseCommonEvents(content);
        // Passing reviver to JSON.parse doesn't work, as the original strings
        // keep beeing used. To work around that we traverse the parsed events
        // as a post-processing step.
        internalizer.traverse(parsedEvents);
        shardEvents.push({
          file,
          localPath: fileName,
          metadata: findMetadata(parsedEvents, file),
          parsedEvents
        });
      }
      await _fs.default.promises.writeFile(fileName, content);
    }
    zipFile.close();
  }
  return shardEvents;
}
function findMetadata(events, file) {
  var _events$;
  if (((_events$ = events[0]) === null || _events$ === void 0 ? void 0 : _events$.method) !== 'onBlobReportMetadata') throw new Error(`No metadata event found in ${file}`);
  const metadata = events[0].params;
  if (metadata.version > _blob.currentBlobReportVersion) throw new Error(`Blob report ${file} was created with a newer version of Playwright.`);
  return metadata;
}
async function mergeEvents(dir, shardReportFiles, stringPool, printStatus, rootDirOverride) {
  const internalizer = new _stringInternPool.JsonStringInternalizer(stringPool);
  const configureEvents = [];
  const projectEvents = [];
  const endEvents = [];
  const blobs = await extractAndParseReports(dir, shardReportFiles, internalizer, printStatus);
  // Sort by (report name; shard; file name), so that salt generation below is deterministic when:
  // - report names are unique;
  // - report names are missing;
  // - report names are clashing between shards.
  blobs.sort((a, b) => {
    var _a$metadata$name, _b$metadata$name, _a$metadata$shard$cur, _a$metadata$shard, _b$metadata$shard$cur, _b$metadata$shard;
    const nameA = (_a$metadata$name = a.metadata.name) !== null && _a$metadata$name !== void 0 ? _a$metadata$name : '';
    const nameB = (_b$metadata$name = b.metadata.name) !== null && _b$metadata$name !== void 0 ? _b$metadata$name : '';
    if (nameA !== nameB) return nameA.localeCompare(nameB);
    const shardA = (_a$metadata$shard$cur = (_a$metadata$shard = a.metadata.shard) === null || _a$metadata$shard === void 0 ? void 0 : _a$metadata$shard.current) !== null && _a$metadata$shard$cur !== void 0 ? _a$metadata$shard$cur : 0;
    const shardB = (_b$metadata$shard$cur = (_b$metadata$shard = b.metadata.shard) === null || _b$metadata$shard === void 0 ? void 0 : _b$metadata$shard.current) !== null && _b$metadata$shard$cur !== void 0 ? _b$metadata$shard$cur : 0;
    if (shardA !== shardB) return shardA - shardB;
    return a.file.localeCompare(b.file);
  });
  const saltSet = new Set();
  printStatus(`merging events`);
  const reports = [];
  for (const {
    file,
    parsedEvents,
    metadata,
    localPath
  } of blobs) {
    // Generate unique salt for each blob.
    const sha1 = (0, _utils.calculateSha1)(metadata.name || _path.default.basename(file)).substring(0, 16);
    let salt = sha1;
    for (let i = 0; saltSet.has(salt); i++) salt = sha1 + '-' + i;
    saltSet.add(salt);
    const idsPatcher = new IdsPatcher(stringPool, metadata.name, salt);
    idsPatcher.patchEvents(parsedEvents);
    for (const event of parsedEvents) {
      if (event.method === 'onConfigure') configureEvents.push(event);else if (event.method === 'onProject') projectEvents.push(event);else if (event.method === 'onEnd') endEvents.push(event);
    }

    // Save information about the reports to stream their test events later.
    reports.push({
      idsPatcher,
      reportFile: localPath
    });
  }
  return {
    prologue: [mergeConfigureEvents(configureEvents, rootDirOverride), ...projectEvents, {
      method: 'onBegin',
      params: undefined
    }],
    reports,
    epilogue: [mergeEndEvents(endEvents), {
      method: 'onExit',
      params: undefined
    }]
  };
}
function mergeConfigureEvents(configureEvents, rootDirOverride) {
  if (!configureEvents.length) throw new Error('No configure events found');
  let config = {
    configFile: undefined,
    globalTimeout: 0,
    maxFailures: 0,
    metadata: {},
    rootDir: '',
    version: '',
    workers: 0,
    listOnly: false
  };
  for (const event of configureEvents) config = mergeConfigs(config, event.params.config);
  if (rootDirOverride) {
    config.rootDir = rootDirOverride;
  } else {
    const rootDirs = new Set(configureEvents.map(e => e.params.config.rootDir));
    if (rootDirs.size > 1) {
      throw new Error([`Blob reports being merged were recorded with different test directories, and`, `merging cannot proceed. This may happen if you are merging reports from`, `machines with different environments, like different operating systems or`, `if the tests ran with different playwright configs.`, ``, `You can force merge by specifying a merge config file with "-c" option. If`, `you'd like all test paths to be correct, make sure 'testDir' in the merge config`, `file points to the actual tests location.`, ``, `Found directories:`, ...rootDirs].join('\n'));
    }
  }
  return {
    method: 'onConfigure',
    params: {
      config
    }
  };
}
function mergeConfigs(to, from) {
  return {
    ...to,
    ...from,
    metadata: {
      ...to.metadata,
      ...from.metadata,
      actualWorkers: (to.metadata.actualWorkers || 0) + (from.metadata.actualWorkers || 0)
    },
    workers: to.workers + from.workers
  };
}
function mergeEndEvents(endEvents) {
  let startTime = endEvents.length ? 10000000000000 : Date.now();
  let status = 'passed';
  let duration = 0;
  for (const event of endEvents) {
    const shardResult = event.params.result;
    if (shardResult.status === 'failed') status = 'failed';else if (shardResult.status === 'timedout' && status !== 'failed') status = 'timedout';else if (shardResult.status === 'interrupted' && status !== 'failed' && status !== 'timedout') status = 'interrupted';
    startTime = Math.min(startTime, shardResult.startTime);
    duration = Math.max(duration, shardResult.duration);
  }
  const result = {
    status,
    startTime,
    duration
  };
  return {
    method: 'onEnd',
    params: {
      result
    }
  };
}
async function sortedShardFiles(dir) {
  const files = await _fs.default.promises.readdir(dir);
  return files.filter(file => file.startsWith('report') && file.endsWith('.zip')).sort();
}
function printStatusToStdout(message) {
  process.stdout.write(`${message}\n`);
}
class UniqueFileNameGenerator {
  constructor() {
    this._usedNames = new Set();
  }
  makeUnique(name) {
    if (!this._usedNames.has(name)) {
      this._usedNames.add(name);
      return name;
    }
    const extension = _path.default.extname(name);
    name = name.substring(0, name.length - extension.length);
    let index = 0;
    while (true) {
      const candidate = `${name}-${++index}${extension}`;
      if (!this._usedNames.has(candidate)) {
        this._usedNames.add(candidate);
        return candidate;
      }
    }
  }
}
class IdsPatcher {
  constructor(_stringPool, _reportName, _salt) {
    this._stringPool = _stringPool;
    this._reportName = _reportName;
    this._salt = _salt;
  }
  patchEvents(events) {
    for (const event of events) {
      const {
        method,
        params
      } = event;
      switch (method) {
        case 'onProject':
          this._onProject(params.project);
          continue;
        case 'onTestBegin':
        case 'onStepBegin':
        case 'onStepEnd':
        case 'onStdIO':
          params.testId = this._mapTestId(params.testId);
          continue;
        case 'onTestEnd':
          params.test.testId = this._mapTestId(params.test.testId);
          continue;
      }
    }
  }
  _onProject(project) {
    var _project$metadata;
    project.metadata = (_project$metadata = project.metadata) !== null && _project$metadata !== void 0 ? _project$metadata : {};
    project.metadata.reportName = this._reportName;
    project.id = this._stringPool.internString(project.id + this._salt);
    project.suites.forEach(suite => this._updateTestIds(suite));
  }
  _updateTestIds(suite) {
    suite.tests.forEach(test => test.testId = this._mapTestId(test.testId));
    suite.suites.forEach(suite => this._updateTestIds(suite));
  }
  _mapTestId(testId) {
    return this._stringPool.internString(testId + this._salt);
  }
}