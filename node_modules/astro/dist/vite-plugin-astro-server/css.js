import { viteID } from "../core/util.js";
import { isBuildableCSSRequest } from "./util.js";
import { crawlGraph } from "./vite.js";
async function getStylesForURL(filePath, loader) {
  const importedCssUrls = /* @__PURE__ */ new Set();
  const importedStylesMap = /* @__PURE__ */ new Map();
  for await (const importedModule of crawlGraph(loader, viteID(filePath), true)) {
    if (isBuildableCSSRequest(importedModule.url)) {
      let css = "";
      if (typeof importedModule.ssrModule?.default === "string") {
        css = importedModule.ssrModule.default;
      } else {
        const url = new URL(importedModule.url, "http://localhost");
        url.searchParams.set("inline", "");
        const modId = `${decodeURI(url.pathname)}${url.search}`;
        try {
          const ssrModule = await loader.import(modId);
          css = ssrModule.default;
        } catch {
          if (modId.includes(".module.")) {
            importedCssUrls.add(importedModule.url);
          }
          continue;
        }
      }
      importedStylesMap.set(importedModule.url, {
        id: importedModule.id ?? importedModule.url,
        url: importedModule.url,
        content: css
      });
    }
  }
  return {
    urls: importedCssUrls,
    styles: [...importedStylesMap.values()]
  };
}
export {
  getStylesForURL
};
