"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimeoutManager = void 0;
var _utilsBundle = require("playwright-core/lib/utilsBundle");
var _utils = require("playwright-core/lib/utils");
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

class TimeoutManager {
  constructor(timeout) {
    this._defaultSlot = void 0;
    this._defaultRunnable = void 0;
    this._runnable = void 0;
    this._fixture = void 0;
    this._timeoutRunner = void 0;
    this._defaultSlot = {
      timeout,
      elapsed: 0
    };
    this._defaultRunnable = {
      type: 'test',
      slot: this._defaultSlot
    };
    this._runnable = this._defaultRunnable;
    this._timeoutRunner = new _utils.TimeoutRunner(timeout);
  }
  interrupt() {
    this._timeoutRunner.interrupt();
  }
  async withRunnable(runnable, cb) {
    const existingRunnable = this._runnable;
    const effectiveRunnable = {
      ...runnable
    };
    if (!effectiveRunnable.slot) effectiveRunnable.slot = this._runnable.slot;
    this._updateRunnables(effectiveRunnable, undefined);
    try {
      return await cb();
    } finally {
      this._updateRunnables(existingRunnable, undefined);
    }
  }
  setCurrentFixture(fixture) {
    this._updateRunnables(this._runnable, fixture);
  }
  defaultSlotTimings() {
    const slot = this._currentSlot();
    slot.elapsed = this._timeoutRunner.elapsed();
    return this._defaultSlot;
  }
  slow() {
    const slot = this._currentSlot();
    slot.timeout = slot.timeout * 3;
    this._timeoutRunner.updateTimeout(slot.timeout);
  }
  async runWithTimeout(cb) {
    try {
      await this._timeoutRunner.run(cb);
    } catch (error) {
      if (!(error instanceof _utils.TimeoutRunnerError)) throw error;
      return this._createTimeoutError();
    }
  }
  setTimeout(timeout) {
    const slot = this._currentSlot();
    if (!slot.timeout) return; // Zero timeout means some debug mode - do not set a timeout.
    slot.timeout = timeout;
    this._timeoutRunner.updateTimeout(timeout);
  }
  currentRunnableType() {
    return this._runnable.type;
  }
  currentSlotDeadline() {
    return this._timeoutRunner.deadline();
  }
  _currentSlot() {
    var _this$_fixture;
    return ((_this$_fixture = this._fixture) === null || _this$_fixture === void 0 ? void 0 : _this$_fixture.slot) || this._runnable.slot || this._defaultSlot;
  }
  _updateRunnables(runnable, fixture) {
    let slot = this._currentSlot();
    slot.elapsed = this._timeoutRunner.elapsed();
    this._runnable = runnable;
    this._fixture = fixture;
    slot = this._currentSlot();
    this._timeoutRunner.updateTimeout(slot.timeout, slot.elapsed);
  }
  _createTimeoutError() {
    var _this$_fixture2;
    let message = '';
    const timeout = this._currentSlot().timeout;
    switch (this._runnable.type) {
      case 'afterHooks':
      case 'test':
        {
          if (this._fixture) {
            if (this._fixture.phase === 'setup') {
              message = `Test timeout of ${timeout}ms exceeded while setting up "${this._fixture.title}".`;
            } else {
              message = [`Test finished within timeout of ${timeout}ms, but tearing down "${this._fixture.title}" ran out of time.`, `Please allow more time for the test, since teardown is attributed towards the test timeout budget.`].join('\n');
            }
          } else {
            message = `Test timeout of ${timeout}ms exceeded.`;
          }
          break;
        }
      case 'afterEach':
      case 'beforeEach':
        message = `Test timeout of ${timeout}ms exceeded while running "${this._runnable.type}" hook.`;
        break;
      case 'beforeAll':
      case 'afterAll':
        message = `"${this._runnable.type}" hook timeout of ${timeout}ms exceeded.`;
        break;
      case 'teardown':
        {
          if (this._fixture) message = `Worker teardown timeout of ${timeout}ms exceeded while ${this._fixture.phase === 'setup' ? 'setting up' : 'tearing down'} "${this._fixture.title}".`;else message = `Worker teardown timeout of ${timeout}ms exceeded.`;
          break;
        }
      case 'skip':
      case 'slow':
      case 'fixme':
      case 'fail':
        message = `"${this._runnable.type}" modifier timeout of ${timeout}ms exceeded.`;
        break;
    }
    const fixtureWithSlot = (_this$_fixture2 = this._fixture) !== null && _this$_fixture2 !== void 0 && _this$_fixture2.slot ? this._fixture : undefined;
    if (fixtureWithSlot) message = `Fixture "${fixtureWithSlot.title}" timeout of ${timeout}ms exceeded during ${fixtureWithSlot.phase}.`;
    message = _utilsBundle.colors.red(message);
    const location = (fixtureWithSlot || this._runnable).location;
    return {
      message,
      // Include location for hooks, modifiers and fixtures to distinguish between them.
      stack: location ? message + `\n    at ${location.file}:${location.line}:${location.column}` : undefined
    };
  }
}
exports.TimeoutManager = TimeoutManager;