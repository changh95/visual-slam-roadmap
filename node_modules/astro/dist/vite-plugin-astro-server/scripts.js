import { createModuleScriptElementWithSrc } from "../core/render/ssr-element.js";
import { rootRelativePath, viteID } from "../core/util.js";
import { crawlGraph } from "./vite.js";
async function getScriptsForURL(filePath, root, loader) {
  const elements = /* @__PURE__ */ new Set();
  const rootID = viteID(filePath);
  const modInfo = loader.getModuleInfo(rootID);
  addHoistedScripts(elements, modInfo, root);
  for await (const moduleNode of crawlGraph(loader, rootID, true)) {
    const id = moduleNode.id;
    if (id) {
      const info = loader.getModuleInfo(id);
      addHoistedScripts(elements, info, root);
    }
  }
  return elements;
}
function addHoistedScripts(set, info, root) {
  if (!info?.meta?.astro) {
    return;
  }
  let id = info.id;
  const astro = info?.meta?.astro;
  for (let i = 0; i < astro.scripts.length; i++) {
    let scriptId = `${id}?astro&type=script&index=${i}&lang.ts`;
    scriptId = rootRelativePath(root, scriptId);
    const element = createModuleScriptElementWithSrc(scriptId);
    set.add(element);
  }
}
export {
  getScriptsForURL
};
