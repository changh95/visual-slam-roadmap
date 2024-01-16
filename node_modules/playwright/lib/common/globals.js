"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.currentConfig = currentConfig;
exports.currentExpectTimeout = currentExpectTimeout;
exports.currentTestInfo = currentTestInfo;
exports.currentlyLoadingFileSuite = currentlyLoadingFileSuite;
exports.isWorkerProcess = isWorkerProcess;
exports.setCurrentConfig = setCurrentConfig;
exports.setCurrentExpectConfigureTimeout = setCurrentExpectConfigureTimeout;
exports.setCurrentTestInfo = setCurrentTestInfo;
exports.setCurrentlyLoadingFileSuite = setCurrentlyLoadingFileSuite;
exports.setIsWorkerProcess = setIsWorkerProcess;
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

let currentTestInfoValue = null;
function setCurrentTestInfo(testInfo) {
  currentTestInfoValue = testInfo;
}
function currentTestInfo() {
  return currentTestInfoValue;
}
let currentFileSuite;
function setCurrentlyLoadingFileSuite(suite) {
  currentFileSuite = suite;
}
function currentlyLoadingFileSuite() {
  return currentFileSuite;
}
let currentExpectConfigureTimeout;
function setCurrentExpectConfigureTimeout(timeout) {
  currentExpectConfigureTimeout = timeout;
}
function currentExpectTimeout(options) {
  var _testInfo$_projectInt, _testInfo$_projectInt2;
  const testInfo = currentTestInfo();
  if (options.timeout !== undefined) return options.timeout;
  if (currentExpectConfigureTimeout !== undefined) return currentExpectConfigureTimeout;
  let defaultExpectTimeout = testInfo === null || testInfo === void 0 ? void 0 : (_testInfo$_projectInt = testInfo._projectInternal) === null || _testInfo$_projectInt === void 0 ? void 0 : (_testInfo$_projectInt2 = _testInfo$_projectInt.expect) === null || _testInfo$_projectInt2 === void 0 ? void 0 : _testInfo$_projectInt2.timeout;
  if (typeof defaultExpectTimeout === 'undefined') defaultExpectTimeout = 5000;
  return defaultExpectTimeout;
}
let _isWorkerProcess = false;
function setIsWorkerProcess() {
  _isWorkerProcess = true;
}
function isWorkerProcess() {
  return _isWorkerProcess;
}
let currentConfigValue = null;
function setCurrentConfig(config) {
  currentConfigValue = config;
}
function currentConfig() {
  return currentConfigValue;
}