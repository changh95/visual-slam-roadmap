"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.incorporateCompilationCache = incorporateCompilationCache;
exports.initializeEsmLoader = initializeEsmLoader;
exports.startCollectingFileDeps = startCollectingFileDeps;
exports.stopCollectingFileDeps = stopCollectingFileDeps;
var _compilationCache = require("../transform/compilationCache");
var _transform = require("../transform/transform");
var _portTransport = require("../transform/portTransport");
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

const port = globalThis.__esmLoaderPort;
const loaderChannel = port ? new _portTransport.PortTransport(port, async (method, params) => {
  if (method === 'pushToCompilationCache') (0, _compilationCache.addToCompilationCache)(params.cache);
}) : undefined;
async function startCollectingFileDeps() {
  if (!loaderChannel) return;
  await loaderChannel.send('startCollectingFileDeps', {});
}
async function stopCollectingFileDeps(file) {
  if (!loaderChannel) return;
  await loaderChannel.send('stopCollectingFileDeps', {
    file
  });
}
async function incorporateCompilationCache() {
  if (!loaderChannel) return;
  const result = await loaderChannel.send('getCompilationCache', {});
  (0, _compilationCache.addToCompilationCache)(result.cache);
}
async function initializeEsmLoader() {
  if (!loaderChannel) return;
  await loaderChannel.send('setTransformConfig', {
    config: (0, _transform.transformConfig)()
  });
  await loaderChannel.send('addToCompilationCache', {
    cache: (0, _compilationCache.serializeCompilationCache)()
  });
}