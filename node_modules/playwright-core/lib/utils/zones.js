"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runWithFinally = runWithFinally;
exports.zones = void 0;
var _stackTrace = require("./stackTrace");
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

class ZoneManager {
  constructor() {
    this.lastZoneId = 0;
    this._zones = new Map();
  }
  run(type, data, func) {
    return new Zone(this, ++this.lastZoneId, type, data).run(func);
  }
  zoneData(type, rawStack) {
    for (const line of rawStack) {
      for (const zoneId of zoneIds(line)) {
        const zone = this._zones.get(zoneId);
        if (zone && zone.type === type) return zone.data;
      }
    }
    return null;
  }
  preserve(callback) {
    const rawStack = (0, _stackTrace.captureRawStack)();
    const refs = [];
    for (const line of rawStack) refs.push(...zoneIds(line));
    Object.defineProperty(callback, 'name', {
      value: `__PWZONE__[${refs.join(',')}]-refs`
    });
    return callback();
  }
}
function zoneIds(line) {
  const index = line.indexOf('__PWZONE__[');
  if (index === -1) return [];
  return line.substring(index + '__PWZONE__['.length, line.indexOf(']', index)).split(',').map(s => +s);
}
class Zone {
  constructor(manager, id, type, data) {
    this._manager = void 0;
    this.id = void 0;
    this.type = void 0;
    this.data = void 0;
    this.wallTime = void 0;
    this._manager = manager;
    this.id = id;
    this.type = type;
    this.data = data;
    this.wallTime = Date.now();
  }
  run(func) {
    this._manager._zones.set(this.id, this);
    Object.defineProperty(func, 'name', {
      value: `__PWZONE__[${this.id}]-${this.type}`
    });
    return runWithFinally(() => func(this.data), () => {
      this._manager._zones.delete(this.id);
    });
  }
}
function runWithFinally(func, finallyFunc) {
  try {
    const result = func();
    if (result instanceof Promise) {
      return result.then(r => {
        finallyFunc();
        return r;
      }).catch(e => {
        finallyFunc();
        throw e;
      });
    }
    finallyFunc();
    return result;
  } catch (e) {
    finallyFunc();
    throw e;
  }
}
const zones = exports.zones = new ZoneManager();