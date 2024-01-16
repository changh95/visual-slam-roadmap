"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._baseTest = void 0;
Object.defineProperty(exports, "_store", {
  enumerable: true,
  get: function () {
    return _store.store;
  }
});
exports.default = void 0;
Object.defineProperty(exports, "defineConfig", {
  enumerable: true,
  get: function () {
    return _configLoader.defineConfig;
  }
});
Object.defineProperty(exports, "expect", {
  enumerable: true,
  get: function () {
    return _expect.expect;
  }
});
Object.defineProperty(exports, "mergeExpects", {
  enumerable: true,
  get: function () {
    return _expect.mergeExpects;
  }
});
Object.defineProperty(exports, "mergeTests", {
  enumerable: true,
  get: function () {
    return _testType.mergeTests;
  }
});
exports.test = void 0;
var fs = _interopRequireWildcard(require("fs"));
var path = _interopRequireWildcard(require("path"));
var playwrightLibrary = _interopRequireWildcard(require("playwright-core"));
var _utils = require("playwright-core/lib/utils");
var _testType = require("./common/testType");
var _globals = require("./common/globals");
var _testTracing = require("./worker/testTracing");
var _expect = require("./matchers/expect");
var _store = require("./store");
var _configLoader = require("./common/configLoader");
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

const _baseTest = exports._baseTest = _testType.rootTestType.test;
(0, _utils.addInternalStackPrefix)(path.dirname(require.resolve('../package.json')));
if (process['__pw_initiator__']) {
  const originalStackTraceLimit = Error.stackTraceLimit;
  Error.stackTraceLimit = 200;
  try {
    throw new Error('Requiring @playwright/test second time, \nFirst:\n' + process['__pw_initiator__'] + '\n\nSecond: ');
  } finally {
    Error.stackTraceLimit = originalStackTraceLimit;
  }
} else {
  process['__pw_initiator__'] = new Error().stack;
}
const playwrightFixtures = {
  defaultBrowserType: ['chromium', {
    scope: 'worker',
    option: true
  }],
  browserName: [({
    defaultBrowserType
  }, use) => use(defaultBrowserType), {
    scope: 'worker',
    option: true
  }],
  playwright: [async ({}, use) => {
    await use(require('playwright-core'));
  }, {
    scope: 'worker',
    _hideStep: true
  }],
  headless: [({
    launchOptions
  }, use) => {
    var _launchOptions$headle;
    return use((_launchOptions$headle = launchOptions.headless) !== null && _launchOptions$headle !== void 0 ? _launchOptions$headle : true);
  }, {
    scope: 'worker',
    option: true
  }],
  channel: [({
    launchOptions
  }, use) => use(launchOptions.channel), {
    scope: 'worker',
    option: true
  }],
  launchOptions: [{}, {
    scope: 'worker',
    option: true
  }],
  connectOptions: [async ({}, use) => {
    await use(connectOptionsFromEnv());
  }, {
    scope: 'worker',
    option: true
  }],
  screenshot: ['off', {
    scope: 'worker',
    option: true
  }],
  video: ['off', {
    scope: 'worker',
    option: true
  }],
  trace: ['off', {
    scope: 'worker',
    option: true
  }],
  _artifactsDir: [async ({}, use) => {
    await use(process.env.TEST_ARTIFACTS_DIR);
  }, {
    scope: 'worker',
    _title: 'playwright configuration'
  }],
  _browserOptions: [async ({
    playwright,
    headless,
    channel,
    launchOptions,
    _artifactsDir
  }, use) => {
    const options = {
      handleSIGINT: false,
      ...launchOptions
    };
    if (headless !== undefined) options.headless = headless;
    if (channel !== undefined) options.channel = channel;
    options.tracesDir = path.join(_artifactsDir, 'traces');
    for (const browserType of [playwright.chromium, playwright.firefox, playwright.webkit]) browserType._defaultLaunchOptions = options;
    await use(options);
    for (const browserType of [playwright.chromium, playwright.firefox, playwright.webkit]) browserType._defaultLaunchOptions = undefined;
  }, {
    scope: 'worker',
    auto: true
  }],
  browser: [async ({
    playwright,
    browserName,
    _browserOptions,
    connectOptions
  }, use, testInfo) => {
    if (!['chromium', 'firefox', 'webkit'].includes(browserName)) throw new Error(`Unexpected browserName "${browserName}", must be one of "chromium", "firefox" or "webkit"`);
    if (connectOptions) {
      var _connectOptions$expos;
      const browser = await playwright[browserName].connect({
        ...connectOptions,
        exposeNetwork: (_connectOptions$expos = connectOptions.exposeNetwork) !== null && _connectOptions$expos !== void 0 ? _connectOptions$expos : connectOptions._exposeNetwork,
        headers: {
          ...(process.env.PW_TEST_REUSE_CONTEXT ? {
            'x-playwright-reuse-context': '1'
          } : {}),
          // HTTP headers are ASCII only (not UTF-8).
          'x-playwright-launch-options': (0, _utils.jsonStringifyForceASCII)(_browserOptions),
          ...connectOptions.headers
        }
      });
      await use(browser);
      await browser._wrapApiCall(async () => {
        await browser.close({
          reason: 'Test ended.'
        });
      }, true);
      return;
    }
    const browser = await playwright[browserName].launch();
    await use(browser);
    await browser._wrapApiCall(async () => {
      await browser.close({
        reason: 'Test ended.'
      });
    }, true);
  }, {
    scope: 'worker',
    timeout: 0
  }],
  acceptDownloads: [({
    contextOptions
  }, use) => {
    var _contextOptions$accep;
    return use((_contextOptions$accep = contextOptions.acceptDownloads) !== null && _contextOptions$accep !== void 0 ? _contextOptions$accep : true);
  }, {
    option: true
  }],
  bypassCSP: [({
    contextOptions
  }, use) => {
    var _contextOptions$bypas;
    return use((_contextOptions$bypas = contextOptions.bypassCSP) !== null && _contextOptions$bypas !== void 0 ? _contextOptions$bypas : false);
  }, {
    option: true
  }],
  colorScheme: [({
    contextOptions
  }, use) => use(contextOptions.colorScheme === undefined ? 'light' : contextOptions.colorScheme), {
    option: true
  }],
  deviceScaleFactor: [({
    contextOptions
  }, use) => use(contextOptions.deviceScaleFactor), {
    option: true
  }],
  extraHTTPHeaders: [({
    contextOptions
  }, use) => use(contextOptions.extraHTTPHeaders), {
    option: true
  }],
  geolocation: [({
    contextOptions
  }, use) => use(contextOptions.geolocation), {
    option: true
  }],
  hasTouch: [({
    contextOptions
  }, use) => {
    var _contextOptions$hasTo;
    return use((_contextOptions$hasTo = contextOptions.hasTouch) !== null && _contextOptions$hasTo !== void 0 ? _contextOptions$hasTo : false);
  }, {
    option: true
  }],
  httpCredentials: [({
    contextOptions
  }, use) => use(contextOptions.httpCredentials), {
    option: true
  }],
  ignoreHTTPSErrors: [({
    contextOptions
  }, use) => {
    var _contextOptions$ignor;
    return use((_contextOptions$ignor = contextOptions.ignoreHTTPSErrors) !== null && _contextOptions$ignor !== void 0 ? _contextOptions$ignor : false);
  }, {
    option: true
  }],
  isMobile: [({
    contextOptions
  }, use) => {
    var _contextOptions$isMob;
    return use((_contextOptions$isMob = contextOptions.isMobile) !== null && _contextOptions$isMob !== void 0 ? _contextOptions$isMob : false);
  }, {
    option: true
  }],
  javaScriptEnabled: [({
    contextOptions
  }, use) => {
    var _contextOptions$javaS;
    return use((_contextOptions$javaS = contextOptions.javaScriptEnabled) !== null && _contextOptions$javaS !== void 0 ? _contextOptions$javaS : true);
  }, {
    option: true
  }],
  locale: [({
    contextOptions
  }, use) => {
    var _contextOptions$local;
    return use((_contextOptions$local = contextOptions.locale) !== null && _contextOptions$local !== void 0 ? _contextOptions$local : 'en-US');
  }, {
    option: true
  }],
  offline: [({
    contextOptions
  }, use) => {
    var _contextOptions$offli;
    return use((_contextOptions$offli = contextOptions.offline) !== null && _contextOptions$offli !== void 0 ? _contextOptions$offli : false);
  }, {
    option: true
  }],
  permissions: [({
    contextOptions
  }, use) => use(contextOptions.permissions), {
    option: true
  }],
  proxy: [({
    contextOptions
  }, use) => use(contextOptions.proxy), {
    option: true
  }],
  storageState: [({
    contextOptions
  }, use) => use(contextOptions.storageState), {
    option: true
  }],
  timezoneId: [({
    contextOptions
  }, use) => use(contextOptions.timezoneId), {
    option: true
  }],
  userAgent: [({
    contextOptions
  }, use) => use(contextOptions.userAgent), {
    option: true
  }],
  viewport: [({
    contextOptions
  }, use) => use(contextOptions.viewport === undefined ? {
    width: 1280,
    height: 720
  } : contextOptions.viewport), {
    option: true
  }],
  actionTimeout: [0, {
    option: true
  }],
  testIdAttribute: ['data-testid', {
    option: true
  }],
  navigationTimeout: [0, {
    option: true
  }],
  baseURL: [async ({}, use) => {
    await use(process.env.PLAYWRIGHT_TEST_BASE_URL);
  }, {
    option: true
  }],
  serviceWorkers: [({
    contextOptions
  }, use) => {
    var _contextOptions$servi;
    return use((_contextOptions$servi = contextOptions.serviceWorkers) !== null && _contextOptions$servi !== void 0 ? _contextOptions$servi : 'allow');
  }, {
    option: true
  }],
  contextOptions: [{}, {
    option: true
  }],
  _combinedContextOptions: async ({
    acceptDownloads,
    bypassCSP,
    colorScheme,
    deviceScaleFactor,
    extraHTTPHeaders,
    hasTouch,
    geolocation,
    httpCredentials,
    ignoreHTTPSErrors,
    isMobile,
    javaScriptEnabled,
    locale,
    offline,
    permissions,
    proxy,
    storageState,
    viewport,
    timezoneId,
    userAgent,
    baseURL,
    contextOptions,
    serviceWorkers
  }, use) => {
    const options = {};
    if (acceptDownloads !== undefined) options.acceptDownloads = acceptDownloads;
    if (bypassCSP !== undefined) options.bypassCSP = bypassCSP;
    if (colorScheme !== undefined) options.colorScheme = colorScheme;
    if (deviceScaleFactor !== undefined) options.deviceScaleFactor = deviceScaleFactor;
    if (extraHTTPHeaders !== undefined) options.extraHTTPHeaders = extraHTTPHeaders;
    if (geolocation !== undefined) options.geolocation = geolocation;
    if (hasTouch !== undefined) options.hasTouch = hasTouch;
    if (httpCredentials !== undefined) options.httpCredentials = httpCredentials;
    if (ignoreHTTPSErrors !== undefined) options.ignoreHTTPSErrors = ignoreHTTPSErrors;
    if (isMobile !== undefined) options.isMobile = isMobile;
    if (javaScriptEnabled !== undefined) options.javaScriptEnabled = javaScriptEnabled;
    if (locale !== undefined) options.locale = locale;
    if (offline !== undefined) options.offline = offline;
    if (permissions !== undefined) options.permissions = permissions;
    if (proxy !== undefined) options.proxy = proxy;
    if (storageState !== undefined) options.storageState = storageState;
    if (timezoneId !== undefined) options.timezoneId = timezoneId;
    if (userAgent !== undefined) options.userAgent = userAgent;
    if (viewport !== undefined) options.viewport = viewport;
    if (baseURL !== undefined) options.baseURL = baseURL;
    if (serviceWorkers !== undefined) options.serviceWorkers = serviceWorkers;
    await use({
      ...contextOptions,
      ...options
    });
  },
  _setupContextOptions: [async ({
    playwright,
    _combinedContextOptions,
    _artifactsDir,
    actionTimeout,
    navigationTimeout,
    testIdAttribute
  }, use, testInfo) => {
    if (testIdAttribute) playwrightLibrary.selectors.setTestIdAttribute(testIdAttribute);
    testInfo.snapshotSuffix = process.platform;
    if ((0, _utils.debugMode)()) testInfo.setTimeout(0);
    for (const browserType of [playwright.chromium, playwright.firefox, playwright.webkit]) {
      browserType._defaultContextOptions = _combinedContextOptions;
      browserType._defaultContextTimeout = actionTimeout || 0;
      browserType._defaultContextNavigationTimeout = navigationTimeout || 0;
    }
    playwright.request._defaultContextOptions = {
      ..._combinedContextOptions
    };
    playwright.request._defaultContextOptions.tracesDir = path.join(_artifactsDir, 'traces');
    playwright.request._defaultContextOptions.timeout = actionTimeout || 0;
    await use();
    playwright.request._defaultContextOptions = undefined;
    for (const browserType of [playwright.chromium, playwright.firefox, playwright.webkit]) {
      browserType._defaultContextOptions = undefined;
      browserType._defaultContextTimeout = undefined;
      browserType._defaultContextNavigationTimeout = undefined;
    }
  }, {
    auto: 'all-hooks-included',
    _title: 'context configuration'
  }],
  _setupArtifacts: [async ({
    playwright,
    _artifactsDir,
    trace,
    screenshot
  }, use, testInfo) => {
    const artifactsRecorder = new ArtifactsRecorder(playwright, _artifactsDir, trace, screenshot);
    await artifactsRecorder.willStartTest(testInfo);
    const csiListener = {
      onApiCallBegin: (apiName, params, frames, wallTime, userData) => {
        const testInfo = (0, _globals.currentTestInfo)();
        if (!testInfo || apiName.startsWith('expect.') || apiName.includes('setTestIdAttribute')) return {
          userObject: null
        };
        const step = testInfo._addStep({
          location: frames[0],
          category: 'pw:api',
          title: renderApiCall(apiName, params),
          apiName,
          params,
          wallTime,
          laxParent: true
        });
        userData.userObject = step;
      },
      onApiCallEnd: (userData, error) => {
        const step = userData.userObject;
        step === null || step === void 0 ? void 0 : step.complete({
          error
        });
      },
      onWillPause: () => {
        var _currentTestInfo;
        (_currentTestInfo = (0, _globals.currentTestInfo)()) === null || _currentTestInfo === void 0 ? void 0 : _currentTestInfo.setTimeout(0);
      },
      onDidCreateBrowserContext: async context => {
        await (artifactsRecorder === null || artifactsRecorder === void 0 ? void 0 : artifactsRecorder.didCreateBrowserContext(context));
        const testInfo = (0, _globals.currentTestInfo)();
        if (testInfo) attachConnectedHeaderIfNeeded(testInfo, context.browser());
      },
      onDidCreateRequestContext: async context => {
        await (artifactsRecorder === null || artifactsRecorder === void 0 ? void 0 : artifactsRecorder.didCreateRequestContext(context));
      },
      onWillCloseBrowserContext: async context => {
        await (artifactsRecorder === null || artifactsRecorder === void 0 ? void 0 : artifactsRecorder.willCloseBrowserContext(context));
      },
      onWillCloseRequestContext: async context => {
        await (artifactsRecorder === null || artifactsRecorder === void 0 ? void 0 : artifactsRecorder.willCloseRequestContext(context));
      }
    };
    const clientInstrumentation = playwright._instrumentation;
    clientInstrumentation.addListener(csiListener);
    await use();
    clientInstrumentation.removeListener(csiListener);
    await (artifactsRecorder === null || artifactsRecorder === void 0 ? void 0 : artifactsRecorder.didFinishTest());
  }, {
    auto: 'all-hooks-included',
    _title: 'trace recording'
  }],
  _contextFactory: [async ({
    browser,
    video,
    _artifactsDir,
    _reuseContext
  }, use, testInfo) => {
    const testInfoImpl = testInfo;
    const videoMode = normalizeVideoMode(video);
    const captureVideo = shouldCaptureVideo(videoMode, testInfo) && !_reuseContext;
    const contexts = new Map();
    await use(async options => {
      const hook = hookType(testInfoImpl);
      if (hook) {
        throw new Error([`"context" and "page" fixtures are not supported in "${hook}" since they are created on a per-test basis.`, `If you would like to reuse a single page between tests, create context manually with browser.newContext(). See https://aka.ms/playwright/reuse-page for details.`, `If you would like to configure your page before each test, do that in beforeEach hook instead.`].join('\n'));
      }
      const videoOptions = captureVideo ? {
        recordVideo: {
          dir: _artifactsDir,
          size: typeof video === 'string' ? undefined : video.size
        }
      } : {};
      const context = await browser.newContext({
        ...videoOptions,
        ...options
      });
      const contextData = {
        pagesWithVideo: []
      };
      contexts.set(context, contextData);
      if (captureVideo) context.on('page', page => contextData.pagesWithVideo.push(page));
      return context;
    });
    let counter = 0;
    const closeReason = testInfo.status === 'timedOut' ? 'Test timeout of ' + testInfo.timeout + 'ms exceeded.' : 'Test ended.';
    await Promise.all([...contexts.keys()].map(async context => {
      context[kStartedContextTearDown] = true;
      await context._wrapApiCall(async () => {
        await context.close({
          reason: closeReason
        });
      }, true);
      const testFailed = testInfo.status !== testInfo.expectedStatus;
      const preserveVideo = captureVideo && (videoMode === 'on' || testFailed && videoMode === 'retain-on-failure' || videoMode === 'on-first-retry' && testInfo.retry === 1);
      if (preserveVideo) {
        const {
          pagesWithVideo: pagesForVideo
        } = contexts.get(context);
        const videos = pagesForVideo.map(p => p.video()).filter(Boolean);
        await Promise.all(videos.map(async v => {
          try {
            const savedPath = testInfo.outputPath(`video${counter ? '-' + counter : ''}.webm`);
            ++counter;
            await v.saveAs(savedPath);
            testInfo.attachments.push({
              name: 'video',
              path: savedPath,
              contentType: 'video/webm'
            });
          } catch (e) {
            // Silent catch empty videos.
          }
        }));
      }
    }));
  }, {
    scope: 'test',
    _title: 'context'
  }],
  _contextReuseMode: process.env.PW_TEST_REUSE_CONTEXT === 'when-possible' ? 'when-possible' : process.env.PW_TEST_REUSE_CONTEXT ? 'force' : 'none',
  _reuseContext: [async ({
    video,
    _contextReuseMode
  }, use, testInfo) => {
    const reuse = _contextReuseMode === 'force' || _contextReuseMode === 'when-possible' && !shouldCaptureVideo(normalizeVideoMode(video), testInfo);
    await use(reuse);
  }, {
    scope: 'test',
    _title: 'context'
  }],
  context: async ({
    playwright,
    browser,
    _reuseContext,
    _contextFactory
  }, use, testInfo) => {
    attachConnectedHeaderIfNeeded(testInfo, browser);
    if (!_reuseContext) {
      await use(await _contextFactory());
      return;
    }
    const defaultContextOptions = playwright.chromium._defaultContextOptions;
    const context = await browser._newContextForReuse(defaultContextOptions);
    context[kIsReusedContext] = true;
    await use(context);
    const closeReason = testInfo.status === 'timedOut' ? 'Test timeout of ' + testInfo.timeout + 'ms exceeded.' : 'Test ended.';
    await browser._stopPendingOperations(closeReason);
  },
  page: async ({
    context,
    _reuseContext
  }, use) => {
    if (!_reuseContext) {
      await use(await context.newPage());
      return;
    }

    // First time we are reusing the context, we should create the page.
    let [page] = context.pages();
    if (!page) page = await context.newPage();
    await use(page);
  },
  request: async ({
    playwright
  }, use) => {
    const request = await playwright.request.newContext();
    await use(request);
    request[kStartedContextTearDown] = true;
    await request.dispose();
  }
};
function hookType(testInfo) {
  const type = testInfo._timeoutManager.currentRunnableType();
  if (type === 'beforeAll' || type === 'afterAll') return type;
}
function normalizeVideoMode(video) {
  if (!video) return 'off';
  let videoMode = typeof video === 'string' ? video : video.mode;
  if (videoMode === 'retry-with-video') videoMode = 'on-first-retry';
  return videoMode;
}
function shouldCaptureVideo(videoMode, testInfo) {
  return videoMode === 'on' || videoMode === 'retain-on-failure' || videoMode === 'on-first-retry' && testInfo.retry === 1;
}
function normalizeTraceMode(trace) {
  if (!trace) return 'off';
  let traceMode = typeof trace === 'string' ? trace : trace.mode;
  if (traceMode === 'retry-with-trace') traceMode = 'on-first-retry';
  return traceMode;
}
function shouldCaptureTrace(traceMode, testInfo) {
  return traceMode === 'on' || traceMode === 'retain-on-failure' || traceMode === 'on-first-retry' && testInfo.retry === 1 || traceMode === 'on-all-retries' && testInfo.retry > 0;
}
function normalizeScreenshotMode(screenshot) {
  if (!screenshot) return 'off';
  return typeof screenshot === 'string' ? screenshot : screenshot.mode;
}
function attachConnectedHeaderIfNeeded(testInfo, browser) {
  const connectHeaders = browser === null || browser === void 0 ? void 0 : browser._connectHeaders;
  if (!connectHeaders) return;
  for (const header of connectHeaders) {
    if (header.name !== 'x-playwright-attachment') continue;
    const [name, value] = header.value.split('=');
    if (!name || !value) continue;
    if (testInfo.attachments.some(attachment => attachment.name === name)) continue;
    testInfo.attachments.push({
      name,
      contentType: 'text/plain',
      body: Buffer.from(value)
    });
  }
}
const kTracingStarted = Symbol('kTracingStarted');
const kIsReusedContext = Symbol('kReusedContext');
const kStartedContextTearDown = Symbol('kStartedContextTearDown');
let traceOrdinal = 0;
function connectOptionsFromEnv() {
  const wsEndpoint = process.env.PW_TEST_CONNECT_WS_ENDPOINT;
  if (!wsEndpoint) return undefined;
  const headers = process.env.PW_TEST_CONNECT_HEADERS ? JSON.parse(process.env.PW_TEST_CONNECT_HEADERS) : undefined;
  return {
    wsEndpoint,
    headers,
    exposeNetwork: process.env.PW_TEST_CONNECT_EXPOSE_NETWORK
  };
}
class ArtifactsRecorder {
  constructor(playwright, artifactsDir, trace, screenshot) {
    this._testInfo = void 0;
    this._playwright = void 0;
    this._artifactsDir = void 0;
    this._screenshotMode = void 0;
    this._traceMode = void 0;
    this._captureTrace = false;
    this._screenshotOptions = void 0;
    this._traceOptions = void 0;
    this._temporaryTraceFiles = [];
    this._temporaryScreenshots = [];
    this._temporaryArtifacts = [];
    this._reusedContexts = new Set();
    this._screenshotOrdinal = 0;
    this._screenshottedSymbol = void 0;
    this._startedCollectingArtifacts = void 0;
    this._playwright = playwright;
    this._artifactsDir = artifactsDir;
    this._screenshotMode = normalizeScreenshotMode(screenshot);
    this._screenshotOptions = typeof screenshot === 'string' ? undefined : screenshot;
    this._traceMode = normalizeTraceMode(trace);
    const defaultTraceOptions = {
      screenshots: true,
      snapshots: true,
      sources: true,
      attachments: true,
      _live: false
    };
    this._traceOptions = typeof trace === 'string' ? defaultTraceOptions : {
      ...defaultTraceOptions,
      ...trace,
      mode: undefined
    };
    this._screenshottedSymbol = Symbol('screenshotted');
    this._startedCollectingArtifacts = Symbol('startedCollectingArtifacts');
  }
  _createTemporaryArtifact(...name) {
    const file = path.join(this._artifactsDir, ...name);
    this._temporaryArtifacts.push(file);
    return file;
  }
  async willStartTest(testInfo) {
    this._testInfo = testInfo;
    testInfo._onDidFinishTestFunction = () => this.didFinishTestFunction();
    this._captureTrace = shouldCaptureTrace(this._traceMode, testInfo) && !process.env.PW_TEST_DISABLE_TRACING;
    if (this._captureTrace) this._testInfo._tracing.start(this._createTemporaryArtifact('traces', `${this._testInfo.testId}-test.trace`), this._traceOptions);

    // Since beforeAll(s), test and afterAll(s) reuse the same TestInfo, make sure we do not
    // overwrite previous screenshots.
    this._screenshotOrdinal = testInfo.attachments.filter(a => a.name === 'screenshot').length;

    // Process existing contexts.
    for (const browserType of [this._playwright.chromium, this._playwright.firefox, this._playwright.webkit]) {
      const promises = [];
      const existingContexts = Array.from(browserType._contexts);
      for (const context of existingContexts) {
        if (context[kIsReusedContext]) this._reusedContexts.add(context);else promises.push(this.didCreateBrowserContext(context));
      }
      await Promise.all(promises);
    }
    {
      const existingApiRequests = Array.from(this._playwright.request._contexts);
      await Promise.all(existingApiRequests.map(c => this.didCreateRequestContext(c)));
    }
  }
  async didCreateBrowserContext(context) {
    await this._startTraceChunkOnContextCreation(context.tracing);
  }
  async willCloseBrowserContext(context) {
    // When reusing context, we get all previous contexts closed at the start of next test.
    // Do not record empty traces and useless screenshots for them.
    if (this._reusedContexts.has(context)) return;
    await this._stopTracing(context.tracing, context[kStartedContextTearDown]);
    if (this._screenshotMode === 'on' || this._screenshotMode === 'only-on-failure') {
      // Capture screenshot for now. We'll know whether we have to preserve them
      // after the test finishes.
      await Promise.all(context.pages().map(page => this._screenshotPage(page, true)));
    }
  }
  async didCreateRequestContext(context) {
    const tracing = context._tracing;
    await this._startTraceChunkOnContextCreation(tracing);
  }
  async willCloseRequestContext(context) {
    const tracing = context._tracing;
    await this._stopTracing(tracing, context[kStartedContextTearDown]);
  }
  async didFinishTestFunction() {
    const captureScreenshots = this._screenshotMode === 'on' || this._screenshotMode === 'only-on-failure' && this._testInfo._isFailure();
    if (captureScreenshots) await this._screenshotOnTestFailure();
  }
  async didFinishTest() {
    const captureScreenshots = this._screenshotMode === 'on' || this._screenshotMode === 'only-on-failure' && this._testInfo._isFailure();
    if (captureScreenshots) await this._screenshotOnTestFailure();
    const leftoverContexts = [];
    for (const browserType of [this._playwright.chromium, this._playwright.firefox, this._playwright.webkit]) leftoverContexts.push(...browserType._contexts);
    const leftoverApiRequests = Array.from(this._playwright.request._contexts);

    // Collect traces/screenshots for remaining contexts.
    await Promise.all(leftoverContexts.map(async context => {
      await this._stopTracing(context.tracing, true);
    }).concat(leftoverApiRequests.map(async context => {
      const tracing = context._tracing;
      await this._stopTracing(tracing, true);
    })));

    // Attach temporary screenshots for contexts closed before collecting the test trace.
    if (captureScreenshots) {
      for (const file of this._temporaryScreenshots) {
        try {
          const screenshotPath = this._createScreenshotAttachmentPath();
          await fs.promises.rename(file, screenshotPath);
          this._attachScreenshot(screenshotPath);
        } catch {}
      }
    }

    // Collect test trace.
    if (this._preserveTrace()) {
      const tracePath = this._createTemporaryArtifact((0, _utils.createGuid)() + '.zip');
      this._temporaryTraceFiles.push(tracePath);
      await this._testInfo._tracing.stop(tracePath);
    }

    // Either remove or attach temporary traces for contexts closed before the
    // test has finished.
    if (this._preserveTrace() && this._temporaryTraceFiles.length) {
      const tracePath = this._testInfo.outputPath(`trace.zip`);
      // This could be: beforeHooks, or beforeHooks + test, etc.
      const beforeHooksHadTrace = fs.existsSync(tracePath);
      if (beforeHooksHadTrace) {
        await fs.promises.rename(tracePath, tracePath + '.tmp');
        this._temporaryTraceFiles.unshift(tracePath + '.tmp');
      }
      await (0, _testTracing.mergeTraceFiles)(tracePath, this._temporaryTraceFiles);
      // Do not add attachment twice.
      if (!beforeHooksHadTrace) this._testInfo.attachments.push({
        name: 'trace',
        path: tracePath,
        contentType: 'application/zip'
      });
    }
    for (const file of this._temporaryArtifacts) await fs.promises.unlink(file).catch(() => {});
  }
  _createScreenshotAttachmentPath() {
    const testFailed = this._testInfo._isFailure();
    const index = this._screenshotOrdinal + 1;
    ++this._screenshotOrdinal;
    const screenshotPath = this._testInfo.outputPath(`test-${testFailed ? 'failed' : 'finished'}-${index}.png`);
    return screenshotPath;
  }
  async _screenshotPage(page, temporary) {
    if (page[this._screenshottedSymbol]) return;
    page[this._screenshottedSymbol] = true;
    try {
      const screenshotPath = temporary ? this._createTemporaryArtifact((0, _utils.createGuid)() + '.png') : this._createScreenshotAttachmentPath();
      // Pass caret=initial to avoid any evaluations that might slow down the screenshot
      // and let the page modify itself from the problematic state it had at the moment of failure.
      await page.screenshot({
        ...this._screenshotOptions,
        timeout: 5000,
        path: screenshotPath,
        caret: 'initial'
      });
      if (temporary) this._temporaryScreenshots.push(screenshotPath);else this._attachScreenshot(screenshotPath);
    } catch {
      // Screenshot may fail, just ignore.
    }
  }
  _attachScreenshot(screenshotPath) {
    this._testInfo.attachments.push({
      name: 'screenshot',
      path: screenshotPath,
      contentType: 'image/png'
    });
  }
  async _screenshotOnTestFailure() {
    const contexts = [];
    for (const browserType of [this._playwright.chromium, this._playwright.firefox, this._playwright.webkit]) contexts.push(...browserType._contexts);
    const pages = contexts.map(ctx => ctx.pages()).flat();
    await Promise.all(pages.map(page => this._screenshotPage(page, false)));
  }
  async _startTraceChunkOnContextCreation(tracing) {
    if (this._captureTrace) {
      const title = [path.relative(this._testInfo.project.testDir, this._testInfo.file) + ':' + this._testInfo.line, ...this._testInfo.titlePath.slice(1)].join(' › ');
      const ordinalSuffix = traceOrdinal ? `-context${traceOrdinal}` : '';
      ++traceOrdinal;
      const retrySuffix = this._testInfo.retry ? `-retry${this._testInfo.retry}` : '';
      // Note that trace name must start with testId for live tracing to work.
      const name = `${this._testInfo.testId}${retrySuffix}${ordinalSuffix}`;
      if (!tracing[kTracingStarted]) {
        await tracing.start({
          ...this._traceOptions,
          title,
          name
        });
        tracing[kTracingStarted] = true;
      } else {
        await tracing.startChunk({
          title,
          name
        });
      }
    } else {
      if (tracing[kTracingStarted]) {
        tracing[kTracingStarted] = false;
        await tracing.stop();
      }
    }
  }
  _preserveTrace() {
    const testFailed = this._testInfo.status !== this._testInfo.expectedStatus;
    return this._captureTrace && (this._traceMode === 'on' || testFailed && this._traceMode === 'retain-on-failure' || this._traceMode === 'on-first-retry' && this._testInfo.retry === 1 || this._traceMode === 'on-all-retries' && this._testInfo.retry > 0);
  }
  async _stopTracing(tracing, contextTearDownStarted) {
    if (tracing[this._startedCollectingArtifacts]) return;
    tracing[this._startedCollectingArtifacts] = true;
    if (this._captureTrace) {
      let tracePath;
      // Create a trace file if we know that:
      // - it is's going to be used due to the config setting and the test status or
      // - we are inside a test or afterEach and the user manually closed the context.
      if (this._preserveTrace() || !contextTearDownStarted) {
        tracePath = this._createTemporaryArtifact((0, _utils.createGuid)() + '.zip');
        this._temporaryTraceFiles.push(tracePath);
      }
      await tracing.stopChunk({
        path: tracePath
      });
    }
  }
}
const paramsToRender = ['url', 'selector', 'text', 'key'];
function renderApiCall(apiName, params) {
  const paramsArray = [];
  if (params) {
    for (const name of paramsToRender) {
      if (!(name in params)) continue;
      let value;
      if (name === 'selector' && (0, _utils.isString)(params[name]) && params[name].startsWith('internal:')) {
        const getter = (0, _utils.asLocator)('javascript', params[name], false, true);
        apiName = apiName.replace(/^locator\./, 'locator.' + getter + '.');
        apiName = apiName.replace(/^page\./, 'page.' + getter + '.');
        apiName = apiName.replace(/^frame\./, 'frame.' + getter + '.');
      } else {
        value = params[name];
        paramsArray.push(value);
      }
    }
  }
  const paramsText = paramsArray.length ? '(' + paramsArray.join(', ') + ')' : '';
  return apiName + paramsText;
}
const test = exports.test = _baseTest.extend(playwrightFixtures);
var _default = exports.default = test;