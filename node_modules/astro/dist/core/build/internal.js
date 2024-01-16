import { prependForwardSlash, removeFileExtension } from "../path.js";
import { viteID } from "../util.js";
import {
  ASTRO_PAGE_RESOLVED_MODULE_ID,
  getVirtualModulePageIdFromPath
} from "./plugins/plugin-pages.js";
import { RESOLVED_SPLIT_MODULE_ID } from "./plugins/plugin-ssr.js";
import { ASTRO_PAGE_EXTENSION_POST_PATTERN } from "./plugins/util.js";
function createBuildInternals() {
  const hoistedScriptIdToHoistedMap = /* @__PURE__ */ new Map();
  const hoistedScriptIdToPagesMap = /* @__PURE__ */ new Map();
  return {
    cachedClientEntries: [],
    cssModuleToChunkIdMap: /* @__PURE__ */ new Map(),
    hoistedScriptIdToHoistedMap,
    hoistedScriptIdToPagesMap,
    entrySpecifierToBundleMap: /* @__PURE__ */ new Map(),
    pageToBundleMap: /* @__PURE__ */ new Map(),
    pagesByComponent: /* @__PURE__ */ new Map(),
    pageOptionsByPage: /* @__PURE__ */ new Map(),
    pagesByViteID: /* @__PURE__ */ new Map(),
    pagesByClientOnly: /* @__PURE__ */ new Map(),
    propagatedStylesMap: /* @__PURE__ */ new Map(),
    propagatedScriptsMap: /* @__PURE__ */ new Map(),
    discoveredHydratedComponents: /* @__PURE__ */ new Map(),
    discoveredClientOnlyComponents: /* @__PURE__ */ new Map(),
    discoveredScripts: /* @__PURE__ */ new Set(),
    staticFiles: /* @__PURE__ */ new Set(),
    componentMetadata: /* @__PURE__ */ new Map(),
    ssrSplitEntryChunks: /* @__PURE__ */ new Map(),
    entryPoints: /* @__PURE__ */ new Map()
  };
}
function trackPageData(internals, component, pageData, componentModuleId, componentURL) {
  pageData.moduleSpecifier = componentModuleId;
  internals.pagesByComponent.set(component, pageData);
  internals.pagesByViteID.set(viteID(componentURL), pageData);
}
function trackClientOnlyPageDatas(internals, pageData, clientOnlys) {
  for (const clientOnlyComponent of clientOnlys) {
    let pageDataSet;
    if (internals.pagesByClientOnly.has(clientOnlyComponent)) {
      pageDataSet = internals.pagesByClientOnly.get(clientOnlyComponent);
    } else {
      pageDataSet = /* @__PURE__ */ new Set();
      internals.pagesByClientOnly.set(clientOnlyComponent, pageDataSet);
    }
    pageDataSet.add(pageData);
  }
}
function* getPageDatasByChunk(internals, chunk) {
  const pagesByViteID = internals.pagesByViteID;
  for (const [modulePath] of Object.entries(chunk.modules)) {
    if (pagesByViteID.has(modulePath)) {
      yield pagesByViteID.get(modulePath);
    }
  }
}
function* getPageDatasByClientOnlyID(internals, viteid) {
  const pagesByClientOnly = internals.pagesByClientOnly;
  if (pagesByClientOnly.size) {
    let pageBuildDatas = pagesByClientOnly.get(viteid);
    if (!pageBuildDatas) {
      let pathname = `/@fs${prependForwardSlash(viteid)}`;
      pageBuildDatas = pagesByClientOnly.get(pathname);
    }
    if (!pageBuildDatas) {
      let pathname = `/@fs${prependForwardSlash(removeFileExtension(viteid))}`;
      pageBuildDatas = pagesByClientOnly.get(pathname);
    }
    if (pageBuildDatas) {
      for (const pageData of pageBuildDatas) {
        yield pageData;
      }
    }
  }
}
function getPageDataByComponent(internals, component) {
  if (internals.pagesByComponent.has(component)) {
    return internals.pagesByComponent.get(component);
  }
  return void 0;
}
function getPageDataByViteID(internals, viteid) {
  if (internals.pagesByViteID.has(viteid)) {
    return internals.pagesByViteID.get(viteid);
  }
  return void 0;
}
function hasPageDataByViteID(internals, viteid) {
  return internals.pagesByViteID.has(viteid);
}
function* eachPageData(internals) {
  yield* internals.pagesByComponent.values();
}
function* eachPageFromAllPages(allPages) {
  for (const [path, pageData] of Object.entries(allPages)) {
    yield [path, pageData];
  }
}
function* eachPageDataFromEntryPoint(internals) {
  for (const [entrypoint, filePath] of internals.entrySpecifierToBundleMap) {
    if (entrypoint.includes(ASTRO_PAGE_RESOLVED_MODULE_ID) || entrypoint.includes(RESOLVED_SPLIT_MODULE_ID)) {
      const [, pageName] = entrypoint.split(":");
      const pageData = internals.pagesByComponent.get(
        `${pageName.replace(ASTRO_PAGE_EXTENSION_POST_PATTERN, ".")}`
      );
      if (!pageData) {
        throw new Error(
          "Build failed. Astro couldn't find the emitted page from " + pageName + " pattern"
        );
      }
      yield [pageData, filePath];
    }
  }
}
function hasPrerenderedPages(internals) {
  for (const pageData of eachPageData(internals)) {
    if (pageData.route.prerender) {
      return true;
    }
  }
  return false;
}
function cssOrder(a, b) {
  let depthA = a.depth, depthB = b.depth, orderA = a.order, orderB = b.order;
  if (orderA === -1 && orderB >= 0) {
    return 1;
  } else if (orderB === -1 && orderA >= 0) {
    return -1;
  } else if (orderA > orderB) {
    return 1;
  } else if (orderA < orderB) {
    return -1;
  } else {
    if (depthA === -1) {
      return -1;
    } else if (depthB === -1) {
      return 1;
    } else {
      return depthA > depthB ? -1 : 1;
    }
  }
}
function mergeInlineCss(acc, current) {
  const lastAdded = acc.at(acc.length - 1);
  const lastWasInline = lastAdded?.type === "inline";
  const currentIsInline = current?.type === "inline";
  if (lastWasInline && currentIsInline) {
    const merged = { type: "inline", content: lastAdded.content + current.content };
    acc[acc.length - 1] = merged;
    return acc;
  }
  acc.push(current);
  return acc;
}
function isHoistedScript(internals, id) {
  return internals.hoistedScriptIdToPagesMap.has(id);
}
function* getPageDatasByHoistedScriptId(internals, id) {
  const set = internals.hoistedScriptIdToPagesMap.get(id);
  if (set) {
    for (const pageId of set) {
      const pageData = getPageDataByComponent(internals, pageId.slice(1));
      if (pageData) {
        yield pageData;
      }
    }
  }
}
function getEntryFilePathFromComponentPath(internals, path) {
  const id = getVirtualModulePageIdFromPath(path);
  return internals.entrySpecifierToBundleMap.get(id);
}
export {
  createBuildInternals,
  cssOrder,
  eachPageData,
  eachPageDataFromEntryPoint,
  eachPageFromAllPages,
  getEntryFilePathFromComponentPath,
  getPageDataByComponent,
  getPageDataByViteID,
  getPageDatasByChunk,
  getPageDatasByClientOnlyID,
  getPageDatasByHoistedScriptId,
  hasPageDataByViteID,
  hasPrerenderedPages,
  isHoistedScript,
  mergeInlineCss,
  trackClientOnlyPageDatas,
  trackPageData
};
