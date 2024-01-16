import { extname } from "node:path";
import { routeIsRedirect } from "../../redirects/index.js";
import { addRollupInput } from "../add-rollup-input.js";
import { eachPageFromAllPages } from "../internal.js";
import { MIDDLEWARE_MODULE_ID } from "./plugin-middleware.js";
import { RENDERERS_MODULE_ID } from "./plugin-renderers.js";
import { ASTRO_PAGE_EXTENSION_POST_PATTERN, getPathFromVirtualModulePageName } from "./util.js";
const ASTRO_PAGE_MODULE_ID = "@astro-page:";
const ASTRO_PAGE_RESOLVED_MODULE_ID = "\0" + ASTRO_PAGE_MODULE_ID;
function getVirtualModulePageNameFromPath(path) {
  const extension = extname(path);
  return `${ASTRO_PAGE_MODULE_ID}${path.replace(
    extension,
    extension.replace(".", ASTRO_PAGE_EXTENSION_POST_PATTERN)
  )}`;
}
function getVirtualModulePageIdFromPath(path) {
  const name = getVirtualModulePageNameFromPath(path);
  return "\0" + name;
}
function vitePluginPages(opts, internals) {
  return {
    name: "@astro/plugin-build-pages",
    options(options) {
      if (opts.settings.config.output === "static") {
        const inputs = /* @__PURE__ */ new Set();
        for (const [path, pageData] of eachPageFromAllPages(opts.allPages)) {
          if (routeIsRedirect(pageData.route)) {
            continue;
          }
          inputs.add(getVirtualModulePageNameFromPath(path));
        }
        return addRollupInput(options, Array.from(inputs));
      }
    },
    resolveId(id) {
      if (id.startsWith(ASTRO_PAGE_MODULE_ID)) {
        return "\0" + id;
      }
    },
    async load(id) {
      if (id.startsWith(ASTRO_PAGE_RESOLVED_MODULE_ID)) {
        const imports = [];
        const exports = [];
        const pageName = getPathFromVirtualModulePageName(ASTRO_PAGE_RESOLVED_MODULE_ID, id);
        const pageData = internals.pagesByComponent.get(pageName);
        if (pageData) {
          const resolvedPage = await this.resolve(pageData.moduleSpecifier);
          if (resolvedPage) {
            imports.push(`const page = () => import(${JSON.stringify(pageData.moduleSpecifier)});`);
            exports.push(`export { page }`);
            imports.push(`import { renderers } from "${RENDERERS_MODULE_ID}";`);
            exports.push(`export { renderers };`);
            if (shouldBundleMiddleware(opts.settings)) {
              const middlewareModule = await this.resolve(MIDDLEWARE_MODULE_ID);
              if (middlewareModule) {
                imports.push(`import { onRequest } from "${middlewareModule.id}";`);
                exports.push(`export { onRequest };`);
              }
            }
            return `${imports.join("\n")}${exports.join("\n")}`;
          }
        }
      }
    }
  };
}
function shouldBundleMiddleware(settings) {
  if (settings.adapter?.adapterFeatures?.edgeMiddleware === true) {
    return false;
  }
  return true;
}
function pluginPages(opts, internals) {
  return {
    targets: ["server"],
    hooks: {
      "build:before": () => {
        return {
          vitePlugin: vitePluginPages(opts, internals)
        };
      }
    }
  };
}
export {
  ASTRO_PAGE_MODULE_ID,
  ASTRO_PAGE_RESOLVED_MODULE_ID,
  getVirtualModulePageIdFromPath,
  getVirtualModulePageNameFromPath,
  pluginPages,
  shouldBundleMiddleware
};
