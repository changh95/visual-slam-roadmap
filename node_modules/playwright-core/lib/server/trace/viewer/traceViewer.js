"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.openTraceInBrowser = openTraceInBrowser;
exports.openTraceViewerApp = openTraceViewerApp;
var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
var _httpServer = require("../../../utils/httpServer");
var _utils = require("../../../utils");
var _launchApp = require("../../launchApp");
var _instrumentation = require("../../instrumentation");
var _playwright = require("../../playwright");
var _progress = require("../../progress");
var _utilsBundle = require("../../../utilsBundle");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * Copyright (c) Microsoft Corporation.
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

async function startTraceViewerServer(traceUrls, options) {
  for (const traceUrl of traceUrls) {
    let traceFile = traceUrl;
    // If .json is requested, we'll synthesize it.
    if (traceUrl.endsWith('.json')) traceFile = traceUrl.substring(0, traceUrl.length - '.json'.length);
    if (!traceUrl.startsWith('http://') && !traceUrl.startsWith('https://') && !_fs.default.existsSync(traceFile) && !_fs.default.existsSync(traceFile + '.trace')) {
      // eslint-disable-next-line no-console
      console.error(`Trace file ${traceUrl} does not exist!`);
      (0, _utils.gracefullyProcessExitDoNotHang)(1);
    }
  }
  const server = new _httpServer.HttpServer();
  server.routePrefix('/trace', (request, response) => {
    const url = new URL('http://localhost' + request.url);
    const relativePath = url.pathname.slice('/trace'.length);
    if (relativePath.endsWith('/stall.js')) return true;
    if (relativePath.startsWith('/file')) {
      try {
        const filePath = url.searchParams.get('path');
        if (_fs.default.existsSync(filePath)) return server.serveFile(request, response, url.searchParams.get('path'));

        // If .json is requested, we'll synthesize it for zip-less operation.
        if (filePath.endsWith('.json')) {
          const traceName = filePath.substring(0, filePath.length - '.json'.length);
          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify(traceDescriptor(traceName)));
          return true;
        }
      } catch (e) {}
      response.statusCode = 404;
      response.end();
      return true;
    }
    const absolutePath = _path.default.join(__dirname, '..', '..', '..', 'vite', 'traceViewer', ...relativePath.split('/'));
    return server.serveFile(request, response, absolutePath);
  });
  const params = traceUrls.map(t => `trace=${encodeURIComponent(t)}`);
  const transport = (options === null || options === void 0 ? void 0 : options.transport) || (options !== null && options !== void 0 && options.isServer ? new StdinServer() : undefined);
  if (transport) {
    const guid = (0, _utils.createGuid)();
    params.push('ws=' + guid);
    const wss = new _utilsBundle.wsServer({
      server: server.server(),
      path: '/' + guid
    });
    wss.on('connection', ws => {
      transport.sendEvent = (method, params) => ws.send(JSON.stringify({
        method,
        params
      }));
      transport.close = () => ws.close();
      ws.on('message', async message => {
        const {
          id,
          method,
          params
        } = JSON.parse(message);
        const result = await transport.dispatch(method, params);
        ws.send(JSON.stringify({
          id,
          result
        }));
      });
      ws.on('close', () => transport.onclose());
      ws.on('error', () => transport.onclose());
    });
  }
  if (options !== null && options !== void 0 && options.isServer) params.push('isServer');
  if ((0, _utils.isUnderTest)()) params.push('isUnderTest=true');
  const {
    host,
    port
  } = options || {};
  const url = await server.start({
    preferredPort: port,
    host
  });
  const {
    app
  } = options || {};
  const searchQuery = params.length ? '?' + params.join('&') : '';
  const urlPath = `/trace/${app || 'index.html'}${searchQuery}`;
  server.routePath('/', (request, response) => {
    response.statusCode = 302;
    response.setHeader('Location', urlPath + request.url.substring(1));
    response.end();
    return true;
  });
  return {
    server,
    url
  };
}
async function openTraceViewerApp(traceUrls, browserName, options) {
  const {
    url
  } = await startTraceViewerServer(traceUrls, options);
  const traceViewerPlaywright = (0, _playwright.createPlaywright)({
    sdkLanguage: 'javascript',
    isInternalPlaywright: true
  });
  const traceViewerBrowser = (0, _utils.isUnderTest)() ? 'chromium' : browserName;
  const {
    context,
    page
  } = await (0, _launchApp.launchApp)(traceViewerPlaywright[traceViewerBrowser], {
    // TODO: store language in the trace.
    sdkLanguage: traceViewerPlaywright.options.sdkLanguage,
    windowSize: {
      width: 1280,
      height: 800
    },
    persistentContextOptions: {
      ...(options === null || options === void 0 ? void 0 : options.persistentContextOptions),
      useWebSocket: (0, _utils.isUnderTest)(),
      headless: options === null || options === void 0 ? void 0 : options.headless
    }
  });
  const controller = new _progress.ProgressController((0, _instrumentation.serverSideCallMetadata)(), context._browser);
  await controller.run(async progress => {
    await context._browser._defaultContext._loadDefaultContextAsIs(progress);
  });
  if (process.env.PWTEST_PRINT_WS_ENDPOINT) process.stderr.write('DevTools listening on: ' + context._browser.options.wsEndpoint + '\n');
  if (!(0, _utils.isUnderTest)()) await (0, _launchApp.syncLocalStorageWithSettings)(page, 'traceviewer');
  if ((0, _utils.isUnderTest)()) page.on('close', () => context.close({
    reason: 'Trace viewer closed'
  }).catch(() => {}));
  await page.mainFrame().goto((0, _instrumentation.serverSideCallMetadata)(), url);
  return page;
}
async function openTraceInBrowser(traceUrls, options) {
  const {
    url
  } = await startTraceViewerServer(traceUrls, options);
  // eslint-disable-next-line no-console
  console.log('\nListening on ' + url);
  if (!(0, _utils.isUnderTest)()) await (0, _utilsBundle.open)(url).catch(() => {});
}
class StdinServer {
  constructor() {
    this._pollTimer = void 0;
    this._traceUrl = void 0;
    this.sendEvent = void 0;
    this.close = void 0;
    process.stdin.on('data', data => {
      const url = data.toString().trim();
      if (url === this._traceUrl) return;
      if (url.endsWith('.json')) this._pollLoadTrace(url);else this._loadTrace(url);
    });
    process.stdin.on('close', () => (0, _utils.gracefullyProcessExitDoNotHang)(0));
  }
  async dispatch(method, params) {
    if (method === 'ready') {
      if (this._traceUrl) this._loadTrace(this._traceUrl);
    }
  }
  onclose() {
    (0, _utils.gracefullyProcessExitDoNotHang)(0);
  }
  _loadTrace(url) {
    var _this$sendEvent;
    this._traceUrl = url;
    clearTimeout(this._pollTimer);
    (_this$sendEvent = this.sendEvent) === null || _this$sendEvent === void 0 ? void 0 : _this$sendEvent.call(this, 'loadTrace', {
      url
    });
  }
  _pollLoadTrace(url) {
    this._loadTrace(url);
    this._pollTimer = setTimeout(() => {
      this._pollLoadTrace(url);
    }, 500);
  }
}
function traceDescriptor(traceName) {
  const result = {
    entries: []
  };
  const traceDir = _path.default.dirname(traceName);
  const traceFile = _path.default.basename(traceName);
  for (const name of _fs.default.readdirSync(traceDir)) {
    if (name.startsWith(traceFile)) result.entries.push({
      name,
      path: _path.default.join(traceDir, name)
    });
  }
  const resourcesDir = _path.default.join(traceDir, 'resources');
  if (_fs.default.existsSync(resourcesDir)) {
    for (const name of _fs.default.readdirSync(resourcesDir)) result.entries.push({
      name: 'resources/' + name,
      path: _path.default.join(resourcesDir, name)
    });
  }
  return result;
}