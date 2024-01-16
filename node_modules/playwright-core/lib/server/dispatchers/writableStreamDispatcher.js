"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WritableStreamDispatcher = void 0;
var _dispatcher = require("./dispatcher");
var fs = _interopRequireWildcard(require("fs"));
var _utils = require("../../utils");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
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

class WritableStreamDispatcher extends _dispatcher.Dispatcher {
  constructor(scope, stream, lastModifiedMs) {
    super(scope, {
      guid: 'writableStream@' + (0, _utils.createGuid)(),
      stream
    }, 'WritableStream', {});
    this._type_WritableStream = true;
    this._lastModifiedMs = void 0;
    this._lastModifiedMs = lastModifiedMs;
  }
  async write(params) {
    const stream = this._object.stream;
    await new Promise((fulfill, reject) => {
      stream.write(params.binary, error => {
        if (error) reject(error);else fulfill();
      });
    });
  }
  async close() {
    const stream = this._object.stream;
    await new Promise(fulfill => stream.end(fulfill));
    if (this._lastModifiedMs) await fs.promises.utimes(this.path(), new Date(this._lastModifiedMs), new Date(this._lastModifiedMs));
  }
  path() {
    return this._object.stream.path;
  }
}
exports.WritableStreamDispatcher = WritableStreamDispatcher;