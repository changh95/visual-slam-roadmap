"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.expect = void 0;
exports.mergeExpects = mergeExpects;
exports.printReceivedStringContainExpectedSubstring = exports.printReceivedStringContainExpectedResult = void 0;
var _utils = require("playwright-core/lib/utils");
var _matchers = require("./matchers");
var _toMatchSnapshot = require("./toMatchSnapshot");
var _globals = require("../common/globals");
var _util = require("../util");
var _expectBundle = require("../common/expectBundle");
var _testInfo = require("../worker/testInfo");
var _matcherHint = require("./matcherHint");
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

// #region
// Mirrored from https://github.com/facebook/jest/blob/f13abff8df9a0e1148baf3584bcde6d1b479edc7/packages/expect/src/print.ts
/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found here
 * https://github.com/facebook/jest/blob/1547740bbc26400d69f4576bf35645163e942829/LICENSE
 */

// Format substring but do not enclose in double quote marks.
// The replacement is compatible with pretty-format package.
const printSubstring = val => val.replace(/"|\\/g, '\\$&');
const printReceivedStringContainExpectedSubstring = (received, start, length // not end
) => (0, _expectBundle.RECEIVED_COLOR)('"' + printSubstring(received.slice(0, start)) + (0, _expectBundle.INVERTED_COLOR)(printSubstring(received.slice(start, start + length))) + printSubstring(received.slice(start + length)) + '"');
exports.printReceivedStringContainExpectedSubstring = printReceivedStringContainExpectedSubstring;
const printReceivedStringContainExpectedResult = (received, result) => result === null ? (0, _expectBundle.printReceived)(received) : printReceivedStringContainExpectedSubstring(received, result.index, result[0].length);

// #endregion
exports.printReceivedStringContainExpectedResult = printReceivedStringContainExpectedResult;
function createMatchers(actual, info) {
  return new Proxy((0, _expectBundle.expect)(actual), new ExpectMetaInfoProxyHandler(info));
}
function createExpect(info) {
  const expectInstance = new Proxy(_expectBundle.expect, {
    apply: function (target, thisArg, argumentsList) {
      const [actual, messageOrOptions] = argumentsList;
      const message = (0, _utils.isString)(messageOrOptions) ? messageOrOptions : (messageOrOptions === null || messageOrOptions === void 0 ? void 0 : messageOrOptions.message) || info.message;
      const newInfo = {
        ...info,
        message
      };
      if (newInfo.isPoll) {
        if (typeof actual !== 'function') throw new Error('`expect.poll()` accepts only function as a first argument');
        newInfo.generator = actual;
      }
      return createMatchers(actual, newInfo);
    },
    get: function (target, property) {
      if (property === 'configure') return configure;
      if (property === 'extend') {
        return matchers => {
          _expectBundle.expect.extend(matchers);
          return expectInstance;
        };
      }
      if (property === 'soft') {
        return (actual, messageOrOptions) => {
          return configure({
            soft: true
          })(actual, messageOrOptions);
        };
      }
      if (property === 'poll') {
        return (actual, messageOrOptions) => {
          const poll = (0, _utils.isString)(messageOrOptions) ? {} : messageOrOptions || {};
          return configure({
            _poll: poll
          })(actual, messageOrOptions);
        };
      }
      return _expectBundle.expect[property];
    }
  });
  const configure = configuration => {
    const newInfo = {
      ...info
    };
    if ('message' in configuration) newInfo.message = configuration.message;
    if ('timeout' in configuration) newInfo.timeout = configuration.timeout;
    if ('soft' in configuration) newInfo.isSoft = configuration.soft;
    if ('_poll' in configuration) {
      newInfo.isPoll = !!configuration._poll;
      if (typeof configuration._poll === 'object') {
        newInfo.pollTimeout = configuration._poll.timeout;
        newInfo.pollIntervals = configuration._poll.intervals;
      }
    }
    return createExpect(newInfo);
  };
  return expectInstance;
}
const expect = exports.expect = createExpect({});
_expectBundle.expect.setState({
  expand: false
});
const customAsyncMatchers = {
  toBeAttached: _matchers.toBeAttached,
  toBeChecked: _matchers.toBeChecked,
  toBeDisabled: _matchers.toBeDisabled,
  toBeEditable: _matchers.toBeEditable,
  toBeEmpty: _matchers.toBeEmpty,
  toBeEnabled: _matchers.toBeEnabled,
  toBeFocused: _matchers.toBeFocused,
  toBeHidden: _matchers.toBeHidden,
  toBeInViewport: _matchers.toBeInViewport,
  toBeOK: _matchers.toBeOK,
  toBeVisible: _matchers.toBeVisible,
  toContainText: _matchers.toContainText,
  toHaveAttribute: _matchers.toHaveAttribute,
  toHaveClass: _matchers.toHaveClass,
  toHaveCount: _matchers.toHaveCount,
  toHaveCSS: _matchers.toHaveCSS,
  toHaveId: _matchers.toHaveId,
  toHaveJSProperty: _matchers.toHaveJSProperty,
  toHaveText: _matchers.toHaveText,
  toHaveTitle: _matchers.toHaveTitle,
  toHaveURL: _matchers.toHaveURL,
  toHaveValue: _matchers.toHaveValue,
  toHaveValues: _matchers.toHaveValues,
  toHaveScreenshot: _toMatchSnapshot.toHaveScreenshot,
  toPass: _matchers.toPass
};
const customMatchers = {
  ...customAsyncMatchers,
  toMatchSnapshot: _toMatchSnapshot.toMatchSnapshot
};
class ExpectMetaInfoProxyHandler {
  constructor(info) {
    this._info = void 0;
    this._info = {
      ...info
    };
  }
  get(target, matcherName, receiver) {
    let matcher = Reflect.get(target, matcherName, receiver);
    if (typeof matcherName !== 'string') return matcher;
    if (matcher === undefined) throw new Error(`expect: Property '${matcherName}' not found.`);
    if (typeof matcher !== 'function') {
      if (matcherName === 'not') this._info.isNot = !this._info.isNot;
      return new Proxy(matcher, this);
    }
    if (this._info.isPoll) {
      if (customAsyncMatchers[matcherName] || matcherName === 'resolves' || matcherName === 'rejects') throw new Error(`\`expect.poll()\` does not support "${matcherName}" matcher.`);
      matcher = (...args) => pollMatcher(matcherName, !!this._info.isNot, this._info.pollIntervals, (0, _globals.currentExpectTimeout)({
        timeout: this._info.pollTimeout
      }), this._info.generator, ...args);
    }
    return (...args) => {
      const testInfo = (0, _globals.currentTestInfo)();
      if (!testInfo) return matcher.call(target, ...args);
      const rawStack = (0, _utils.captureRawStack)();
      const stackFrames = (0, _util.filteredStackTrace)(rawStack);
      const customMessage = this._info.message || '';
      const argsSuffix = computeArgsSuffix(matcherName, args);
      const defaultTitle = `expect${this._info.isPoll ? '.poll' : ''}${this._info.isSoft ? '.soft' : ''}${this._info.isNot ? '.not' : ''}.${matcherName}${argsSuffix}`;
      const title = customMessage || defaultTitle;
      const wallTime = Date.now();
      const step = matcherName !== 'toPass' ? testInfo._addStep({
        location: stackFrames[0],
        category: 'expect',
        title: (0, _util.trimLongString)(title, 1024),
        params: args[0] ? {
          expected: args[0]
        } : undefined,
        wallTime,
        infectParentStepsWithError: this._info.isSoft,
        laxParent: true
      }) : undefined;
      const reportStepError = jestError => {
        const error = new _matcherHint.ExpectError(jestError, customMessage, stackFrames);
        const serializedError = {
          message: error.message,
          stack: error.stack
        };
        step === null || step === void 0 ? void 0 : step.complete({
          error: serializedError
        });
        if (this._info.isSoft) testInfo._failWithError(serializedError, false /* isHardError */);else throw error;
      };
      const finalizer = () => {
        step === null || step === void 0 ? void 0 : step.complete({});
      };
      const expectZone = {
        title,
        wallTime
      };
      // We assume that the matcher will read the current expect timeout the first thing.
      (0, _globals.setCurrentExpectConfigureTimeout)(this._info.timeout);
      try {
        const result = _utils.zones.run('expectZone', expectZone, () => matcher.call(target, ...args));
        if (result instanceof Promise) return result.then(finalizer).catch(reportStepError);
        finalizer();
        return result;
      } catch (e) {
        reportStepError(e);
      }
    };
  }
}
async function pollMatcher(matcherName, isNot, pollIntervals, timeout, generator, ...args) {
  const testInfo = (0, _globals.currentTestInfo)();
  const {
    deadline,
    timeoutMessage
  } = testInfo ? testInfo._deadlineForMatcher(timeout) : _testInfo.TestInfoImpl._defaultDeadlineForMatcher(timeout);
  const result = await (0, _utils.pollAgainstDeadline)(async () => {
    if (testInfo && (0, _globals.currentTestInfo)() !== testInfo) return {
      continuePolling: false,
      result: undefined
    };
    const value = await generator();
    let expectInstance = (0, _expectBundle.expect)(value);
    if (isNot) expectInstance = expectInstance.not;
    try {
      expectInstance[matcherName].call(expectInstance, ...args);
      return {
        continuePolling: false,
        result: undefined
      };
    } catch (error) {
      return {
        continuePolling: true,
        result: error
      };
    }
  }, deadline, pollIntervals !== null && pollIntervals !== void 0 ? pollIntervals : [100, 250, 500, 1000]);
  if (result.timedOut) {
    const message = result.result ? [result.result.message, '', `Call Log:`, `- ${timeoutMessage}`].join('\n') : timeoutMessage;
    throw new Error(message);
  }
}
function computeArgsSuffix(matcherName, args) {
  let value = '';
  if (matcherName === 'toHaveScreenshot') value = (0, _toMatchSnapshot.toHaveScreenshotStepTitle)(...args);
  return value ? `(${value})` : '';
}
_expectBundle.expect.extend(customMatchers);
function mergeExpects(...expects) {
  return expect;
}