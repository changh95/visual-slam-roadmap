import ancestor from "common-ancestor-path";
import { fileURLToPath } from "node:url";
import {
  appendExtension,
  appendForwardSlash,
  removeLeadingForwardSlashWindows
} from "../core/path.js";
import { viteID } from "../core/util.js";
function getFileInfo(id, config) {
  const sitePathname = appendForwardSlash(
    config.site ? new URL(config.base, config.site).pathname : config.base
  );
  const fileId = id.split("?")[0];
  let fileUrl = fileId.includes("/pages/") ? fileId.replace(/^.*?\/pages\//, sitePathname).replace(/(\/index)?\.(md|markdown|mdown|mkdn|mkd|mdwn|md|astro)$/, "") : void 0;
  if (fileUrl && config.trailingSlash === "always") {
    fileUrl = appendForwardSlash(fileUrl);
  }
  if (fileUrl && config.build.format === "file") {
    fileUrl = appendExtension(fileUrl, "html");
  }
  return { fileId, fileUrl };
}
function normalizeFilename(filename, root) {
  if (filename.startsWith("/@fs")) {
    filename = filename.slice("/@fs".length);
  } else if (filename.startsWith("/") && !ancestor(filename, fileURLToPath(root))) {
    const url = new URL("." + filename, root);
    filename = viteID(url);
  }
  return removeLeadingForwardSlashWindows(filename);
}
const postfixRE = /[?#].*$/s;
function cleanUrl(url) {
  return url.replace(postfixRE, "");
}
export {
  cleanUrl,
  getFileInfo,
  normalizeFilename
};
