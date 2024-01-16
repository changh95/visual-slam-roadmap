// MIT © 2017 azu
// MIT © Zoltan Kochan
// Original https://github.com/zkochan/rcfile
import path from "path";
import fs from "fs";
import requireFromString from "require-from-string";
import JSON5 from "json5";
import type {
    PossibleUndefined,
    rcConfigLoaderOption,
    rcConfigResult,
    RequiredOption,
    ExtensionName,
    ExtensionLoaderMap,
    Loader
} from "./types";

const debug = require("debug")("rc-config-loader");

const defaultLoaderByExt: ExtensionLoaderMap = {
    ".cjs": loadJSConfigFile,
    ".js": loadJSConfigFile,
    ".json": loadJSONConfigFile,
    ".yaml": loadYAMLConfigFile,
    ".yml": loadYAMLConfigFile
};

const defaultOptions: Required<Pick<rcConfigLoaderOption, RequiredOption>> &
    Omit<rcConfigLoaderOption, RequiredOption> = {
    packageJSON: false,
    defaultExtension: [".json", ".yaml", ".yml", ".js", ".cjs"],
    cwd: process.cwd()
};

const selectLoader = (defaultLoaderByExt: ExtensionLoaderMap, extension: ExtensionName): Loader => {
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
export function rcFile<R extends {}>(
    pkgName: string,
    opts: rcConfigLoaderOption = {}
): PossibleUndefined<rcConfigResult<R>> {
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

    const loaderByExt = {
        ...defaultLoaderByExt,
        "": loadersByOrder
    };
    return findConfig<R>({
        parts,
        loaderByExt,
        loadersByOrder,
        configFileName,
        packageJSON,
        packageJSONFieldName
    });
}

/**
 *
 * @returns {{
 *  config: string,
 *  filePath: string
 * }}
 */
function findConfig<R extends {}>({
    parts,
    loaderByExt,
    loadersByOrder,
    configFileName,
    packageJSON,
    packageJSONFieldName
}: {
    parts: string[];
    loaderByExt: {
        [index: string]: Loader | Loader[];
    };
    loadersByOrder: Loader | Loader[];
    configFileName: string;
    packageJSON: boolean | { fieldName: string };
    packageJSONFieldName: string;
}):
    | {
          config: R;
          filePath: string;
      }
    | undefined {
    const extensions = Object.keys(loaderByExt);
    while (extensions.length) {
        const ext = extensions.shift();
        // may be ext is "". if it .<product>rc
        const configLocation = join(parts, configFileName + ext);
        if (!fs.existsSync(configLocation)) {
            continue;
        }
        // if ext === ""(empty string):, use ordered loaders
        const loaders = ext ? loaderByExt[ext] : loadersByOrder;
        if (!Array.isArray(loaders)) {
            const loader = loaders;
            const result = loader<R>(configLocation, false);
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
            const result = loader<R>(configLocation, true);
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
        if (fs.existsSync(pkgJSONLoc)) {
            const pkgJSON = JSON5.parse(readFile(pkgJSONLoc));
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

function splitPath(x: string): string[] {
    return path.resolve(x || "").split(path.sep);
}

function join(parts: string[], filename: string) {
    return path.resolve(parts.join(path.sep) + path.sep, filename);
}

function loadJSConfigFile(filePath: string, suppress: boolean) {
    debug(`Loading JavaScript config file: ${filePath}`);
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        return requireFromString(content, filePath);
    } catch (error: any) {
        debug(`Error reading JavaScript file: ${filePath}`);
        if (!suppress) {
            error.message = `Cannot read config file: ${filePath}\nError: ${error.message}`;
            throw error;
        }
    }
}

function loadJSONConfigFile(filePath: string, suppress: boolean) {
    debug(`Loading JSON config file: ${filePath}`);

    try {
        return JSON5.parse(readFile(filePath));
    } catch (error: any) {
        debug(`Error reading JSON file: ${filePath}`);
        if (!suppress) {
            error.message = `Cannot read config file: ${filePath}\nError: ${error.message}`;
            throw error;
        }
    }
}

function readFile(filePath: string) {
    return fs.readFileSync(filePath, "utf8");
}

function loadYAMLConfigFile(filePath: string, suppress: boolean) {
    debug(`Loading YAML config file: ${filePath}`);
    // lazy load YAML to improve performance when not used
    const yaml = require("js-yaml");
    try {
        // empty YAML file can be null, so always use
        return yaml.load(readFile(filePath)) || {};
    } catch (error: any) {
        debug(`Error reading YAML file: ${filePath}`);
        if (!suppress) {
            error.message = `Cannot read config file: ${filePath}\nError: ${error.message}`;
            throw error;
        }
    }
}
