"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.currentBlobReportVersion = exports.BlobReporter = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _utils = require("playwright-core/lib/utils");
var _utilsBundle = require("playwright-core/lib/utilsBundle");
var _stream = require("stream");
var _teleEmitter = require("./teleEmitter");
var _zipBundle = require("playwright-core/lib/zipBundle");
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

const currentBlobReportVersion = exports.currentBlobReportVersion = 1;
class BlobReporter extends _teleEmitter.TeleReporterEmitter {
  constructor(options) {
    super(message => this._messages.push(message), false);
    this._messages = [];
    this._attachments = [];
    this._options = void 0;
    this._salt = void 0;
    this._reportName = void 0;
    this._options = options;
    this._salt = (0, _utils.createGuid)();
  }
  onConfigure(config) {
    var _config$shard;
    const metadata = {
      version: currentBlobReportVersion,
      userAgent: (0, _utils.getUserAgent)(),
      name: process.env.PWTEST_BLOB_REPORT_NAME,
      shard: (_config$shard = config.shard) !== null && _config$shard !== void 0 ? _config$shard : undefined
    };
    this._messages.push({
      method: 'onBlobReportMetadata',
      params: metadata
    });
    this._reportName = this._computeReportName(config);
    super.onConfigure(config);
  }
  async onEnd(result) {
    await super.onEnd(result);
    const outputDir = (0, _util.resolveReporterOutputPath)('blob-report', this._options.configDir, this._options.outputDir);
    if (!process.env.PWTEST_BLOB_DO_NOT_REMOVE) await (0, _utils.removeFolders)([outputDir]);
    await _fs.default.promises.mkdir(outputDir, {
      recursive: true
    });
    const zipFile = new _zipBundle.yazl.ZipFile();
    const zipFinishPromise = new _utils.ManualPromise();
    const finishPromise = zipFinishPromise.catch(e => {
      throw new Error(`Failed to write report ${this._reportName + '.zip'}: ` + e.message);
    });
    zipFile.on('error', error => zipFinishPromise.reject(error));
    const zipFileName = _path.default.join(outputDir, this._reportName + '.zip');
    zipFile.outputStream.pipe(_fs.default.createWriteStream(zipFileName)).on('close', () => {
      zipFinishPromise.resolve(undefined);
    }).on('error', error => zipFinishPromise.reject(error));
    for (const {
      originalPath,
      zipEntryPath
    } of this._attachments) {
      var _fs$statSync;
      if (!((_fs$statSync = _fs.default.statSync(originalPath, {
        throwIfNoEntry: false
      })) !== null && _fs$statSync !== void 0 && _fs$statSync.isFile())) continue;
      zipFile.addFile(originalPath, zipEntryPath);
    }
    const lines = this._messages.map(m => JSON.stringify(m) + '\n');
    const content = _stream.Readable.from(lines);
    zipFile.addReadStream(content, this._reportName + '.jsonl');
    zipFile.end();
    await finishPromise;
  }
  _computeReportName(config) {
    let reportName = 'report';
    if (process.env.PWTEST_BLOB_REPORT_NAME) reportName += `-${(0, _utils.sanitizeForFilePath)(process.env.PWTEST_BLOB_REPORT_NAME)}`;
    if (config.shard) {
      const paddedNumber = `${config.shard.current}`.padStart(`${config.shard.total}`.length, '0');
      reportName += `-${paddedNumber}`;
    }
    return reportName;
  }
  _serializeAttachments(attachments) {
    return super._serializeAttachments(attachments).map(attachment => {
      if (!attachment.path) return attachment;
      // Add run guid to avoid clashes between shards.
      const sha1 = (0, _utils.calculateSha1)(attachment.path + this._salt);
      const extension = _utilsBundle.mime.getExtension(attachment.contentType) || 'dat';
      const newPath = `resources/${sha1}.${extension}`;
      this._attachments.push({
        originalPath: attachment.path,
        zipEntryPath: newPath
      });
      return {
        ...attachment,
        path: newPath
      };
    });
  }
}
exports.BlobReporter = BlobReporter;