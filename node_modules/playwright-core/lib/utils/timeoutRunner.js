"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimeoutRunnerError = exports.TimeoutRunner = exports.MaxTime = void 0;
exports.pollAgainstDeadline = pollAgainstDeadline;
exports.raceAgainstDeadline = raceAgainstDeadline;
var _manualPromise = require("./manualPromise");
var _ = require("./");
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

class TimeoutRunnerError extends Error {}
exports.TimeoutRunnerError = TimeoutRunnerError;
const MaxTime = exports.MaxTime = 2147483647; // 2^31-1

class TimeoutRunner {
  constructor(timeout) {
    this._running = void 0;
    this._timeout = void 0;
    this._elapsed = void 0;
    this._deadline = MaxTime;
    this._timeout = timeout;
    this._elapsed = 0;
  }
  async run(cb) {
    const running = this._running = {
      lastElapsedSync: (0, _.monotonicTime)(),
      timer: undefined,
      timeoutPromise: new _manualPromise.ManualPromise()
    };
    try {
      const resultPromise = Promise.race([cb(), running.timeoutPromise]);
      this._updateTimeout(running, this._timeout);
      return await resultPromise;
    } finally {
      this._updateTimeout(running, 0);
      if (this._running === running) this._running = undefined;
    }
  }
  interrupt() {
    if (this._running) this._updateTimeout(this._running, -1);
  }
  elapsed() {
    this._syncElapsedAndStart();
    return this._elapsed;
  }
  deadline() {
    return this._deadline;
  }
  updateTimeout(timeout, elapsed) {
    this._timeout = timeout;
    if (elapsed !== undefined) {
      this._syncElapsedAndStart();
      this._elapsed = elapsed;
    }
    if (this._running) this._updateTimeout(this._running, timeout);
  }
  _syncElapsedAndStart() {
    if (this._running) {
      const now = (0, _.monotonicTime)();
      this._elapsed += now - this._running.lastElapsedSync;
      this._running.lastElapsedSync = now;
    }
  }
  _updateTimeout(running, timeout) {
    if (running.timer) {
      clearTimeout(running.timer);
      running.timer = undefined;
    }
    this._syncElapsedAndStart();
    this._deadline = timeout ? (0, _.monotonicTime)() + timeout : MaxTime;
    if (timeout === 0) return;
    timeout = timeout - this._elapsed;
    if (timeout <= 0) running.timeoutPromise.reject(new TimeoutRunnerError());else running.timer = setTimeout(() => running.timeoutPromise.reject(new TimeoutRunnerError()), timeout);
  }
}
exports.TimeoutRunner = TimeoutRunner;
async function raceAgainstDeadline(cb, deadline) {
  const runner = new TimeoutRunner((deadline || MaxTime) - (0, _.monotonicTime)());
  try {
    return {
      result: await runner.run(cb),
      timedOut: false
    };
  } catch (e) {
    if (e instanceof TimeoutRunnerError) return {
      timedOut: true
    };
    throw e;
  }
}
async function pollAgainstDeadline(callback, deadline, pollIntervals = [100, 250, 500, 1000]) {
  var _pollIntervals$pop;
  const lastPollInterval = (_pollIntervals$pop = pollIntervals.pop()) !== null && _pollIntervals$pop !== void 0 ? _pollIntervals$pop : 1000;
  let lastResult;
  const wrappedCallback = () => Promise.resolve().then(callback);
  while (true) {
    var _shift;
    const time = (0, _.monotonicTime)();
    if (deadline && time >= deadline) break;
    const received = await raceAgainstDeadline(wrappedCallback, deadline);
    if (received.timedOut) break;
    lastResult = received.result.result;
    if (!received.result.continuePolling) return {
      result: lastResult,
      timedOut: false
    };
    const interval = (_shift = pollIntervals.shift()) !== null && _shift !== void 0 ? _shift : lastPollInterval;
    if (deadline && deadline <= (0, _.monotonicTime)() + interval) break;
    await new Promise(x => setTimeout(x, interval));
  }
  return {
    timedOut: true,
    result: lastResult
  };
}