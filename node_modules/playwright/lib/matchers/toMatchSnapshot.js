"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toHaveScreenshot = toHaveScreenshot;
exports.toHaveScreenshotStepTitle = toHaveScreenshotStepTitle;
exports.toMatchSnapshot = toMatchSnapshot;
var _globals = require("../common/globals");
var _utils = require("playwright-core/lib/utils");
var _util = require("../util");
var _utilsBundle = require("playwright-core/lib/utilsBundle");
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
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

const snapshotNamesSymbol = Symbol('snapshotNames');
class SnapshotHelper {
  constructor(testInfo, matcherName, locator, snapshotPathResolver, anonymousSnapshotExtension, configOptions, nameOrOptions, optOptions) {
    var _mime$getType;
    this.testInfo = void 0;
    this.snapshotName = void 0;
    this.legacyExpectedPath = void 0;
    this.previousPath = void 0;
    this.snapshotPath = void 0;
    this.actualPath = void 0;
    this.diffPath = void 0;
    this.mimeType = void 0;
    this.kind = void 0;
    this.updateSnapshots = void 0;
    this.comparatorOptions = void 0;
    this.comparator = void 0;
    this.allOptions = void 0;
    this.matcherName = void 0;
    this.locator = void 0;
    let options;
    let name;
    if (Array.isArray(nameOrOptions) || typeof nameOrOptions === 'string') {
      name = nameOrOptions;
      options = optOptions;
    } else {
      name = nameOrOptions.name;
      options = {
        ...nameOrOptions
      };
      delete options.name;
    }
    let snapshotNames = testInfo[snapshotNamesSymbol];
    if (!testInfo[snapshotNamesSymbol]) {
      snapshotNames = {
        anonymousSnapshotIndex: 0,
        namedSnapshotIndex: {}
      };
      testInfo[snapshotNamesSymbol] = snapshotNames;
    }

    // Consider the use case below. We should save actual to different paths.
    //
    //   expect.toMatchSnapshot('a.png')
    //   // noop
    //   expect.toMatchSnapshot('a.png')

    let actualModifier = '';
    if (!name) {
      const fullTitleWithoutSpec = [...testInfo.titlePath.slice(1), ++snapshotNames.anonymousSnapshotIndex].join(' ');
      name = (0, _utils.sanitizeForFilePath)((0, _util.trimLongString)(fullTitleWithoutSpec)) + '.' + anonymousSnapshotExtension;
      this.snapshotName = name;
    } else {
      const joinedName = Array.isArray(name) ? name.join(_path.default.sep) : name;
      snapshotNames.namedSnapshotIndex[joinedName] = (snapshotNames.namedSnapshotIndex[joinedName] || 0) + 1;
      const index = snapshotNames.namedSnapshotIndex[joinedName];
      if (index > 1) {
        actualModifier = `-${index - 1}`;
        this.snapshotName = `${joinedName}-${index - 1}`;
      } else {
        this.snapshotName = joinedName;
      }
    }
    options = {
      ...configOptions,
      ...options
    };
    if (options.maxDiffPixels !== undefined && options.maxDiffPixels < 0) throw new Error('`maxDiffPixels` option value must be non-negative integer');
    if (options.maxDiffPixelRatio !== undefined && (options.maxDiffPixelRatio < 0 || options.maxDiffPixelRatio > 1)) throw new Error('`maxDiffPixelRatio` option value must be between 0 and 1');

    // sanitizes path if string
    const inputPathSegments = Array.isArray(name) ? name : [(0, _util.addSuffixToFilePath)(name, '', undefined, true)];
    const outputPathSegments = Array.isArray(name) ? name : [(0, _util.addSuffixToFilePath)(name, actualModifier, undefined, true)];
    this.snapshotPath = snapshotPathResolver(...inputPathSegments);
    const inputFile = testInfo._getOutputPath(...inputPathSegments);
    const outputFile = testInfo._getOutputPath(...outputPathSegments);
    this.legacyExpectedPath = (0, _util.addSuffixToFilePath)(inputFile, '-expected');
    this.previousPath = (0, _util.addSuffixToFilePath)(outputFile, '-previous');
    this.actualPath = (0, _util.addSuffixToFilePath)(outputFile, '-actual');
    this.diffPath = (0, _util.addSuffixToFilePath)(outputFile, '-diff');
    this.matcherName = matcherName;
    this.locator = locator;
    this.updateSnapshots = testInfo.config.updateSnapshots;
    if (this.updateSnapshots === 'missing' && testInfo.retry < testInfo.project.retries) this.updateSnapshots = 'none';
    this.mimeType = (_mime$getType = _utilsBundle.mime.getType(_path.default.basename(this.snapshotPath))) !== null && _mime$getType !== void 0 ? _mime$getType : 'application/octet-string';
    this.comparator = (0, _utils.getComparator)(this.mimeType);
    this.testInfo = testInfo;
    this.allOptions = options;
    this.comparatorOptions = {
      maxDiffPixels: options.maxDiffPixels,
      maxDiffPixelRatio: options.maxDiffPixelRatio,
      threshold: options.threshold,
      _comparator: options._comparator
    };
    this.kind = this.mimeType.startsWith('image/') ? 'Screenshot' : 'Snapshot';
  }
  createMatcherResult(message, pass, log) {
    const unfiltered = {
      name: this.matcherName,
      expected: this.snapshotPath,
      actual: this.actualPath,
      diff: this.diffPath,
      pass,
      message: () => message,
      log
    };
    return Object.fromEntries(Object.entries(unfiltered).filter(([_, v]) => v !== undefined));
  }
  handleMissingNegated() {
    const isWriteMissingMode = this.updateSnapshots === 'all' || this.updateSnapshots === 'missing';
    const message = `A snapshot doesn't exist at ${this.snapshotPath}${isWriteMissingMode ? ', matchers using ".not" won\'t write them automatically.' : '.'}`;
    // NOTE: 'isNot' matcher implies inversed value.
    return this.createMatcherResult(message, true);
  }
  handleDifferentNegated() {
    // NOTE: 'isNot' matcher implies inversed value.
    return this.createMatcherResult('', false);
  }
  handleMatchingNegated() {
    const message = [_utilsBundle.colors.red(`${this.kind} comparison failed:`), '', indent('Expected result should be different from the actual one.', '  ')].join('\n');
    // NOTE: 'isNot' matcher implies inversed value.
    return this.createMatcherResult(message, true);
  }
  handleMissing(actual) {
    const isWriteMissingMode = this.updateSnapshots === 'all' || this.updateSnapshots === 'missing';
    if (isWriteMissingMode) {
      writeFileSync(this.snapshotPath, actual);
      writeFileSync(this.actualPath, actual);
      this.testInfo.attachments.push({
        name: (0, _util.addSuffixToFilePath)(this.snapshotName, '-actual'),
        contentType: this.mimeType,
        path: this.actualPath
      });
    }
    const message = `A snapshot doesn't exist at ${this.snapshotPath}${isWriteMissingMode ? ', writing actual.' : '.'}`;
    if (this.updateSnapshots === 'all') {
      /* eslint-disable no-console */
      console.log(message);
      return this.createMatcherResult(message, true);
    }
    if (this.updateSnapshots === 'missing') {
      this.testInfo._failWithError((0, _util.serializeError)(new Error(message)), false /* isHardError */);
      return this.createMatcherResult('', true);
    }
    return this.createMatcherResult(message, false);
  }
  handleDifferent(actual, expected, previous, diff, diffError, log, title = `${this.kind} comparison failed:`) {
    const output = [_utilsBundle.colors.red(title), ''];
    if (diffError) output.push(indent(diffError, '  '));
    if (expected !== undefined) {
      // Copy the expectation inside the `test-results/` folder for backwards compatibility,
      // so that one can upload `test-results/` directory and have all the data inside.
      writeFileSync(this.legacyExpectedPath, expected);
      this.testInfo.attachments.push({
        name: (0, _util.addSuffixToFilePath)(this.snapshotName, '-expected'),
        contentType: this.mimeType,
        path: this.snapshotPath
      });
      output.push(`\nExpected: ${_utilsBundle.colors.yellow(this.snapshotPath)}`);
    }
    if (previous !== undefined) {
      writeFileSync(this.previousPath, previous);
      this.testInfo.attachments.push({
        name: (0, _util.addSuffixToFilePath)(this.snapshotName, '-previous'),
        contentType: this.mimeType,
        path: this.previousPath
      });
      output.push(`Previous: ${_utilsBundle.colors.yellow(this.previousPath)}`);
    }
    if (actual !== undefined) {
      writeFileSync(this.actualPath, actual);
      this.testInfo.attachments.push({
        name: (0, _util.addSuffixToFilePath)(this.snapshotName, '-actual'),
        contentType: this.mimeType,
        path: this.actualPath
      });
      output.push(`Received: ${_utilsBundle.colors.yellow(this.actualPath)}`);
    }
    if (diff !== undefined) {
      writeFileSync(this.diffPath, diff);
      this.testInfo.attachments.push({
        name: (0, _util.addSuffixToFilePath)(this.snapshotName, '-diff'),
        contentType: this.mimeType,
        path: this.diffPath
      });
      output.push(`    Diff: ${_utilsBundle.colors.yellow(this.diffPath)}`);
    }
    if (log !== null && log !== void 0 && log.length) output.push((0, _util.callLogText)(log));else output.push('');
    return this.createMatcherResult(output.join('\n'), false, log);
  }
  handleMatching() {
    return this.createMatcherResult('', true);
  }
}
function toMatchSnapshot(received, nameOrOptions = {}, optOptions = {}) {
  var _testInfo$_projectInt;
  const testInfo = (0, _globals.currentTestInfo)();
  if (!testInfo) throw new Error(`toMatchSnapshot() must be called during the test`);
  if (received instanceof Promise) throw new Error('An unresolved Promise was passed to toMatchSnapshot(), make sure to resolve it by adding await to it.');
  if (testInfo._configInternal.ignoreSnapshots) return {
    pass: !this.isNot,
    message: () => '',
    name: 'toMatchSnapshot',
    expected: nameOrOptions
  };
  const helper = new SnapshotHelper(testInfo, 'toMatchSnapshot', undefined, testInfo.snapshotPath.bind(testInfo), determineFileExtension(received), ((_testInfo$_projectInt = testInfo._projectInternal.expect) === null || _testInfo$_projectInt === void 0 ? void 0 : _testInfo$_projectInt.toMatchSnapshot) || {}, nameOrOptions, optOptions);
  if (this.isNot) {
    if (!_fs.default.existsSync(helper.snapshotPath)) return helper.handleMissingNegated();
    const isDifferent = !!helper.comparator(received, _fs.default.readFileSync(helper.snapshotPath), helper.comparatorOptions);
    return isDifferent ? helper.handleDifferentNegated() : helper.handleMatchingNegated();
  }
  if (!_fs.default.existsSync(helper.snapshotPath)) return helper.handleMissing(received);
  const expected = _fs.default.readFileSync(helper.snapshotPath);
  const result = helper.comparator(received, expected, helper.comparatorOptions);
  if (!result) return helper.handleMatching();
  if (helper.updateSnapshots === 'all') {
    writeFileSync(helper.snapshotPath, received);
    /* eslint-disable no-console */
    console.log(helper.snapshotPath + ' does not match, writing actual.');
    return helper.createMatcherResult(helper.snapshotPath + ' running with --update-snapshots, writing actual.', true);
  }
  return helper.handleDifferent(received, expected, undefined, result.diff, result.errorMessage, undefined);
}
function toHaveScreenshotStepTitle(nameOrOptions = {}, optOptions = {}) {
  let name;
  if (typeof nameOrOptions === 'object' && !Array.isArray(nameOrOptions)) name = nameOrOptions.name;else name = nameOrOptions;
  return Array.isArray(name) ? name.join(_path.default.sep) : name || '';
}
async function toHaveScreenshot(pageOrLocator, nameOrOptions = {}, optOptions = {}) {
  var _testInfo$_projectInt2, _config$animations, _config$scale, _config$caret;
  const testInfo = (0, _globals.currentTestInfo)();
  if (!testInfo) throw new Error(`toHaveScreenshot() must be called during the test`);
  if (testInfo._configInternal.ignoreSnapshots) return {
    pass: !this.isNot,
    message: () => '',
    name: 'toHaveScreenshot',
    expected: nameOrOptions
  };
  (0, _util.expectTypes)(pageOrLocator, ['Page', 'Locator'], 'toHaveScreenshot');
  const [page, locator] = pageOrLocator.constructor.name === 'Page' ? [pageOrLocator, undefined] : [pageOrLocator.page(), pageOrLocator];
  const config = (_testInfo$_projectInt2 = testInfo._projectInternal.expect) === null || _testInfo$_projectInt2 === void 0 ? void 0 : _testInfo$_projectInt2.toHaveScreenshot;
  const snapshotPathResolver = testInfo.snapshotPath.bind(testInfo);
  const helper = new SnapshotHelper(testInfo, 'toHaveScreenshot', locator, snapshotPathResolver, 'png', {
    _comparator: config === null || config === void 0 ? void 0 : config._comparator,
    maxDiffPixels: config === null || config === void 0 ? void 0 : config.maxDiffPixels,
    maxDiffPixelRatio: config === null || config === void 0 ? void 0 : config.maxDiffPixelRatio,
    threshold: config === null || config === void 0 ? void 0 : config.threshold
  }, nameOrOptions, optOptions);
  if (!helper.snapshotPath.toLowerCase().endsWith('.png')) throw new Error(`Screenshot name "${_path.default.basename(helper.snapshotPath)}" must have '.png' extension`);
  (0, _util.expectTypes)(pageOrLocator, ['Page', 'Locator'], 'toHaveScreenshot');
  const screenshotOptions = {
    animations: (_config$animations = config === null || config === void 0 ? void 0 : config.animations) !== null && _config$animations !== void 0 ? _config$animations : 'disabled',
    scale: (_config$scale = config === null || config === void 0 ? void 0 : config.scale) !== null && _config$scale !== void 0 ? _config$scale : 'css',
    caret: (_config$caret = config === null || config === void 0 ? void 0 : config.caret) !== null && _config$caret !== void 0 ? _config$caret : 'hide',
    ...helper.allOptions,
    mask: helper.allOptions.mask || [],
    maskColor: helper.allOptions.maskColor,
    name: undefined,
    threshold: undefined,
    maxDiffPixels: undefined,
    maxDiffPixelRatio: undefined
  };
  const hasSnapshot = _fs.default.existsSync(helper.snapshotPath);
  if (this.isNot) {
    if (!hasSnapshot) return helper.handleMissingNegated();

    // Having `errorMessage` means we timed out while waiting
    // for screenshots not to match, so screenshots
    // are actually the same in the end.
    const isDifferent = !(await page._expectScreenshot({
      expected: await _fs.default.promises.readFile(helper.snapshotPath),
      isNot: true,
      locator,
      comparatorOptions: {
        ...helper.comparatorOptions,
        comparator: helper.comparatorOptions._comparator
      },
      screenshotOptions,
      timeout: (0, _globals.currentExpectTimeout)(helper.allOptions)
    })).errorMessage;
    return isDifferent ? helper.handleDifferentNegated() : helper.handleMatchingNegated();
  }

  // Fast path: there's no screenshot and we don't intend to update it.
  if (helper.updateSnapshots === 'none' && !hasSnapshot) return helper.createMatcherResult(`A snapshot doesn't exist at ${helper.snapshotPath}.`, false);
  if (!hasSnapshot) {
    // Regenerate a new screenshot by waiting until two screenshots are the same.
    const timeout = (0, _globals.currentExpectTimeout)(helper.allOptions);
    const {
      actual,
      previous,
      diff,
      errorMessage,
      log
    } = await page._expectScreenshot({
      expected: undefined,
      isNot: false,
      locator,
      comparatorOptions: {
        ...helper.comparatorOptions,
        comparator: helper.comparatorOptions._comparator
      },
      screenshotOptions,
      timeout
    });
    // We tried re-generating new snapshot but failed.
    // This can be due to e.g. spinning animation, so we want to show it as a diff.
    if (errorMessage) return helper.handleDifferent(actual, undefined, previous, diff, undefined, log, errorMessage);

    // We successfully generated new screenshot.
    return helper.handleMissing(actual);
  }

  // General case:
  // - snapshot exists
  // - regular matcher (i.e. not a `.not`)
  // - perhaps an 'all' flag to update non-matching screenshots
  const expected = await _fs.default.promises.readFile(helper.snapshotPath);
  const {
    actual,
    diff,
    errorMessage,
    log
  } = await page._expectScreenshot({
    expected,
    isNot: false,
    locator,
    comparatorOptions: {
      ...helper.comparatorOptions,
      comparator: helper.comparatorOptions._comparator
    },
    screenshotOptions,
    timeout: (0, _globals.currentExpectTimeout)(helper.allOptions)
  });
  if (!errorMessage) return helper.handleMatching();
  if (helper.updateSnapshots === 'all') {
    writeFileSync(helper.snapshotPath, actual);
    writeFileSync(helper.actualPath, actual);
    /* eslint-disable no-console */
    console.log(helper.snapshotPath + ' is re-generated, writing actual.');
    return helper.createMatcherResult(helper.snapshotPath + ' running with --update-snapshots, writing actual.', true);
  }
  return helper.handleDifferent(actual, expected, undefined, diff, errorMessage, log);
}
function writeFileSync(aPath, content) {
  _fs.default.mkdirSync(_path.default.dirname(aPath), {
    recursive: true
  });
  _fs.default.writeFileSync(aPath, content);
}
function indent(lines, tab) {
  return lines.replace(/^(?=.+$)/gm, tab);
}
function determineFileExtension(file) {
  if (typeof file === 'string') return 'txt';
  if (compareMagicBytes(file, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (compareMagicBytes(file, [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01])) return 'jpg';
  return 'dat';
}
function compareMagicBytes(file, magicBytes) {
  return Buffer.compare(Buffer.from(magicBytes), file.slice(0, magicBytes.length)) === 0;
}