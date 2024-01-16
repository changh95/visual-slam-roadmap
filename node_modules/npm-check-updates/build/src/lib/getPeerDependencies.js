"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const json_parse_helpfulerror_1 = __importDefault(require("json-parse-helpfulerror"));
const logging_1 = require("../lib/logging");
const getCurrentDependencies_1 = __importDefault(require("./getCurrentDependencies"));
/** Get peer dependencies from installed packages */
async function getPeerDependencies(current, options) {
    const basePath = options.cwd || './';
    const accum = {};
    // eslint-disable-next-line fp/no-loops
    for (const dep in current) {
        const path = basePath + `node_modules/${dep}/package.json`;
        let peers = {};
        try {
            const pkgData = await promises_1.default.readFile(path, 'utf-8');
            const pkg = json_parse_helpfulerror_1.default.parse(pkgData);
            peers = (0, getCurrentDependencies_1.default)(pkg, { ...options, dep: 'peer' });
        }
        catch (e) {
            (0, logging_1.print)(options, `Could not read peer dependencies for package ${dep}. Is this package installed?`, 'warn');
        }
        accum[dep] = peers;
    }
    return accum;
}
exports.default = getPeerDependencies;
//# sourceMappingURL=getPeerDependencies.js.map