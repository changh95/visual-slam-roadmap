"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Semaphore = exports.PlaywrightServer = void 0;
var _utilsBundle = require("../utilsBundle");
var _playwright = require("../server/playwright");
var _playwrightConnection = require("./playwrightConnection");
var _manualPromise = require("../utils/manualPromise");
var _debugLogger = require("../common/debugLogger");
var _utils = require("../utils");
var _transport = require("../server/transport");
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

let lastConnectionId = 0;
const kConnectionSymbol = Symbol('kConnection');
class PlaywrightServer {
  constructor(options) {
    this._preLaunchedPlaywright = void 0;
    this._wsServer = void 0;
    this._server = void 0;
    this._options = void 0;
    this._options = options;
    if (options.preLaunchedBrowser) this._preLaunchedPlaywright = options.preLaunchedBrowser.attribution.playwright;
    if (options.preLaunchedAndroidDevice) this._preLaunchedPlaywright = options.preLaunchedAndroidDevice._android.attribution.playwright;
  }
  async listen(port = 0) {
    _debugLogger.debugLogger.log('server', `Server started at ${new Date()}`);
    const server = (0, _utils.createHttpServer)((request, response) => {
      if (request.method === 'GET' && request.url === '/json') {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({
          wsEndpointPath: this._options.path
        }));
        return;
      }
      response.end('Running');
    });
    server.on('error', error => _debugLogger.debugLogger.log('server', String(error)));
    this._server = server;
    const wsEndpoint = await new Promise((resolve, reject) => {
      server.listen(port, () => {
        const address = server.address();
        if (!address) {
          reject(new Error('Could not bind server socket'));
          return;
        }
        const wsEndpoint = typeof address === 'string' ? `${address}${this._options.path}` : `ws://127.0.0.1:${address.port}${this._options.path}`;
        resolve(wsEndpoint);
      }).on('error', reject);
    });
    _debugLogger.debugLogger.log('server', 'Listening at ' + wsEndpoint);
    this._wsServer = new _utilsBundle.wsServer({
      noServer: true,
      perMessageDeflate: _transport.perMessageDeflate
    });
    const browserSemaphore = new Semaphore(this._options.maxConnections);
    const controllerSemaphore = new Semaphore(1);
    const reuseBrowserSemaphore = new Semaphore(1);
    if (process.env.PWTEST_SERVER_WS_HEADERS) {
      this._wsServer.on('headers', (headers, request) => {
        headers.push(process.env.PWTEST_SERVER_WS_HEADERS);
      });
    }
    server.on('upgrade', (request, socket, head) => {
      var _this$_wsServer;
      const pathname = new URL('http://localhost' + request.url).pathname;
      if (pathname !== this._options.path) {
        socket.write(`HTTP/${request.httpVersion} 400 Bad Request\r\n\r\n`);
        socket.destroy();
        return;
      }
      const uaError = (0, _utils.userAgentVersionMatchesErrorMessage)(request.headers['user-agent'] || '');
      if (uaError) {
        socket.write(`HTTP/${request.httpVersion} 428 Precondition Required\r\n\r\n${uaError}`);
        socket.destroy();
        return;
      }
      (_this$_wsServer = this._wsServer) === null || _this$_wsServer === void 0 ? void 0 : _this$_wsServer.handleUpgrade(request, socket, head, ws => {
        var _this$_wsServer2;
        return (_this$_wsServer2 = this._wsServer) === null || _this$_wsServer2 === void 0 ? void 0 : _this$_wsServer2.emit('connection', ws, request);
      });
    });
    this._wsServer.on('connection', (ws, request) => {
      _debugLogger.debugLogger.log('server', 'Connected client ws.extension=' + ws.extensions);
      const url = new URL('http://localhost' + (request.url || ''));
      const browserHeader = request.headers['x-playwright-browser'];
      const browserName = url.searchParams.get('browser') || (Array.isArray(browserHeader) ? browserHeader[0] : browserHeader) || null;
      const proxyHeader = request.headers['x-playwright-proxy'];
      const proxyValue = url.searchParams.get('proxy') || (Array.isArray(proxyHeader) ? proxyHeader[0] : proxyHeader);
      const launchOptionsHeader = request.headers['x-playwright-launch-options'] || '';
      const launchOptionsHeaderValue = Array.isArray(launchOptionsHeader) ? launchOptionsHeader[0] : launchOptionsHeader;
      const launchOptionsParam = url.searchParams.get('launch-options');
      let launchOptions = {};
      try {
        launchOptions = JSON.parse(launchOptionsParam || launchOptionsHeaderValue);
      } catch (e) {}
      const id = String(++lastConnectionId);
      _debugLogger.debugLogger.log('server', `[${id}] serving connection: ${request.url}`);

      // Instantiate playwright for the extension modes.
      const isExtension = this._options.mode === 'extension';
      if (isExtension) {
        if (!this._preLaunchedPlaywright) this._preLaunchedPlaywright = (0, _playwright.createPlaywright)({
          sdkLanguage: 'javascript',
          isServer: true
        });
      }
      let clientType = 'launch-browser';
      let semaphore = browserSemaphore;
      if (isExtension && url.searchParams.has('debug-controller')) {
        clientType = 'controller';
        semaphore = controllerSemaphore;
      } else if (isExtension) {
        clientType = 'reuse-browser';
        semaphore = reuseBrowserSemaphore;
      } else if (this._options.mode === 'launchServer') {
        clientType = 'pre-launched-browser-or-android';
        semaphore = browserSemaphore;
      }
      const connection = new _playwrightConnection.PlaywrightConnection(semaphore.acquire(), clientType, ws, {
        socksProxyPattern: proxyValue,
        browserName,
        launchOptions
      }, {
        playwright: this._preLaunchedPlaywright,
        browser: this._options.preLaunchedBrowser,
        androidDevice: this._options.preLaunchedAndroidDevice,
        socksProxy: this._options.preLaunchedSocksProxy
      }, id, () => semaphore.release());
      ws[kConnectionSymbol] = connection;
    });
    return wsEndpoint;
  }
  async close() {
    const server = this._wsServer;
    if (!server) return;
    _debugLogger.debugLogger.log('server', 'closing websocket server');
    const waitForClose = new Promise(f => server.close(f));
    // First disconnect all remaining clients.
    await Promise.all(Array.from(server.clients).map(async ws => {
      const connection = ws[kConnectionSymbol];
      if (connection) await connection.close();
      try {
        ws.terminate();
      } catch (e) {}
    }));
    await waitForClose;
    _debugLogger.debugLogger.log('server', 'closing http server');
    if (this._server) await new Promise(f => this._server.close(f));
    this._wsServer = undefined;
    this._server = undefined;
    _debugLogger.debugLogger.log('server', 'closed server');
    _debugLogger.debugLogger.log('server', 'closing browsers');
    if (this._preLaunchedPlaywright) await Promise.all(this._preLaunchedPlaywright.allBrowsers().map(browser => browser.close({
      reason: 'Playwright Server stopped'
    })));
    _debugLogger.debugLogger.log('server', 'closed browsers');
  }
}
exports.PlaywrightServer = PlaywrightServer;
class Semaphore {
  constructor(max) {
    this._max = void 0;
    this._acquired = 0;
    this._queue = [];
    this._max = max;
  }
  setMax(max) {
    this._max = max;
  }
  acquire() {
    const lock = new _manualPromise.ManualPromise();
    this._queue.push(lock);
    this._flush();
    return lock;
  }
  release() {
    --this._acquired;
    this._flush();
  }
  _flush() {
    while (this._acquired < this._max && this._queue.length) {
      ++this._acquired;
      this._queue.shift().resolve();
    }
  }
}
exports.Semaphore = Semaphore;