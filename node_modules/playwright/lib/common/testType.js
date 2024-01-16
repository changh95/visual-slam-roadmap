"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TestTypeImpl = void 0;
exports.mergeTests = mergeTests;
exports.rootTestType = void 0;
var _expect = require("../matchers/expect");
var _globals = require("./globals");
var _test = require("./test");
var _transform = require("../transform/transform");
var _utils = require("playwright-core/lib/utils");
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

const testTypeSymbol = Symbol('testType');
class TestTypeImpl {
  constructor(fixtures) {
    this.fixtures = void 0;
    this.test = void 0;
    this.fixtures = fixtures;
    const test = (0, _transform.wrapFunctionWithLocation)(this._createTest.bind(this, 'default'));
    test[testTypeSymbol] = this;
    test.expect = _expect.expect;
    test.only = (0, _transform.wrapFunctionWithLocation)(this._createTest.bind(this, 'only'));
    test.describe = (0, _transform.wrapFunctionWithLocation)(this._describe.bind(this, 'default'));
    test.describe.only = (0, _transform.wrapFunctionWithLocation)(this._describe.bind(this, 'only'));
    test.describe.configure = (0, _transform.wrapFunctionWithLocation)(this._configure.bind(this));
    test.describe.fixme = (0, _transform.wrapFunctionWithLocation)(this._describe.bind(this, 'fixme'));
    test.describe.parallel = (0, _transform.wrapFunctionWithLocation)(this._describe.bind(this, 'parallel'));
    test.describe.parallel.only = (0, _transform.wrapFunctionWithLocation)(this._describe.bind(this, 'parallel.only'));
    test.describe.serial = (0, _transform.wrapFunctionWithLocation)(this._describe.bind(this, 'serial'));
    test.describe.serial.only = (0, _transform.wrapFunctionWithLocation)(this._describe.bind(this, 'serial.only'));
    test.describe.skip = (0, _transform.wrapFunctionWithLocation)(this._describe.bind(this, 'skip'));
    test.beforeEach = (0, _transform.wrapFunctionWithLocation)(this._hook.bind(this, 'beforeEach'));
    test.afterEach = (0, _transform.wrapFunctionWithLocation)(this._hook.bind(this, 'afterEach'));
    test.beforeAll = (0, _transform.wrapFunctionWithLocation)(this._hook.bind(this, 'beforeAll'));
    test.afterAll = (0, _transform.wrapFunctionWithLocation)(this._hook.bind(this, 'afterAll'));
    test.skip = (0, _transform.wrapFunctionWithLocation)(this._modifier.bind(this, 'skip'));
    test.fixme = (0, _transform.wrapFunctionWithLocation)(this._modifier.bind(this, 'fixme'));
    test.fail = (0, _transform.wrapFunctionWithLocation)(this._modifier.bind(this, 'fail'));
    test.slow = (0, _transform.wrapFunctionWithLocation)(this._modifier.bind(this, 'slow'));
    test.setTimeout = (0, _transform.wrapFunctionWithLocation)(this._setTimeout.bind(this));
    test.step = this._step.bind(this);
    test.use = (0, _transform.wrapFunctionWithLocation)(this._use.bind(this));
    test.extend = (0, _transform.wrapFunctionWithLocation)(this._extend.bind(this));
    test.info = () => {
      const result = (0, _globals.currentTestInfo)();
      if (!result) throw new Error('test.info() can only be called while test is running');
      return result;
    };
    this.test = test;
  }
  _currentSuite(location, title) {
    const suite = (0, _globals.currentlyLoadingFileSuite)();
    if (!suite) {
      throw new Error([`Playwright Test did not expect ${title} to be called here.`, `Most common reasons include:`, `- You are calling ${title} in a configuration file.`, `- You are calling ${title} in a file that is imported by the configuration file.`, `- You have two different versions of @playwright/test. This usually happens`, `  when one of the dependencies in your package.json depends on @playwright/test.`].join('\n'));
    }
    return suite;
  }
  _createTest(type, location, title, fn) {
    throwIfRunningInsideJest();
    const suite = this._currentSuite(location, 'test()');
    if (!suite) return;
    const test = new _test.TestCase(title, fn, this, location);
    test._requireFile = suite._requireFile;
    suite._addTest(test);
    if (type === 'only') test._only = true;
    if (type === 'skip' || type === 'fixme') test._staticAnnotations.push({
      type
    });
  }
  _describe(type, location, title, fn) {
    throwIfRunningInsideJest();
    const suite = this._currentSuite(location, 'test.describe()');
    if (!suite) return;
    if (typeof title === 'function') {
      fn = title;
      title = '';
    }
    const child = new _test.Suite(title, 'describe');
    child._requireFile = suite._requireFile;
    child.location = location;
    suite._addSuite(child);
    if (type === 'only' || type === 'serial.only' || type === 'parallel.only') child._only = true;
    if (type === 'serial' || type === 'serial.only') child._parallelMode = 'serial';
    if (type === 'parallel' || type === 'parallel.only') child._parallelMode = 'parallel';
    if (type === 'skip' || type === 'fixme') child._staticAnnotations.push({
      type
    });
    for (let parent = suite; parent; parent = parent.parent) {
      if (parent._parallelMode === 'serial' && child._parallelMode === 'parallel') throw new Error('describe.parallel cannot be nested inside describe.serial');
      if (parent._parallelMode === 'default' && child._parallelMode === 'parallel') throw new Error('describe.parallel cannot be nested inside describe with default mode');
    }
    (0, _globals.setCurrentlyLoadingFileSuite)(child);
    fn();
    (0, _globals.setCurrentlyLoadingFileSuite)(suite);
  }
  _hook(name, location, title, fn) {
    const suite = this._currentSuite(location, `test.${name}()`);
    if (!suite) return;
    if (typeof title === 'function') {
      fn = title;
      title = `${name} hook`;
    }
    suite._hooks.push({
      type: name,
      fn: fn,
      title,
      location
    });
  }
  _configure(location, options) {
    throwIfRunningInsideJest();
    const suite = this._currentSuite(location, `test.describe.configure()`);
    if (!suite) return;
    if (options.timeout !== undefined) suite._timeout = options.timeout;
    if (options.retries !== undefined) suite._retries = options.retries;
    if (options.mode !== undefined) {
      if (suite._parallelMode !== 'none') throw new Error(`"${suite._parallelMode}" mode is already assigned for the enclosing scope.`);
      suite._parallelMode = options.mode;
      for (let parent = suite.parent; parent; parent = parent.parent) {
        if (parent._parallelMode === 'serial' && suite._parallelMode === 'parallel') throw new Error('describe with parallel mode cannot be nested inside describe with serial mode');
        if (parent._parallelMode === 'default' && suite._parallelMode === 'parallel') throw new Error('describe with parallel mode cannot be nested inside describe with default mode');
      }
    }
  }
  _modifier(type, location, ...modifierArgs) {
    const suite = (0, _globals.currentlyLoadingFileSuite)();
    if (suite) {
      if (typeof modifierArgs[0] === 'string' && typeof modifierArgs[1] === 'function' && (type === 'skip' || type === 'fixme')) {
        // Support for test.{skip,fixme}('title', () => {})
        this._createTest(type, location, modifierArgs[0], modifierArgs[1]);
        return;
      }
      if (typeof modifierArgs[0] === 'function') {
        suite._modifiers.push({
          type,
          fn: modifierArgs[0],
          location,
          description: modifierArgs[1]
        });
      } else {
        if (modifierArgs.length >= 1 && !modifierArgs[0]) return;
        const description = modifierArgs[1];
        suite._staticAnnotations.push({
          type,
          description
        });
      }
      return;
    }
    const testInfo = (0, _globals.currentTestInfo)();
    if (!testInfo) throw new Error(`test.${type}() can only be called inside test, describe block or fixture`);
    if (typeof modifierArgs[0] === 'function') throw new Error(`test.${type}() with a function can only be called inside describe block`);
    testInfo[type](...modifierArgs);
  }
  _setTimeout(location, timeout) {
    const suite = (0, _globals.currentlyLoadingFileSuite)();
    if (suite) {
      suite._timeout = timeout;
      return;
    }
    const testInfo = (0, _globals.currentTestInfo)();
    if (!testInfo) throw new Error(`test.setTimeout() can only be called from a test`);
    testInfo.setTimeout(timeout);
  }
  _use(location, fixtures) {
    const suite = this._currentSuite(location, `test.use()`);
    if (!suite) return;
    suite._use.push({
      fixtures,
      location
    });
  }
  async _step(title, body, options = {}) {
    const testInfo = (0, _globals.currentTestInfo)();
    if (!testInfo) throw new Error(`test.step() can only be called from a test`);
    return testInfo._runAsStep({
      category: 'test.step',
      title,
      box: options.box
    }, async () => {
      // Make sure that internal "step" is not leaked to the user callback.
      return await body();
    });
  }
  _extend(location, fixtures) {
    if (fixtures[testTypeSymbol]) throw new Error(`test.extend() accepts fixtures object, not a test object.\nDid you mean to call mergeTests()?`);
    const fixturesWithLocation = {
      fixtures,
      location
    };
    return new TestTypeImpl([...this.fixtures, fixturesWithLocation]).test;
  }
}
exports.TestTypeImpl = TestTypeImpl;
function throwIfRunningInsideJest() {
  if (process.env.JEST_WORKER_ID) {
    const packageManagerCommand = (0, _utils.getPackageManagerExecCommand)();
    throw new Error(`Playwright Test needs to be invoked via '${packageManagerCommand} playwright test' and excluded from Jest test runs.\n` + `Creating one directory for Playwright tests and one for Jest is the recommended way of doing it.\n` + `See https://playwright.dev/docs/intro for more information about Playwright Test.`);
  }
}
const rootTestType = exports.rootTestType = new TestTypeImpl([]);
function mergeTests(...tests) {
  let result = rootTestType;
  for (const t of tests) {
    const testTypeImpl = t[testTypeSymbol];
    if (!testTypeImpl) throw new Error(`mergeTests() accepts "test" functions as parameters.\nDid you mean to call test.extend() with fixtures instead?`);
    // Filter out common ancestor fixtures.
    const newFixtures = testTypeImpl.fixtures.filter(theirs => !result.fixtures.find(ours => ours.fixtures === theirs.fixtures));
    result = new TestTypeImpl([...result.fixtures, ...newFixtures]);
  }
  return result.test;
}