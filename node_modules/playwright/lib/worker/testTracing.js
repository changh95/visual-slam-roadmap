"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TestTracing = void 0;
exports.mergeTraceFiles = mergeTraceFiles;
exports.testTraceEntryName = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _utils = require("playwright-core/lib/utils");
var _zipBundle = require("playwright-core/lib/zipBundle");
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

const testTraceEntryName = exports.testTraceEntryName = 'test.trace';
class TestTracing {
  constructor() {
    this._liveTraceFile = void 0;
    this._traceEvents = [];
    this._options = void 0;
  }
  start(liveFileName, options) {
    this._options = options;
    if (!this._liveTraceFile && options._live) {
      this._liveTraceFile = liveFileName;
      _fs.default.mkdirSync(_path.default.dirname(this._liveTraceFile), {
        recursive: true
      });
      const data = this._traceEvents.map(e => JSON.stringify(e)).join('\n') + '\n';
      _fs.default.writeFileSync(this._liveTraceFile, data);
    }
  }
  async stop(fileName) {
    var _this$_options, _this$_options2;
    const zipFile = new _zipBundle.yazl.ZipFile();
    if (!((_this$_options = this._options) !== null && _this$_options !== void 0 && _this$_options.attachments)) {
      for (const event of this._traceEvents) {
        if (event.type === 'after') delete event.attachments;
      }
    }
    if ((_this$_options2 = this._options) !== null && _this$_options2 !== void 0 && _this$_options2.sources) {
      const sourceFiles = new Set();
      for (const event of this._traceEvents) {
        if (event.type === 'before') {
          for (const frame of event.stack || []) sourceFiles.add(frame.file);
        }
      }
      for (const sourceFile of sourceFiles) {
        await _fs.default.promises.readFile(sourceFile, 'utf8').then(source => {
          zipFile.addBuffer(Buffer.from(source), 'resources/src@' + (0, _utils.calculateSha1)(sourceFile) + '.txt');
        }).catch(() => {});
      }
    }
    const sha1s = new Set();
    for (const event of this._traceEvents.filter(e => e.type === 'after')) {
      for (const attachment of event.attachments || []) {
        let contentPromise;
        if (attachment.path) contentPromise = _fs.default.promises.readFile(attachment.path).catch(() => undefined);else if (attachment.base64) contentPromise = Promise.resolve(Buffer.from(attachment.base64, 'base64'));
        const content = await contentPromise;
        if (content === undefined) continue;
        const sha1 = (0, _utils.calculateSha1)(content);
        attachment.sha1 = sha1;
        delete attachment.path;
        delete attachment.base64;
        if (sha1s.has(sha1)) continue;
        sha1s.add(sha1);
        zipFile.addBuffer(content, 'resources/' + sha1);
      }
    }
    const traceContent = Buffer.from(this._traceEvents.map(e => JSON.stringify(e)).join('\n'));
    zipFile.addBuffer(traceContent, testTraceEntryName);
    await new Promise(f => {
      zipFile.end(undefined, () => {
        zipFile.outputStream.pipe(_fs.default.createWriteStream(fileName)).on('close', f);
      });
    });
  }
  appendStdioToTrace(type, chunk) {
    this._appendTraceEvent({
      type,
      timestamp: (0, _utils.monotonicTime)(),
      text: typeof chunk === 'string' ? chunk : undefined,
      base64: typeof chunk === 'string' ? undefined : chunk.toString('base64')
    });
  }
  appendBeforeActionForStep(callId, parentId, apiName, params, wallTime, stack) {
    this._appendTraceEvent({
      type: 'before',
      callId,
      parentId,
      wallTime,
      startTime: (0, _utils.monotonicTime)(),
      class: 'Test',
      method: 'step',
      apiName,
      params: Object.fromEntries(Object.entries(params || {}).map(([name, value]) => [name, generatePreview(value)])),
      stack
    });
  }
  appendAfterActionForStep(callId, error, attachments = []) {
    this._appendTraceEvent({
      type: 'after',
      callId,
      endTime: (0, _utils.monotonicTime)(),
      attachments: serializeAttachments(attachments),
      error
    });
  }
  _appendTraceEvent(event) {
    this._traceEvents.push(event);
    if (this._liveTraceFile) _fs.default.appendFileSync(this._liveTraceFile, JSON.stringify(event) + '\n');
  }
}
exports.TestTracing = TestTracing;
function serializeAttachments(attachments) {
  return attachments.filter(a => a.name !== 'trace').map(a => {
    var _a$body;
    return {
      name: a.name,
      contentType: a.contentType,
      path: a.path,
      base64: (_a$body = a.body) === null || _a$body === void 0 ? void 0 : _a$body.toString('base64')
    };
  });
}
function generatePreview(value, visited = new Set()) {
  if (visited.has(value)) return '';
  visited.add(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return '[' + value.map(v => generatePreview(v, visited)).join(', ') + ']';
  if (typeof value === 'object') return 'Object';
  return String(value);
}
async function mergeTraceFiles(fileName, temporaryTraceFiles) {
  if (temporaryTraceFiles.length === 1) {
    await _fs.default.promises.rename(temporaryTraceFiles[0], fileName);
    return;
  }
  const mergePromise = new _utils.ManualPromise();
  const zipFile = new _zipBundle.yazl.ZipFile();
  const entryNames = new Set();
  zipFile.on('error', error => mergePromise.reject(error));
  for (let i = temporaryTraceFiles.length - 1; i >= 0; --i) {
    const tempFile = temporaryTraceFiles[i];
    const promise = new _utils.ManualPromise();
    _zipBundle.yauzl.open(tempFile, (err, inZipFile) => {
      if (err) {
        promise.reject(err);
        return;
      }
      let pendingEntries = inZipFile.entryCount;
      inZipFile.on('entry', entry => {
        let entryName = entry.fileName;
        if (entry.fileName === testTraceEntryName) {
          // Keep the name for test traces so that the last test trace
          // that contains most of the information is kept in the trace.
          // Note the reverse order of the iteration (from new traces to old).
        } else if (entry.fileName.match(/[\d-]*trace\./)) {
          entryName = i + '-' + entry.fileName;
        }
        if (entryNames.has(entryName)) {
          if (--pendingEntries === 0) promise.resolve();
          return;
        }
        entryNames.add(entryName);
        inZipFile.openReadStream(entry, (err, readStream) => {
          if (err) {
            promise.reject(err);
            return;
          }
          zipFile.addReadStream(readStream, entryName);
          if (--pendingEntries === 0) promise.resolve();
        });
      });
    });
    await promise;
  }
  zipFile.end(undefined, () => {
    zipFile.outputStream.pipe(_fs.default.createWriteStream(fileName)).on('close', () => {
      void Promise.all(temporaryTraceFiles.map(tempFile => _fs.default.promises.unlink(tempFile))).then(() => {
        mergePromise.resolve();
      }).catch(error => mergePromise.reject(error));
    }).on('error', error => mergePromise.reject(error));
  });
  await mergePromise;
}