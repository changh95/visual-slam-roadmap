import { extname } from "node:path";
function extendManualChunks(outputOptions, hooks) {
  const manualChunks = outputOptions.manualChunks;
  outputOptions.manualChunks = function(id, meta) {
    if (hooks.before) {
      let value = hooks.before(id, meta);
      if (value) {
        return value;
      }
    }
    if (typeof manualChunks == "object") {
      if (id in manualChunks) {
        let value = manualChunks[id];
        return value[0];
      }
    } else if (typeof manualChunks === "function") {
      const outid = manualChunks.call(this, id, meta);
      if (outid) {
        return outid;
      }
    }
    if (hooks.after) {
      return hooks.after(id, meta) || null;
    }
    return null;
  };
}
const ASTRO_PAGE_EXTENSION_POST_PATTERN = "@_@";
function getVirtualModulePageNameFromPath(virtualModulePrefix, path) {
  const extension = extname(path);
  return `${virtualModulePrefix}${path.replace(
    extension,
    extension.replace(".", ASTRO_PAGE_EXTENSION_POST_PATTERN)
  )}`;
}
function getPathFromVirtualModulePageName(virtualModulePrefix, id) {
  const pageName = id.slice(virtualModulePrefix.length);
  return pageName.replace(ASTRO_PAGE_EXTENSION_POST_PATTERN, ".");
}
export {
  ASTRO_PAGE_EXTENSION_POST_PATTERN,
  extendManualChunks,
  getPathFromVirtualModulePageName,
  getVirtualModulePageNameFromPath
};
