import { PROPAGATED_ASSET_FLAG } from "../../../content/consts.js";
import { prependForwardSlash } from "../../../core/path.js";
import { getTopLevelPages, moduleIsTopLevelPage, walkParentInfos } from "../graph.js";
import { getPageDataByViteID, trackClientOnlyPageDatas } from "../internal.js";
function isPropagatedAsset(id) {
  try {
    return new URL("file://" + id).searchParams.has(PROPAGATED_ASSET_FLAG);
  } catch {
    return false;
  }
}
async function doesParentImportChild(parentInfo, childInfo, childExportNames) {
  if (!childInfo || !parentInfo.ast || !childExportNames)
    return "no";
  if (childExportNames === "dynamic" || parentInfo.dynamicallyImportedIds?.includes(childInfo.id)) {
    return "dynamic";
  }
  const imports = [];
  const exports = [];
  for (const node of parentInfo.ast.body) {
    if (node.type === "ImportDeclaration") {
      imports.push(node);
    } else if (node.type === "ExportDefaultDeclaration" || node.type === "ExportNamedDeclaration") {
      exports.push(node);
    }
  }
  const importNames = [];
  const exportNames = [];
  for (const node of imports) {
    const resolved = await this.resolve(node.source.value, parentInfo.id);
    if (!resolved || resolved.id !== childInfo.id)
      continue;
    for (const specifier of node.specifiers) {
      if (specifier.type === "ImportNamespaceSpecifier")
        continue;
      const name = specifier.type === "ImportDefaultSpecifier" ? "default" : specifier.imported.name;
      if (childExportNames.includes(name)) {
        importNames.push(specifier.local.name);
      }
    }
  }
  for (const node of exports) {
    if (node.type === "ExportDefaultDeclaration") {
      if (node.declaration.type === "Identifier" && importNames.includes(node.declaration.name)) {
        exportNames.push("default");
      }
    } else {
      if (node.source) {
        const resolved = await this.resolve(node.source.value, parentInfo.id);
        if (!resolved || resolved.id !== childInfo.id)
          continue;
        for (const specifier of node.specifiers) {
          if (childExportNames.includes(specifier.local.name)) {
            importNames.push(specifier.local.name);
            exportNames.push(specifier.exported.name);
          }
        }
      }
      if (node.declaration) {
        if (node.declaration.type !== "VariableDeclaration")
          continue;
        for (const declarator of node.declaration.declarations) {
          if (declarator.init?.type !== "Identifier")
            continue;
          if (declarator.id.type !== "Identifier")
            continue;
          if (importNames.includes(declarator.init.name)) {
            exportNames.push(declarator.id.name);
          }
        }
      }
      for (const specifier of node.specifiers) {
        if (importNames.includes(specifier.local.name)) {
          exportNames.push(specifier.exported.name);
        }
      }
    }
  }
  if (!importNames.length)
    return "no";
  if (parentInfo.id.endsWith(".astro")) {
    exportNames.push("default");
  } else if (parentInfo.id.endsWith(".mdx")) {
    exportNames.push("Content");
  }
  return exportNames;
}
function vitePluginAnalyzer(options, internals) {
  function hoistedScriptScanner() {
    const uniqueHoistedIds = /* @__PURE__ */ new Map();
    const pageScripts = /* @__PURE__ */ new Map();
    return {
      async scan(scripts, from) {
        const hoistedScripts = /* @__PURE__ */ new Set();
        for (let i = 0; i < scripts.length; i++) {
          const hid = `${from.replace("/@fs", "")}?astro&type=script&index=${i}&lang.ts`;
          hoistedScripts.add(hid);
        }
        if (hoistedScripts.size) {
          const depthsToChildren = /* @__PURE__ */ new Map();
          const depthsToExportNames = /* @__PURE__ */ new Map();
          depthsToExportNames.set(0, ["default"]);
          for (const [parentInfo, depth] of walkParentInfos(from, this, function until(importer) {
            return isPropagatedAsset(importer);
          })) {
            if (options.settings.config.experimental.optimizeHoistedScript) {
              depthsToChildren.set(depth, parentInfo);
              if (depth > 0) {
                const childInfo = depthsToChildren.get(depth - 1);
                const childExportNames = depthsToExportNames.get(depth - 1);
                const doesImport = await doesParentImportChild.call(
                  this,
                  parentInfo,
                  childInfo,
                  childExportNames
                );
                if (doesImport === "no") {
                  continue;
                }
                depthsToExportNames.set(depth, doesImport);
              }
            }
            if (isPropagatedAsset(parentInfo.id)) {
              for (const [nestedParentInfo] of walkParentInfos(from, this)) {
                if (moduleIsTopLevelPage(nestedParentInfo)) {
                  for (const hid of hoistedScripts) {
                    if (!pageScripts.has(nestedParentInfo.id)) {
                      pageScripts.set(nestedParentInfo.id, {
                        hoistedSet: /* @__PURE__ */ new Set(),
                        propagatedMapByImporter: /* @__PURE__ */ new Map()
                      });
                    }
                    const entry = pageScripts.get(nestedParentInfo.id);
                    if (!entry.propagatedMapByImporter.has(parentInfo.id)) {
                      entry.propagatedMapByImporter.set(parentInfo.id, /* @__PURE__ */ new Set());
                    }
                    entry.propagatedMapByImporter.get(parentInfo.id).add(hid);
                  }
                }
              }
            } else if (moduleIsTopLevelPage(parentInfo)) {
              for (const hid of hoistedScripts) {
                if (!pageScripts.has(parentInfo.id)) {
                  pageScripts.set(parentInfo.id, {
                    hoistedSet: /* @__PURE__ */ new Set(),
                    propagatedMapByImporter: /* @__PURE__ */ new Map()
                  });
                }
                pageScripts.get(parentInfo.id)?.hoistedSet.add(hid);
              }
            }
          }
        }
      },
      finalize() {
        for (const [pageId, { hoistedSet, propagatedMapByImporter }] of pageScripts) {
          const pageData = getPageDataByViteID(internals, pageId);
          if (!pageData)
            continue;
          const { component } = pageData;
          const astroModuleId = prependForwardSlash(component);
          const uniqueHoistedId = JSON.stringify(Array.from(hoistedSet).sort());
          let moduleId;
          if (uniqueHoistedIds.has(uniqueHoistedId)) {
            moduleId = uniqueHoistedIds.get(uniqueHoistedId);
          } else {
            moduleId = `/astro/hoisted.js?q=${uniqueHoistedIds.size}`;
            uniqueHoistedIds.set(uniqueHoistedId, moduleId);
          }
          internals.discoveredScripts.add(moduleId);
          pageData.propagatedScripts = propagatedMapByImporter;
          for (const propagatedScripts of propagatedMapByImporter.values()) {
            for (const propagatedScript of propagatedScripts) {
              internals.discoveredScripts.add(propagatedScript);
            }
          }
          if (internals.hoistedScriptIdToPagesMap.has(moduleId)) {
            const pages = internals.hoistedScriptIdToPagesMap.get(moduleId);
            pages.add(astroModuleId);
          } else {
            internals.hoistedScriptIdToPagesMap.set(moduleId, /* @__PURE__ */ new Set([astroModuleId]));
            internals.hoistedScriptIdToHoistedMap.set(moduleId, hoistedSet);
          }
        }
      }
    };
  }
  return {
    name: "@astro/rollup-plugin-astro-analyzer",
    async generateBundle() {
      const hoistScanner = hoistedScriptScanner();
      const ids = this.getModuleIds();
      for (const id of ids) {
        const info = this.getModuleInfo(id);
        if (!info?.meta?.astro)
          continue;
        const astro = info.meta.astro;
        const pageData = getPageDataByViteID(internals, id);
        if (pageData) {
          internals.pageOptionsByPage.set(id, astro.pageOptions);
        }
        for (const c of astro.hydratedComponents) {
          const rid = c.resolvedPath ? decodeURI(c.resolvedPath) : c.specifier;
          if (internals.discoveredHydratedComponents.has(rid)) {
            const exportNames = internals.discoveredHydratedComponents.get(rid);
            exportNames?.push(c.exportName);
          } else {
            internals.discoveredHydratedComponents.set(rid, [c.exportName]);
          }
        }
        await hoistScanner.scan.call(this, astro.scripts, id);
        if (astro.clientOnlyComponents.length) {
          const clientOnlys = [];
          for (const c of astro.clientOnlyComponents) {
            const cid = c.resolvedPath ? decodeURI(c.resolvedPath) : c.specifier;
            if (internals.discoveredClientOnlyComponents.has(cid)) {
              const exportNames = internals.discoveredClientOnlyComponents.get(cid);
              exportNames?.push(c.exportName);
            } else {
              internals.discoveredClientOnlyComponents.set(cid, [c.exportName]);
            }
            clientOnlys.push(cid);
            const resolvedId = await this.resolve(c.specifier, id);
            if (resolvedId) {
              clientOnlys.push(resolvedId.id);
            }
          }
          for (const [pageInfo] of getTopLevelPages(id, this)) {
            const newPageData = getPageDataByViteID(internals, pageInfo.id);
            if (!newPageData)
              continue;
            trackClientOnlyPageDatas(internals, newPageData, clientOnlys);
          }
        }
      }
      hoistScanner.finalize();
    }
  };
}
function pluginAnalyzer(options, internals) {
  return {
    targets: ["server"],
    hooks: {
      "build:before": () => {
        return {
          vitePlugin: vitePluginAnalyzer(options, internals)
        };
      }
    }
  };
}
export {
  pluginAnalyzer,
  vitePluginAnalyzer
};
