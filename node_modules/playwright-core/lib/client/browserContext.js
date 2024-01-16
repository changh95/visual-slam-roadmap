"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BrowserContext = void 0;
exports.prepareBrowserContextParams = prepareBrowserContextParams;
var _page = require("./page");
var _frame = require("./frame");
var network = _interopRequireWildcard(require("./network"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _channelOwner = require("./channelOwner");
var _clientHelper = require("./clientHelper");
var _browser = require("./browser");
var _worker = require("./worker");
var _events = require("./events");
var _timeoutSettings = require("../common/timeoutSettings");
var _waiter = require("./waiter");
var _utils = require("../utils");
var _fileUtils = require("../utils/fileUtils");
var _cdpSession = require("./cdpSession");
var _tracing = require("./tracing");
var _artifact = require("./artifact");
var _fetch = require("./fetch");
var _stackTrace = require("../utils/stackTrace");
var _harRouter = require("./harRouter");
var _consoleMessage = require("./consoleMessage");
var _dialog = require("./dialog");
var _webError = require("./webError");
var _errors = require("./errors");
let _Symbol$asyncDispose;
/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
_Symbol$asyncDispose = Symbol.asyncDispose;
class BrowserContext extends _channelOwner.ChannelOwner {
  static from(context) {
    return context._object;
  }
  static fromNullable(context) {
    return context ? BrowserContext.from(context) : null;
  }
  constructor(parent, type, guid, initializer) {
    var _this$_browser, _this$_browser2;
    super(parent, type, guid, initializer);
    this._pages = new Set();
    this._routes = [];
    this._browser = null;
    this._browserType = void 0;
    this._bindings = new Map();
    this._timeoutSettings = new _timeoutSettings.TimeoutSettings();
    this._ownerPage = void 0;
    this._closedPromise = void 0;
    this._options = {};
    this.request = void 0;
    this.tracing = void 0;
    this._backgroundPages = new Set();
    this._serviceWorkers = new Set();
    this._isChromium = void 0;
    this._harRecorders = new Map();
    this._closeWasCalled = false;
    this._closeReason = void 0;
    if (parent instanceof _browser.Browser) this._browser = parent;
    (_this$_browser = this._browser) === null || _this$_browser === void 0 ? void 0 : _this$_browser._contexts.add(this);
    this._isChromium = ((_this$_browser2 = this._browser) === null || _this$_browser2 === void 0 ? void 0 : _this$_browser2._name) === 'chromium';
    this.tracing = _tracing.Tracing.from(initializer.tracing);
    this.request = _fetch.APIRequestContext.from(initializer.requestContext);
    this._channel.on('bindingCall', ({
      binding
    }) => this._onBinding(_page.BindingCall.from(binding)));
    this._channel.on('close', () => this._onClose());
    this._channel.on('page', ({
      page
    }) => this._onPage(_page.Page.from(page)));
    this._channel.on('route', ({
      route
    }) => this._onRoute(network.Route.from(route)));
    this._channel.on('backgroundPage', ({
      page
    }) => {
      const backgroundPage = _page.Page.from(page);
      this._backgroundPages.add(backgroundPage);
      this.emit(_events.Events.BrowserContext.BackgroundPage, backgroundPage);
    });
    this._channel.on('serviceWorker', ({
      worker
    }) => {
      const serviceWorker = _worker.Worker.from(worker);
      serviceWorker._context = this;
      this._serviceWorkers.add(serviceWorker);
      this.emit(_events.Events.BrowserContext.ServiceWorker, serviceWorker);
    });
    this._channel.on('console', event => {
      const consoleMessage = new _consoleMessage.ConsoleMessage(event);
      this.emit(_events.Events.BrowserContext.Console, consoleMessage);
      const page = consoleMessage.page();
      if (page) page.emit(_events.Events.Page.Console, consoleMessage);
    });
    this._channel.on('pageError', ({
      error,
      page
    }) => {
      const pageObject = _page.Page.from(page);
      const parsedError = (0, _errors.parseError)(error);
      this.emit(_events.Events.BrowserContext.WebError, new _webError.WebError(pageObject, parsedError));
      if (pageObject) pageObject.emit(_events.Events.Page.PageError, parsedError);
    });
    this._channel.on('dialog', ({
      dialog
    }) => {
      const dialogObject = _dialog.Dialog.from(dialog);
      let hasListeners = this.emit(_events.Events.BrowserContext.Dialog, dialogObject);
      const page = dialogObject.page();
      if (page) hasListeners = page.emit(_events.Events.Page.Dialog, dialogObject) || hasListeners;
      if (!hasListeners) {
        // Although we do similar handling on the server side, we still need this logic
        // on the client side due to a possible race condition between two async calls:
        // a) removing "dialog" listener subscription (client->server)
        // b) actual "dialog" event (server->client)
        if (dialogObject.type() === 'beforeunload') dialog.accept({}).catch(() => {});else dialog.dismiss().catch(() => {});
      }
    });
    this._channel.on('request', ({
      request,
      page
    }) => this._onRequest(network.Request.from(request), _page.Page.fromNullable(page)));
    this._channel.on('requestFailed', ({
      request,
      failureText,
      responseEndTiming,
      page
    }) => this._onRequestFailed(network.Request.from(request), responseEndTiming, failureText, _page.Page.fromNullable(page)));
    this._channel.on('requestFinished', params => this._onRequestFinished(params));
    this._channel.on('response', ({
      response,
      page
    }) => this._onResponse(network.Response.from(response), _page.Page.fromNullable(page)));
    this._closedPromise = new Promise(f => this.once(_events.Events.BrowserContext.Close, f));
    this._setEventToSubscriptionMapping(new Map([[_events.Events.BrowserContext.Console, 'console'], [_events.Events.BrowserContext.Dialog, 'dialog'], [_events.Events.BrowserContext.Request, 'request'], [_events.Events.BrowserContext.Response, 'response'], [_events.Events.BrowserContext.RequestFinished, 'requestFinished'], [_events.Events.BrowserContext.RequestFailed, 'requestFailed']]));
  }
  _setOptions(contextOptions, browserOptions) {
    this._options = contextOptions;
    if (this._options.recordHar) this._harRecorders.set('', {
      path: this._options.recordHar.path,
      content: this._options.recordHar.content
    });
    this.tracing._tracesDir = browserOptions.tracesDir;
  }
  _onPage(page) {
    this._pages.add(page);
    this.emit(_events.Events.BrowserContext.Page, page);
    if (page._opener && !page._opener.isClosed()) page._opener.emit(_events.Events.Page.Popup, page);
  }
  _onRequest(request, page) {
    this.emit(_events.Events.BrowserContext.Request, request);
    if (page) page.emit(_events.Events.Page.Request, request);
  }
  _onResponse(response, page) {
    this.emit(_events.Events.BrowserContext.Response, response);
    if (page) page.emit(_events.Events.Page.Response, response);
  }
  _onRequestFailed(request, responseEndTiming, failureText, page) {
    request._failureText = failureText || null;
    request._setResponseEndTiming(responseEndTiming);
    this.emit(_events.Events.BrowserContext.RequestFailed, request);
    if (page) page.emit(_events.Events.Page.RequestFailed, request);
  }
  _onRequestFinished(params) {
    const {
      responseEndTiming
    } = params;
    const request = network.Request.from(params.request);
    const response = network.Response.fromNullable(params.response);
    const page = _page.Page.fromNullable(params.page);
    request._setResponseEndTiming(responseEndTiming);
    this.emit(_events.Events.BrowserContext.RequestFinished, request);
    if (page) page.emit(_events.Events.Page.RequestFinished, request);
    if (response) response._finishedPromise.resolve(null);
  }
  async _onRoute(route) {
    route._context = this;
    const routeHandlers = this._routes.slice();
    for (const routeHandler of routeHandlers) {
      if (!routeHandler.matches(route.request().url())) continue;
      if (routeHandler.willExpire()) this._routes.splice(this._routes.indexOf(routeHandler), 1);
      const handled = await routeHandler.handle(route);
      if (!this._routes.length) this._wrapApiCall(() => this._updateInterceptionPatterns(), true).catch(() => {});
      if (handled) return;
    }
    await route._innerContinue(true);
  }
  async _onBinding(bindingCall) {
    const func = this._bindings.get(bindingCall._initializer.name);
    if (!func) return;
    await bindingCall.call(func);
  }
  setDefaultNavigationTimeout(timeout) {
    this._timeoutSettings.setDefaultNavigationTimeout(timeout);
    this._wrapApiCall(async () => {
      this._channel.setDefaultNavigationTimeoutNoReply({
        timeout
      }).catch(() => {});
    }, true);
  }
  setDefaultTimeout(timeout) {
    this._timeoutSettings.setDefaultTimeout(timeout);
    this._wrapApiCall(async () => {
      this._channel.setDefaultTimeoutNoReply({
        timeout
      }).catch(() => {});
    }, true);
  }
  browser() {
    return this._browser;
  }
  pages() {
    return [...this._pages];
  }
  async newPage() {
    if (this._ownerPage) throw new Error('Please use browser.newContext()');
    return _page.Page.from((await this._channel.newPage()).page);
  }
  async cookies(urls) {
    if (!urls) urls = [];
    if (urls && typeof urls === 'string') urls = [urls];
    return (await this._channel.cookies({
      urls: urls
    })).cookies;
  }
  async addCookies(cookies) {
    await this._channel.addCookies({
      cookies
    });
  }
  async clearCookies() {
    await this._channel.clearCookies();
  }
  async grantPermissions(permissions, options) {
    await this._channel.grantPermissions({
      permissions,
      ...options
    });
  }
  async clearPermissions() {
    await this._channel.clearPermissions();
  }
  async setGeolocation(geolocation) {
    await this._channel.setGeolocation({
      geolocation: geolocation || undefined
    });
  }
  async setExtraHTTPHeaders(headers) {
    network.validateHeaders(headers);
    await this._channel.setExtraHTTPHeaders({
      headers: (0, _utils.headersObjectToArray)(headers)
    });
  }
  async setOffline(offline) {
    await this._channel.setOffline({
      offline
    });
  }
  async setHTTPCredentials(httpCredentials) {
    await this._channel.setHTTPCredentials({
      httpCredentials: httpCredentials || undefined
    });
  }
  async addInitScript(script, arg) {
    const source = await (0, _clientHelper.evaluationScript)(script, arg);
    await this._channel.addInitScript({
      source
    });
  }
  async exposeBinding(name, callback, options = {}) {
    await this._channel.exposeBinding({
      name,
      needsHandle: options.handle
    });
    this._bindings.set(name, callback);
  }
  async exposeFunction(name, callback) {
    await this._channel.exposeBinding({
      name
    });
    const binding = (source, ...args) => callback(...args);
    this._bindings.set(name, binding);
  }
  async route(url, handler, options = {}) {
    this._routes.unshift(new network.RouteHandler(this._options.baseURL, url, handler, options.times));
    await this._updateInterceptionPatterns();
  }
  async _recordIntoHAR(har, page, options = {}) {
    var _options$updateConten, _options$updateMode, _options$updateConten2;
    const {
      harId
    } = await this._channel.harStart({
      page: page === null || page === void 0 ? void 0 : page._channel,
      options: prepareRecordHarOptions({
        path: har,
        content: (_options$updateConten = options.updateContent) !== null && _options$updateConten !== void 0 ? _options$updateConten : 'attach',
        mode: (_options$updateMode = options.updateMode) !== null && _options$updateMode !== void 0 ? _options$updateMode : 'minimal',
        urlFilter: options.url
      })
    });
    this._harRecorders.set(harId, {
      path: har,
      content: (_options$updateConten2 = options.updateContent) !== null && _options$updateConten2 !== void 0 ? _options$updateConten2 : 'attach'
    });
  }
  async routeFromHAR(har, options = {}) {
    if (options.update) {
      await this._recordIntoHAR(har, null, options);
      return;
    }
    const harRouter = await _harRouter.HarRouter.create(this._connection.localUtils(), har, options.notFound || 'abort', {
      urlMatch: options.url
    });
    harRouter.addContextRoute(this);
  }
  async unroute(url, handler) {
    this._routes = this._routes.filter(route => !(0, _utils.urlMatchesEqual)(route.url, url) || handler && route.handler !== handler);
    await this._updateInterceptionPatterns();
  }
  async _updateInterceptionPatterns() {
    const patterns = network.RouteHandler.prepareInterceptionPatterns(this._routes);
    await this._channel.setNetworkInterceptionPatterns({
      patterns
    });
  }
  _effectiveCloseReason() {
    var _this$_browser3;
    return this._closeReason || ((_this$_browser3 = this._browser) === null || _this$_browser3 === void 0 ? void 0 : _this$_browser3._closeReason);
  }
  async waitForEvent(event, optionsOrPredicate = {}) {
    return this._wrapApiCall(async () => {
      const timeout = this._timeoutSettings.timeout(typeof optionsOrPredicate === 'function' ? {} : optionsOrPredicate);
      const predicate = typeof optionsOrPredicate === 'function' ? optionsOrPredicate : optionsOrPredicate.predicate;
      const waiter = _waiter.Waiter.createForEvent(this, event);
      waiter.rejectOnTimeout(timeout, `Timeout ${timeout}ms exceeded while waiting for event "${event}"`);
      if (event !== _events.Events.BrowserContext.Close) waiter.rejectOnEvent(this, _events.Events.BrowserContext.Close, () => new _errors.TargetClosedError(this._effectiveCloseReason()));
      const result = await waiter.waitForEvent(this, event, predicate);
      waiter.dispose();
      return result;
    });
  }
  async storageState(options = {}) {
    const state = await this._channel.storageState();
    if (options.path) {
      await (0, _fileUtils.mkdirIfNeeded)(options.path);
      await _fs.default.promises.writeFile(options.path, JSON.stringify(state, undefined, 2), 'utf8');
    }
    return state;
  }
  backgroundPages() {
    return [...this._backgroundPages];
  }
  serviceWorkers() {
    return [...this._serviceWorkers];
  }
  async newCDPSession(page) {
    // channelOwner.ts's validation messages don't handle the pseudo-union type, so we're explicit here
    if (!(page instanceof _page.Page) && !(page instanceof _frame.Frame)) throw new Error('page: expected Page or Frame');
    const result = await this._channel.newCDPSession(page instanceof _page.Page ? {
      page: page._channel
    } : {
      frame: page._channel
    });
    return _cdpSession.CDPSession.from(result.session);
  }
  _onClose() {
    var _this$_browserType, _this$_browserType$_c;
    if (this._browser) this._browser._contexts.delete(this);
    (_this$_browserType = this._browserType) === null || _this$_browserType === void 0 ? void 0 : (_this$_browserType$_c = _this$_browserType._contexts) === null || _this$_browserType$_c === void 0 ? void 0 : _this$_browserType$_c.delete(this);
    this.emit(_events.Events.BrowserContext.Close, this);
  }
  async [_Symbol$asyncDispose]() {
    await this.close();
  }
  async close(options = {}) {
    if (this._closeWasCalled) return;
    this._closeReason = options.reason;
    this._closeWasCalled = true;
    await this._wrapApiCall(async () => {
      var _this$_browserType2;
      await ((_this$_browserType2 = this._browserType) === null || _this$_browserType2 === void 0 ? void 0 : _this$_browserType2._willCloseContext(this));
      for (const [harId, harParams] of this._harRecorders) {
        const har = await this._channel.harExport({
          harId
        });
        const artifact = _artifact.Artifact.from(har.artifact);
        // Server side will compress artifact if content is attach or if file is .zip.
        const isCompressed = harParams.content === 'attach' || harParams.path.endsWith('.zip');
        const needCompressed = harParams.path.endsWith('.zip');
        if (isCompressed && !needCompressed) {
          await artifact.saveAs(harParams.path + '.tmp');
          await this._connection.localUtils()._channel.harUnzip({
            zipFile: harParams.path + '.tmp',
            harFile: harParams.path
          });
        } else {
          await artifact.saveAs(harParams.path);
        }
        await artifact.delete();
      }
    }, true);
    await this._channel.close(options);
    await this._closedPromise;
  }
  async _enableRecorder(params) {
    await this._channel.recorderSupplementEnable(params);
  }
}
exports.BrowserContext = BrowserContext;
async function prepareStorageState(options) {
  if (typeof options.storageState !== 'string') return options.storageState;
  try {
    return JSON.parse(await _fs.default.promises.readFile(options.storageState, 'utf8'));
  } catch (e) {
    (0, _stackTrace.rewriteErrorMessage)(e, `Error reading storage state from ${options.storageState}:\n` + e.message);
    throw e;
  }
}
function prepareRecordHarOptions(options) {
  if (!options) return;
  return {
    path: options.path,
    content: options.content || (options.omitContent ? 'omit' : undefined),
    urlGlob: (0, _utils.isString)(options.urlFilter) ? options.urlFilter : undefined,
    urlRegexSource: (0, _utils.isRegExp)(options.urlFilter) ? options.urlFilter.source : undefined,
    urlRegexFlags: (0, _utils.isRegExp)(options.urlFilter) ? options.urlFilter.flags : undefined,
    mode: options.mode
  };
}
async function prepareBrowserContextParams(options) {
  if (options.videoSize && !options.videosPath) throw new Error(`"videoSize" option requires "videosPath" to be specified`);
  if (options.extraHTTPHeaders) network.validateHeaders(options.extraHTTPHeaders);
  const contextParams = {
    ...options,
    viewport: options.viewport === null ? undefined : options.viewport,
    noDefaultViewport: options.viewport === null,
    extraHTTPHeaders: options.extraHTTPHeaders ? (0, _utils.headersObjectToArray)(options.extraHTTPHeaders) : undefined,
    storageState: await prepareStorageState(options),
    serviceWorkers: options.serviceWorkers,
    recordHar: prepareRecordHarOptions(options.recordHar),
    colorScheme: options.colorScheme === null ? 'no-override' : options.colorScheme,
    reducedMotion: options.reducedMotion === null ? 'no-override' : options.reducedMotion,
    forcedColors: options.forcedColors === null ? 'no-override' : options.forcedColors,
    acceptDownloads: toAcceptDownloadsProtocol(options.acceptDownloads)
  };
  if (!contextParams.recordVideo && options.videosPath) {
    contextParams.recordVideo = {
      dir: options.videosPath,
      size: options.videoSize
    };
  }
  if (contextParams.recordVideo && contextParams.recordVideo.dir) contextParams.recordVideo.dir = _path.default.resolve(process.cwd(), contextParams.recordVideo.dir);
  return contextParams;
}
function toAcceptDownloadsProtocol(acceptDownloads) {
  if (acceptDownloads === undefined) return undefined;
  if (acceptDownloads === true) return 'accept';
  return 'deny';
}