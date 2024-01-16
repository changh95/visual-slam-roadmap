import { ASTRO_PAGE_RESOLVED_MODULE_ID } from "./plugins/plugin-pages.js";
function* walkParentInfos(id, ctx, until, depth = 0, order = 0, seen = /* @__PURE__ */ new Set(), childId = "") {
  seen.add(id);
  const info = ctx.getModuleInfo(id);
  if (info) {
    if (childId) {
      const idx = info.importedIds.indexOf(childId);
      if (idx === -1) {
        order += info.importedIds.length;
        order += info.dynamicallyImportedIds.indexOf(childId);
      } else {
        order += idx;
      }
    }
    yield [info, depth, order];
  }
  if (until?.(id))
    return;
  const importers = (info?.importers || []).concat(info?.dynamicImporters || []);
  for (const imp of importers) {
    if (seen.has(imp)) {
      continue;
    }
    yield* walkParentInfos(imp, ctx, until, depth + 1, order, seen, id);
  }
}
function moduleIsTopLevelPage(info) {
  return info.importers[0]?.includes(ASTRO_PAGE_RESOLVED_MODULE_ID) || info.dynamicImporters[0]?.includes(ASTRO_PAGE_RESOLVED_MODULE_ID);
}
function* getTopLevelPages(id, ctx) {
  for (const res of walkParentInfos(id, ctx)) {
    if (moduleIsTopLevelPage(res[0])) {
      yield res;
    }
  }
}
export {
  getTopLevelPages,
  moduleIsTopLevelPage,
  walkParentInfos
};
