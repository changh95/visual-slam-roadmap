"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Firefox = void 0;
var os = _interopRequireWildcard(require("os"));
var _path = _interopRequireDefault(require("path"));
var _ffBrowser = require("./ffBrowser");
var _ffConnection = require("./ffConnection");
var _browserType = require("../browserType");
var _utils = require("../../utils");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
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

class Firefox extends _browserType.BrowserType {
  constructor(parent) {
    super(parent, 'firefox');
  }
  _connectToTransport(transport, options) {
    return _ffBrowser.FFBrowser.connect(this.attribution.playwright, transport, options);
  }
  _doRewriteStartupLog(error) {
    if (!error.logs) return error;
    if (error.logs.includes('no DISPLAY environment variable specified')) error.logs = '\n' + (0, _utils.wrapInASCIIBox)(_browserType.kNoXServerRunningError, 1);
    return error;
  }
  _amendEnvironment(env, userDataDir, executable, browserArguments) {
    if (!_path.default.isAbsolute(os.homedir())) throw new Error(`Cannot launch Firefox with relative home directory. Did you set ${os.platform() === 'win32' ? 'USERPROFILE' : 'HOME'} to a relative path?`);
    if (os.platform() === 'linux') {
      // Always remove SNAP_NAME and SNAP_INSTANCE_NAME env variables since they
      // confuse Firefox: in our case, builds never come from SNAP.
      // See https://github.com/microsoft/playwright/issues/20555
      return {
        ...env,
        SNAP_NAME: undefined,
        SNAP_INSTANCE_NAME: undefined
      };
    }
    return env;
  }
  _attemptToGracefullyCloseBrowser(transport) {
    const message = {
      method: 'Browser.close',
      params: {},
      id: _ffConnection.kBrowserCloseMessageId
    };
    transport.send(message);
  }
  _defaultArgs(options, isPersistent, userDataDir) {
    const {
      args = [],
      headless
    } = options;
    const userDataDirArg = args.find(arg => arg.startsWith('-profile') || arg.startsWith('--profile'));
    if (userDataDirArg) throw this._createUserDataDirArgMisuseError('--profile');
    if (args.find(arg => arg.startsWith('-juggler'))) throw new Error('Use the port parameter instead of -juggler argument');
    const firefoxArguments = ['-no-remote'];
    if (headless) {
      firefoxArguments.push('-headless');
    } else {
      firefoxArguments.push('-wait-for-browser');
      firefoxArguments.push('-foreground');
    }
    firefoxArguments.push(`-profile`, userDataDir);
    firefoxArguments.push('-juggler-pipe');
    firefoxArguments.push(...args);
    if (isPersistent) firefoxArguments.push('about:blank');else firefoxArguments.push('-silent');
    return firefoxArguments;
  }
}
exports.Firefox = Firefox;