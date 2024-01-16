"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PortTransport = void 0;
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

class PortTransport {
  constructor(port, handler) {
    this._lastId = 0;
    this._port = void 0;
    this._callbacks = new Map();
    this._port = port;
    port.onmessage = async event => {
      const message = event.data;
      const {
        id,
        ackId,
        method,
        params,
        result
      } = message;
      if (id) {
        const result = await handler(method, params);
        this._port.postMessage({
          ackId: id,
          result
        });
        return;
      }
      if (ackId) {
        const callback = this._callbacks.get(ackId);
        this._callbacks.delete(ackId);
        callback === null || callback === void 0 ? void 0 : callback(result);
        return;
      }
    };
  }
  async send(method, params) {
    return await new Promise(f => {
      const id = ++this._lastId;
      this._callbacks.set(id, f);
      this._port.postMessage({
        id,
        method,
        params
      });
    });
  }
}
exports.PortTransport = PortTransport;