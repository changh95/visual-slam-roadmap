import path from "node:path";
import { getPrerenderMetadata } from "../../../prerender/metadata.js";
import { extendManualChunks } from "./util.js";
function vitePluginPrerender(opts, internals) {
  return {
    name: "astro:rollup-plugin-prerender",
    outputOptions(outputOptions) {
      extendManualChunks(outputOptions, {
        after(id, meta) {
          if (id.includes("astro/dist/runtime")) {
            return "astro";
          }
          const pageInfo = internals.pagesByViteID.get(id);
          if (pageInfo) {
            if (getPrerenderMetadata(meta.getModuleInfo(id))) {
              pageInfo.route.prerender = true;
              return "prerender";
            }
            pageInfo.route.prerender = false;
            return `pages/${path.basename(pageInfo.component)}`;
          }
        }
      });
    }
  };
}
function pluginPrerender(opts, internals) {
  return {
    targets: ["server"],
    hooks: {
      "build:before": () => {
        return {
          vitePlugin: vitePluginPrerender(opts, internals)
        };
      }
    }
  };
}
export {
  pluginPrerender
};
