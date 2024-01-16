import { isRemotePath, removeQueryString } from "@astrojs/internal-helpers/path";
import { readFile } from "fs/promises";
import mime from "mime/lite.js";
import os from "os";
import { getConfiguredImageService } from "../internal.js";
import { etag } from "../utils/etag.js";
import { assetsDir, imageConfig } from "astro:assets";
import { isRemoteAllowed } from "../utils/remotePattern.js";
function replaceFileSystemReferences(src) {
  return os.platform().includes("win32") ? src.replace(/^\/@fs\//, "") : src.replace(/^\/@fs/, "");
}
async function loadLocalImage(src, url) {
  const filePath = import.meta.env.DEV ? removeQueryString(replaceFileSystemReferences(src)) : new URL("." + src, assetsDir);
  let buffer = void 0;
  try {
    buffer = await readFile(filePath);
  } catch (e) {
    const sourceUrl = new URL(src, url.origin);
    buffer = await loadRemoteImage(sourceUrl);
  }
  return buffer;
}
async function loadRemoteImage(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) {
      return void 0;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    return void 0;
  }
}
const GET = async ({ request }) => {
  try {
    const imageService = await getConfiguredImageService();
    if (!("transform" in imageService)) {
      throw new Error("Configured image service is not a local service");
    }
    const url = new URL(request.url);
    const transform = await imageService.parseURL(url, imageConfig);
    if (!transform?.src) {
      throw new Error("Incorrect transform returned by `parseURL`");
    }
    let inputBuffer = void 0;
    if (isRemotePath(transform.src)) {
      if (isRemoteAllowed(transform.src, imageConfig) === false) {
        return new Response("Forbidden", { status: 403 });
      }
      inputBuffer = await loadRemoteImage(new URL(transform.src));
    } else {
      inputBuffer = await loadLocalImage(transform.src, url);
    }
    if (!inputBuffer) {
      return new Response("Not Found", { status: 404 });
    }
    const { data, format } = await imageService.transform(inputBuffer, transform, imageConfig);
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": mime.getType(format) ?? `image/${format}`,
        "Cache-Control": "public, max-age=31536000",
        ETag: etag(data.toString()),
        Date: (/* @__PURE__ */ new Date()).toUTCString()
      }
    });
  } catch (err) {
    console.error("Could not process image request:", err);
    return new Response(`Server Error: ${err}`, { status: 500 });
  }
};
export {
  GET
};
