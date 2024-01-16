import { extname } from "node:path";
import { pathToFileURL } from "node:url";
import { moduleIsTopLevelPage, walkParentInfos } from "../core/build/graph.js";
import { getPageDataByViteID } from "../core/build/internal.js";
import { createViteLoader } from "../core/module-loader/vite.js";
import { joinPaths, prependForwardSlash } from "../core/path.js";
import { getStylesForURL } from "../vite-plugin-astro-server/css.js";
import { getScriptsForURL } from "../vite-plugin-astro-server/scripts.js";
import {
  CONTENT_RENDER_FLAG,
  LINKS_PLACEHOLDER,
  PROPAGATED_ASSET_FLAG,
  SCRIPTS_PLACEHOLDER,
  STYLES_PLACEHOLDER
} from "./consts.js";
import { hasContentFlag } from "./utils.js";
function astroContentAssetPropagationPlugin({
  mode,
  settings
}) {
  let devModuleLoader;
  return {
    name: "astro:content-asset-propagation",
    enforce: "pre",
    async resolveId(id, importer, opts) {
      if (hasContentFlag(id, CONTENT_RENDER_FLAG)) {
        const base = id.split("?")[0];
        for (const { extensions, handlePropagation = true } of settings.contentEntryTypes) {
          if (handlePropagation && extensions.includes(extname(base))) {
            return this.resolve(`${base}?${PROPAGATED_ASSET_FLAG}`, importer, {
              skipSelf: true,
              ...opts
            });
          }
        }
        return this.resolve(base, importer, { skipSelf: true, ...opts });
      }
    },
    configureServer(server) {
      if (mode === "dev") {
        devModuleLoader = createViteLoader(server);
      }
    },
    async transform(_, id, options) {
      if (hasContentFlag(id, PROPAGATED_ASSET_FLAG)) {
        const basePath = id.split("?")[0];
        let stringifiedLinks, stringifiedStyles, stringifiedScripts;
        if (options?.ssr && devModuleLoader) {
          if (!devModuleLoader.getModuleById(basePath)?.ssrModule) {
            await devModuleLoader.import(basePath);
          }
          const { styles, urls } = await getStylesForURL(pathToFileURL(basePath), devModuleLoader);
          const hoistedScripts = await getScriptsForURL(
            pathToFileURL(basePath),
            settings.config.root,
            devModuleLoader
          );
          stringifiedLinks = JSON.stringify([...urls]);
          stringifiedStyles = JSON.stringify(styles.map((s) => s.content));
          stringifiedScripts = JSON.stringify([...hoistedScripts]);
        } else {
          stringifiedLinks = JSON.stringify(LINKS_PLACEHOLDER);
          stringifiedStyles = JSON.stringify(STYLES_PLACEHOLDER);
          stringifiedScripts = JSON.stringify(SCRIPTS_PLACEHOLDER);
        }
        const code = `
					async function getMod() {
						return import(${JSON.stringify(basePath)});
					}
					const collectedLinks = ${stringifiedLinks};
					const collectedStyles = ${stringifiedStyles};
					const collectedScripts = ${stringifiedScripts};
					const defaultMod = { __astroPropagation: true, getMod, collectedLinks, collectedStyles, collectedScripts };
					export default defaultMod;
				`;
        return { code, map: { mappings: "" } };
      }
    }
  };
}
function astroConfigBuildPlugin(options, internals) {
  let ssrPluginContext = void 0;
  return {
    targets: ["server"],
    hooks: {
      "build:before": ({ target }) => {
        return {
          vitePlugin: {
            name: "astro:content-build-plugin",
            generateBundle() {
              if (target === "server") {
                ssrPluginContext = this;
              }
            }
          }
        };
      },
      "build:post": ({ ssrOutputs, clientOutputs, mutate }) => {
        const outputs = ssrOutputs.flatMap((o) => o.output);
        const prependBase = (src) => {
          if (options.settings.config.build.assetsPrefix) {
            return joinPaths(options.settings.config.build.assetsPrefix, src);
          } else {
            return prependForwardSlash(joinPaths(options.settings.config.base, src));
          }
        };
        for (const chunk of outputs) {
          if (chunk.type === "chunk" && (chunk.code.includes(LINKS_PLACEHOLDER) || chunk.code.includes(SCRIPTS_PLACEHOLDER))) {
            let entryStyles = /* @__PURE__ */ new Set();
            let entryLinks = /* @__PURE__ */ new Set();
            let entryScripts = /* @__PURE__ */ new Set();
            if (options.settings.config.experimental.contentCollectionCache) {
              for (const id of chunk.moduleIds) {
                const _entryCss = internals.propagatedStylesMap.get(id);
                const _entryScripts = internals.propagatedScriptsMap.get(id);
                if (_entryCss) {
                  for (const value of _entryCss) {
                    if (value.type === "inline")
                      entryStyles.add(value.content);
                    if (value.type === "external")
                      entryLinks.add(value.src);
                  }
                }
                if (_entryScripts) {
                  for (const value of _entryScripts) {
                    entryScripts.add(value);
                  }
                }
              }
            } else {
              for (const id of Object.keys(chunk.modules)) {
                for (const [pageInfo] of walkParentInfos(id, ssrPluginContext)) {
                  if (moduleIsTopLevelPage(pageInfo)) {
                    const pageViteID = pageInfo.id;
                    const pageData = getPageDataByViteID(internals, pageViteID);
                    if (!pageData)
                      continue;
                    const _entryCss = pageData.propagatedStyles?.get(id);
                    const _entryScripts = pageData.propagatedScripts?.get(id);
                    if (_entryCss) {
                      for (const value of _entryCss) {
                        if (value.type === "inline")
                          entryStyles.add(value.content);
                        if (value.type === "external")
                          entryLinks.add(value.src);
                      }
                    }
                    if (_entryScripts) {
                      for (const value of _entryScripts) {
                        entryScripts.add(value);
                      }
                    }
                  }
                }
              }
            }
            let newCode = chunk.code;
            if (entryStyles.size) {
              newCode = newCode.replace(
                JSON.stringify(STYLES_PLACEHOLDER),
                JSON.stringify(Array.from(entryStyles))
              );
            } else {
              newCode = newCode.replace(JSON.stringify(STYLES_PLACEHOLDER), "[]");
            }
            if (entryLinks.size) {
              newCode = newCode.replace(
                JSON.stringify(LINKS_PLACEHOLDER),
                JSON.stringify(Array.from(entryLinks).map(prependBase))
              );
            } else {
              newCode = newCode.replace(JSON.stringify(LINKS_PLACEHOLDER), "[]");
            }
            if (entryScripts.size) {
              const entryFileNames = /* @__PURE__ */ new Set();
              for (const output of clientOutputs) {
                for (const clientChunk of output.output) {
                  if (clientChunk.type !== "chunk")
                    continue;
                  for (const [id] of Object.entries(clientChunk.modules)) {
                    if (entryScripts.has(id)) {
                      entryFileNames.add(clientChunk.fileName);
                    }
                  }
                }
              }
              newCode = newCode.replace(
                JSON.stringify(SCRIPTS_PLACEHOLDER),
                JSON.stringify(
                  [...entryFileNames].map((src) => ({
                    props: {
                      src: prependBase(src),
                      type: "module"
                    },
                    children: ""
                  }))
                )
              );
            } else {
              newCode = newCode.replace(JSON.stringify(SCRIPTS_PLACEHOLDER), "[]");
            }
            mutate(chunk, ["server"], newCode);
          }
        }
      }
    }
  };
}
export {
  astroConfigBuildPlugin,
  astroContentAssetPropagationPlugin
};
