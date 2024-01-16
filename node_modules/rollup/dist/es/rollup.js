/*
  @license
	Rollup.js v4.9.5
	Fri, 12 Jan 2024 06:15:44 GMT - commit 7fa474cc5ed91c96a4ff80e286aa8534bc15834f

	https://github.com/rollup/rollup

	Released under the MIT License.
*/
export { version as VERSION, defineConfig, rollup, watch } from './shared/node-entry.js';
import './shared/parseAst.js';
import '../native.js';
import 'node:path';
import 'path';
import 'node:process';
import 'node:perf_hooks';
import 'node:fs/promises';
import 'tty';
