"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rcFile = void 0;
// MIT © 2017 azu
// MIT © Zoltan Kochan
// Original https://github.com/zkochan/rcfile
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const require_from_string_1 = __importDefault(require("require-from-string"));
const json5_1 = __importDefault(require("json5"));
const debug = require("debug")("rc-config-loader");
const defaultLoaderByExt = {
    ".cjs": loadJSConfigFile,
    ".js": loadJSConfigFile,
    ".json": loadJSONConfigFile,
    ".yaml": loadYAMLConfigFile,
    ".yml": loadYAMLConfigFile
};
const defaultOptions = {
    packageJSON: false,
    defaultExtension: [".json", ".yaml", ".yml", ".js", ".cjs"],
    cwd: process.cwd()
};
const selectLoader = (defaultLoaderByExt, extension) => {
    if (!defaultOptions.defaultExtension.includes(extension)) {
        throw new Error(`${extension} is not supported.`);
    }
    return defaultLoaderByExt[extension];
};
/**
 * Find and load rcfile, return { config, filePath }
 * If not found any rcfile, throw an Error.
 * @param {string} pkgName
 * @param {rcConfigLoaderOption} [opts]
 * @returns {{ config: Object, filePath:string } | undefined}
 */
function rcFile(pkgName, opts = {}) {
    // path/to/config or basename of config file.
    const configFileName = opts.configFileName || `.${pkgName}rc`;
    const defaultExtension = opts.defaultExtension || defaultOptions.defaultExtension;
    const cwd = opts.cwd || defaultOptions.cwd;
    const packageJSON = opts.packageJSON || defaultOptions.packageJSON;
    const packageJSONFieldName = typeof packageJSON === "object" ? packageJSON.fieldName : pkgName;
    const parts = splitPath(cwd);
    const loadersByOrder = Array.isArray(defaultExtension)
        ? defaultExtension.map((extension) => selectLoader(defaultLoaderByExt, extension))
        : selectLoader(defaultLoaderByExt, defaultExtension);
    const loaderByExt = Object.assign(Object.assign({}, defaultLoaderByExt), { "": loadersByOrder });
    return findConfig({
        parts,
        loaderByExt,
        loadersByOrder,
        configFileName,
        packageJSON,
        packageJSONFieldName
    });
}
exports.rcFile = rcFile;
/**
 *
 * @returns {{
 *  config: string,
 *  filePath: string
 * }}
 */
function findConfig({ parts, loaderByExt, loadersByOrder, configFileName, packageJSON, packageJSONFieldName }) {
    const extensions = Object.keys(loaderByExt);
    while (extensions.length) {
        const ext = extensions.shift();
        // may be ext is "". if it .<product>rc
        const configLocation = join(parts, configFileName + ext);
        if (!fs_1.default.existsSync(configLocation)) {
            continue;
        }
        // if ext === ""(empty string):, use ordered loaders
        const loaders = ext ? loaderByExt[ext] : loadersByOrder;
        if (!Array.isArray(loaders)) {
            const loader = loaders;
            const result = loader(configLocation, false);
            if (!result) {
                continue;
            }
            return {
                config: result,
                filePath: configLocation
            };
        }
        for (let i = 0; i < loaders.length; i++) {
            const loader = loaders[i];
            const result = loader(configLocation, true);
            if (!result) {
                continue;
            }
            return {
                config: result,
                filePath: configLocation
            };
        }
    }
    if (packageJSON) {
        const pkgJSONLoc = join(parts, "package.json");
        if (fs_1.default.existsSync(pkgJSONLoc)) {
            const pkgJSON = json5_1.default.parse(readFile(pkgJSONLoc));
            if (pkgJSON[packageJSONFieldName]) {
                return {
                    config: pkgJSON[packageJSONFieldName],
                    filePath: pkgJSONLoc
                };
            }
        }
    }
    if (parts.pop()) {
        return findConfig({ parts, loaderByExt, loadersByOrder, configFileName, packageJSON, packageJSONFieldName });
    }
    return;
}
function splitPath(x) {
    return path_1.default.resolve(x || "").split(path_1.default.sep);
}
function join(parts, filename) {
    return path_1.default.resolve(parts.join(path_1.default.sep) + path_1.default.sep, filename);
}
function loadJSConfigFile(filePath, suppress) {
    debug(`Loading JavaScript config file: ${filePath}`);
    try {
        const content = fs_1.default.readFileSync(filePath, "utf-8");
        return (0, require_from_string_1.default)(content, filePath);
    }
    catch (error) {
        debug(`Error reading JavaScript file: ${filePath}`);
        if (!suppress) {
            error.message = `Cannot read config file: ${filePath}\nError: ${error.message}`;
            throw error;
        }
    }
}
function loadJSONConfigFile(filePath, suppress) {
    debug(`Loading JSON config file: ${filePath}`);
    try {
        return json5_1.default.parse(readFile(filePath));
    }
    catch (error) {
        debug(`Error reading JSON file: ${filePath}`);
        if (!suppress) {
            error.message = `Cannot read config file: ${filePath}\nError: ${error.message}`;
            throw error;
        }
    }
}
function readFile(filePath) {
    return fs_1.default.readFileSync(filePath, "utf8");
}
function loadYAMLConfigFile(filePath, suppress) {
    debug(`Loading YAML config file: ${filePath}`);
    // lazy load YAML to improve performance when not used
    const yaml = require("js-yaml");
    try {
        // empty YAML file can be null, so always use
        return yaml.load(readFile(filePath)) || {};
    }
    catch (error) {
        debug(`Error reading YAML file: ${filePath}`);
        if (!suppress) {
            error.message = `Cannot read config file: ${filePath}\nError: ${error.message}`;
            throw error;
        }
    }
}
//# sourceMappingURL=rc-config-loader.js.map