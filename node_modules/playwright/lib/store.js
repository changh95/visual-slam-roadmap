"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.store = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _globals = require("./common/globals");
var _utilsBundle = require("playwright-core/lib/utilsBundle");
var _utils = require("playwright-core/lib/utils");
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

class JsonStore {
  async delete(name) {
    const file = this.path(name);
    await _fs.default.promises.rm(file, {
      force: true
    });
  }
  async get(name) {
    const file = this.path(name);
    try {
      const type = contentType(name);
      if (type === 'binary') return await _fs.default.promises.readFile(file);
      const text = await _fs.default.promises.readFile(file, 'utf-8');
      if (type === 'json') return JSON.parse(text);
      return text;
    } catch (e) {
      return undefined;
    }
  }
  path(name) {
    return _path.default.join(this.root(), name);
  }
  root() {
    const config = (0, _globals.currentConfig)();
    if (!config) throw new Error('Cannot access store before config is loaded');
    return config.storeDir;
  }
  async set(name, value) {
    const file = this.path(name);
    if (value === undefined) {
      await _fs.default.promises.rm(file, {
        force: true
      });
      return;
    }
    let data = '';
    switch (contentType(name)) {
      case 'json':
        {
          if (Buffer.isBuffer(value)) throw new Error('JSON value must be an Object');
          data = JSON.stringify(value, undefined, 2);
          break;
        }
      case 'text':
        {
          if (!(0, _utils.isString)(value)) throw new Error('Textual value must be a string');
          data = value;
          break;
        }
      case 'binary':
        {
          if (!Buffer.isBuffer(value)) throw new Error('Binary value must be a Buffer');
          data = value;
          break;
        }
    }
    await _fs.default.promises.mkdir(_path.default.dirname(file), {
      recursive: true
    });
    await _fs.default.promises.writeFile(file, data);
  }
}
function contentType(name) {
  var _mime$getType;
  const mimeType = (_mime$getType = _utilsBundle.mime.getType(_path.default.basename(name))) !== null && _mime$getType !== void 0 ? _mime$getType : 'application/octet-string';
  if ((0, _utils.isJsonMimeType)(mimeType)) return 'json';
  if ((0, _utils.isTextualMimeType)(mimeType)) return 'text';
  return 'binary';
}
const store = exports.store = new JsonStore();