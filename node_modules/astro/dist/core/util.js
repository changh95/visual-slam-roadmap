import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePath } from "vite";
import { isServerLikeOutput } from "../prerender/utils.js";
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from "./constants.js";
import { prependForwardSlash, removeTrailingForwardSlash, slash } from "./path.js";
function isObject(value) {
  return typeof value === "object" && value != null;
}
function isURL(value) {
  return Object.prototype.toString.call(value) === "[object URL]";
}
function isMarkdownFile(fileId, option) {
  const _suffix = option?.suffix ?? "";
  for (let markdownFileExtension of SUPPORTED_MARKDOWN_FILE_EXTENSIONS) {
    if (fileId.endsWith(`${markdownFileExtension}${_suffix}`))
      return true;
  }
  return false;
}
function arraify(target) {
  return Array.isArray(target) ? target : [target];
}
function padMultilineString(source, n = 2) {
  const lines = source.split(/\r?\n/);
  return lines.map((l) => ` `.repeat(n) + l).join(`
`);
}
const STATUS_CODE_PAGES = /* @__PURE__ */ new Set(["/404", "/500"]);
function getOutputFilename(astroConfig, name, type) {
  if (type === "endpoint") {
    return name;
  }
  if (name === "/" || name === "") {
    return path.posix.join(name, "index.html");
  }
  if (astroConfig.build.format === "file" || STATUS_CODE_PAGES.has(name)) {
    return `${removeTrailingForwardSlash(name || "index")}.html`;
  }
  return path.posix.join(name, "index.html");
}
function parseNpmName(spec) {
  if (!spec || spec[0] === "." || spec[0] === "/")
    return void 0;
  let scope;
  let name = "";
  let parts = spec.split("/");
  if (parts[0][0] === "@") {
    scope = parts[0];
    name = parts.shift() + "/";
  }
  name += parts.shift();
  let subpath = parts.length ? `./${parts.join("/")}` : void 0;
  return {
    scope,
    name,
    subpath
  };
}
function viteID(filePath) {
  return slash(fileURLToPath(filePath) + filePath.search);
}
const VALID_ID_PREFIX = `/@id/`;
const NULL_BYTE_PLACEHOLDER = `__x00__`;
function unwrapId(id) {
  return id.startsWith(VALID_ID_PREFIX) ? id.slice(VALID_ID_PREFIX.length).replace(NULL_BYTE_PLACEHOLDER, "\0") : id;
}
function resolvePages(config) {
  return new URL("./pages", config.srcDir);
}
function isInPagesDir(file, config) {
  const pagesDir = resolvePages(config);
  return file.toString().startsWith(pagesDir.toString());
}
function isInjectedRoute(file, settings) {
  let fileURL = file.toString();
  for (const route of settings.resolvedInjectedRoutes) {
    if (route.resolvedEntryPoint && fileURL === route.resolvedEntryPoint.toString())
      return true;
  }
  return false;
}
function isPublicRoute(file, config) {
  const pagesDir = resolvePages(config);
  const parts = file.toString().replace(pagesDir.toString(), "").split("/").slice(1);
  for (const part of parts) {
    if (part.startsWith("_"))
      return false;
  }
  return true;
}
function endsWithPageExt(file, settings) {
  for (const ext of settings.pageExtensions) {
    if (file.toString().endsWith(ext))
      return true;
  }
  return false;
}
function isPage(file, settings) {
  if (!isInPagesDir(file, settings.config) && !isInjectedRoute(file, settings))
    return false;
  if (!isPublicRoute(file, settings.config))
    return false;
  return endsWithPageExt(file, settings);
}
function isEndpoint(file, settings) {
  if (!isInPagesDir(file, settings.config))
    return false;
  if (!isPublicRoute(file, settings.config))
    return false;
  return !endsWithPageExt(file, settings);
}
function isModeServerWithNoAdapter(settings) {
  return isServerLikeOutput(settings.config) && !settings.adapter;
}
function relativeToSrcDir(config, idOrUrl) {
  let id;
  if (typeof idOrUrl !== "string") {
    id = unwrapId(viteID(idOrUrl));
  } else {
    id = idOrUrl;
  }
  return id.slice(slash(fileURLToPath(config.srcDir)).length);
}
function rootRelativePath(root, idOrUrl, shouldPrependForwardSlash = true) {
  let id;
  if (typeof idOrUrl !== "string") {
    id = unwrapId(viteID(idOrUrl));
  } else {
    id = idOrUrl;
  }
  const normalizedRoot = normalizePath(fileURLToPath(root));
  if (id.startsWith(normalizedRoot)) {
    id = id.slice(normalizedRoot.length);
  }
  return shouldPrependForwardSlash ? prependForwardSlash(id) : id;
}
function emoji(char, fallback) {
  return process.platform !== "win32" ? char : fallback;
}
async function resolveIdToUrl(loader, id, root) {
  let resultId = await loader.resolveId(id, void 0);
  if (!resultId && id.endsWith(".jsx")) {
    resultId = await loader.resolveId(id.slice(0, -4), void 0);
  }
  if (!resultId) {
    return VALID_ID_PREFIX + id;
  }
  if (path.isAbsolute(resultId)) {
    const normalizedRoot = root && normalizePath(fileURLToPath(root));
    if (normalizedRoot && resultId.startsWith(normalizedRoot)) {
      return resultId.slice(normalizedRoot.length - 1);
    } else {
      return "/@fs" + prependForwardSlash(resultId);
    }
  }
  return VALID_ID_PREFIX + resultId;
}
function resolveJsToTs(filePath) {
  if (filePath.endsWith(".jsx") && !fs.existsSync(filePath)) {
    const tryPath = filePath.slice(0, -4) + ".tsx";
    if (fs.existsSync(tryPath)) {
      return tryPath;
    }
  }
  return filePath;
}
function resolvePath(specifier, importer) {
  if (specifier.startsWith(".")) {
    const absoluteSpecifier = path.resolve(path.dirname(importer), specifier);
    return resolveJsToTs(normalizePath(absoluteSpecifier));
  } else {
    return specifier;
  }
}
function ensureProcessNodeEnv(defaultNodeEnv) {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = defaultNodeEnv;
  }
}
export {
  NULL_BYTE_PLACEHOLDER,
  VALID_ID_PREFIX,
  arraify,
  emoji,
  ensureProcessNodeEnv,
  getOutputFilename,
  isEndpoint,
  isMarkdownFile,
  isModeServerWithNoAdapter,
  isObject,
  isPage,
  isURL,
  padMultilineString,
  parseNpmName,
  relativeToSrcDir,
  resolveIdToUrl,
  resolveJsToTs,
  resolvePages,
  resolvePath,
  rootRelativePath,
  unwrapId,
  viteID
};
