"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ProcessRunner = void 0;
var _utils = require("playwright-core/lib/utils");
var _util = require("../util");
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

class ProcessRunner {
  async gracefullyClose() {}
  dispatchEvent(method, params) {
    const response = {
      method,
      params
    };
    sendMessageToParent({
      method: '__dispatch__',
      params: response
    });
  }
}
exports.ProcessRunner = ProcessRunner;
let closed = false;
sendMessageToParent({
  method: 'ready'
});
process.on('disconnect', gracefullyCloseAndExit);
process.on('SIGINT', () => {});
process.on('SIGTERM', () => {});

// Clear execArgv immediately, so that the user-code does not inherit our loader.
process.execArgv = (0, _util.execArgvWithoutExperimentalLoaderOptions)();
let processRunner;
let processName;
const startingEnv = {
  ...process.env
};
process.on('message', async message => {
  if (message.method === '__init__') {
    const {
      processParams,
      runnerParams,
      runnerScript
    } = message.params;
    setTtyParams(process.stdout, processParams.stdoutParams);
    setTtyParams(process.stderr, processParams.stderrParams);
    void (0, _utils.startProfiling)();
    const {
      create
    } = require(runnerScript);
    processRunner = create(runnerParams);
    processName = processParams.processName;
    return;
  }
  if (message.method === '__stop__') {
    const keys = new Set([...Object.keys(process.env), ...Object.keys(startingEnv)]);
    const producedEnv = [...keys].filter(key => startingEnv[key] !== process.env[key]).map(key => {
      var _process$env$key;
      return [key, (_process$env$key = process.env[key]) !== null && _process$env$key !== void 0 ? _process$env$key : null];
    });
    sendMessageToParent({
      method: '__env_produced__',
      params: producedEnv
    });
    await gracefullyCloseAndExit();
    return;
  }
  if (message.method === '__dispatch__') {
    const {
      id,
      method,
      params
    } = message.params;
    try {
      const result = await processRunner[method](params);
      const response = {
        id,
        result
      };
      sendMessageToParent({
        method: '__dispatch__',
        params: response
      });
    } catch (e) {
      const response = {
        id,
        error: (0, _util.serializeError)(e)
      };
      sendMessageToParent({
        method: '__dispatch__',
        params: response
      });
    }
  }
});
async function gracefullyCloseAndExit() {
  var _processRunner;
  if (closed) return;
  closed = true;
  // Force exit after 30 seconds.
  // eslint-disable-next-line no-restricted-properties
  setTimeout(() => process.exit(0), 30000);
  // Meanwhile, try to gracefully shutdown.
  await ((_processRunner = processRunner) === null || _processRunner === void 0 ? void 0 : _processRunner.gracefullyClose().catch(() => {}));
  if (processName) await (0, _utils.stopProfiling)(processName).catch(() => {});
  // eslint-disable-next-line no-restricted-properties
  process.exit(0);
}
function sendMessageToParent(message) {
  try {
    process.send(message);
  } catch (e) {
    // Can throw when closing.
  }
}
function setTtyParams(stream, params) {
  stream.isTTY = true;
  if (params.rows) stream.rows = params.rows;
  if (params.columns) stream.columns = params.columns;
  stream.getColorDepth = () => params.colorDepth;
  stream.hasColors = (count = 16) => {
    // count is optional and the first argument may actually be env.
    if (typeof count !== 'number') count = 16;
    return count <= 2 ** params.colorDepth;
  };
}