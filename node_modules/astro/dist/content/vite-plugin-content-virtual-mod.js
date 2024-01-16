import glob from "fast-glob";
import nodeFs from "node:fs";
import { extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pLimit from "p-limit";
import {} from "vite";
import { encodeName } from "../core/build/util.js";
import { AstroError, AstroErrorData } from "../core/errors/index.js";
import { appendForwardSlash, removeFileExtension } from "../core/path.js";
import { rootRelativePath } from "../core/util.js";
import { isServerLikeOutput } from "../prerender/utils.js";
import {
  CONTENT_FLAG,
  CONTENT_RENDER_FLAG,
  DATA_FLAG,
  RESOLVED_VIRTUAL_MODULE_ID,
  VIRTUAL_MODULE_ID
} from "./consts.js";
import {
  getContentEntryIdAndSlug,
  getContentPaths,
  getDataEntryExts,
  getDataEntryId,
  getEntryCollectionName,
  getEntryConfigByExtMap,
  getEntrySlug,
  getEntryType,
  getExtGlob
} from "./utils.js";
function astroContentVirtualModPlugin({
  settings,
  fs
}) {
  let IS_DEV = false;
  const IS_SERVER = isServerLikeOutput(settings.config);
  return {
    name: "astro-content-virtual-mod-plugin",
    enforce: "pre",
    configResolved(config) {
      IS_DEV = config.mode === "development";
    },
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        if (!settings.config.experimental.contentCollectionCache) {
          return RESOLVED_VIRTUAL_MODULE_ID;
        }
        if (IS_DEV || IS_SERVER) {
          return RESOLVED_VIRTUAL_MODULE_ID;
        } else {
          return { id: RESOLVED_VIRTUAL_MODULE_ID, external: true };
        }
      }
    },
    async load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const lookupMap = await generateLookupMap({
          settings,
          fs
        });
        const code = await generateContentEntryFile({ settings, fs, lookupMap, IS_DEV, IS_SERVER });
        return {
          code,
          meta: {
            astro: {
              hydratedComponents: [],
              clientOnlyComponents: [],
              scripts: [],
              containsHead: false,
              propagation: "in-tree",
              pageOptions: {}
            }
          }
        };
      }
    },
    renderChunk(code, chunk) {
      if (!settings.config.experimental.contentCollectionCache) {
        return;
      }
      if (code.includes(RESOLVED_VIRTUAL_MODULE_ID)) {
        const depth = chunk.fileName.split("/").length - 1;
        const prefix = depth > 0 ? "../".repeat(depth) : "./";
        return code.replaceAll(RESOLVED_VIRTUAL_MODULE_ID, `${prefix}content/entry.mjs`);
      }
    }
  };
}
async function generateContentEntryFile({
  settings,
  lookupMap,
  IS_DEV,
  IS_SERVER
}) {
  const contentPaths = getContentPaths(settings.config);
  const relContentDir = rootRelativePath(settings.config.root, contentPaths.contentDir);
  let contentEntryGlobResult;
  let dataEntryGlobResult;
  let renderEntryGlobResult;
  if (IS_DEV || IS_SERVER || !settings.config.experimental.contentCollectionCache) {
    const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
    const contentEntryExts = [...contentEntryConfigByExt.keys()];
    const dataEntryExts = getDataEntryExts(settings);
    const createGlob = (value, flag) => `import.meta.glob(${JSON.stringify(value)}, { query: { ${flag}: true } })`;
    contentEntryGlobResult = createGlob(
      globWithUnderscoresIgnored(relContentDir, contentEntryExts),
      CONTENT_FLAG
    );
    dataEntryGlobResult = createGlob(
      globWithUnderscoresIgnored(relContentDir, dataEntryExts),
      DATA_FLAG
    );
    renderEntryGlobResult = createGlob(
      globWithUnderscoresIgnored(relContentDir, contentEntryExts),
      CONTENT_RENDER_FLAG
    );
  } else {
    contentEntryGlobResult = getStringifiedCollectionFromLookup(
      "content",
      relContentDir,
      lookupMap
    );
    dataEntryGlobResult = getStringifiedCollectionFromLookup("data", relContentDir, lookupMap);
    renderEntryGlobResult = getStringifiedCollectionFromLookup("render", relContentDir, lookupMap);
  }
  const virtualModContents = nodeFs.readFileSync(contentPaths.virtualModTemplate, "utf-8").replace("@@CONTENT_DIR@@", relContentDir).replace("'@@CONTENT_ENTRY_GLOB_PATH@@'", contentEntryGlobResult).replace("'@@DATA_ENTRY_GLOB_PATH@@'", dataEntryGlobResult).replace("'@@RENDER_ENTRY_GLOB_PATH@@'", renderEntryGlobResult).replace("/* @@LOOKUP_MAP_ASSIGNMENT@@ */", `lookupMap = ${JSON.stringify(lookupMap)};`);
  return virtualModContents;
}
function getStringifiedCollectionFromLookup(wantedType, relContentDir, lookupMap) {
  let str = "{";
  let normalize = (slug) => slug;
  if (process.env.NODE_ENV === "production") {
    const suffix = wantedType === "render" ? ".entry.mjs" : ".mjs";
    normalize = (slug) => `${removeFileExtension(encodeName(slug)).replace(relContentDir, "./")}${suffix}`;
  } else {
    let suffix = "";
    if (wantedType === "content")
      suffix = CONTENT_FLAG;
    else if (wantedType === "data")
      suffix = DATA_FLAG;
    else if (wantedType === "render")
      suffix = CONTENT_RENDER_FLAG;
    normalize = (slug) => `${slug}?${suffix}`;
  }
  for (const { type, entries } of Object.values(lookupMap)) {
    if (type === wantedType || wantedType === "render" && type === "content") {
      for (const slug of Object.values(entries)) {
        str += `
  "${slug}": () => import("${normalize(slug)}"),`;
      }
    }
  }
  str += "\n}";
  return str;
}
async function generateLookupMap({
  settings,
  fs
}) {
  const { root } = settings.config;
  const contentPaths = getContentPaths(settings.config);
  const relContentDir = rootRelativePath(root, contentPaths.contentDir, false);
  const contentEntryConfigByExt = getEntryConfigByExtMap(settings.contentEntryTypes);
  const dataEntryExts = getDataEntryExts(settings);
  const { contentDir } = contentPaths;
  const contentEntryExts = [...contentEntryConfigByExt.keys()];
  let lookupMap = {};
  const contentGlob = await glob(
    `${relContentDir}**/*${getExtGlob([...dataEntryExts, ...contentEntryExts])}`,
    {
      absolute: true,
      cwd: fileURLToPath(root),
      fs
    }
  );
  const limit = pLimit(10);
  const promises = [];
  for (const filePath of contentGlob) {
    promises.push(
      limit(async () => {
        const entryType = getEntryType(filePath, contentPaths, contentEntryExts, dataEntryExts);
        if (entryType !== "content" && entryType !== "data")
          return;
        const collection = getEntryCollectionName({ contentDir, entry: pathToFileURL(filePath) });
        if (!collection)
          throw UnexpectedLookupMapError;
        if (lookupMap[collection]?.type && lookupMap[collection].type !== entryType) {
          throw new AstroError({
            ...AstroErrorData.MixedContentDataCollectionError,
            message: AstroErrorData.MixedContentDataCollectionError.message(collection)
          });
        }
        if (entryType === "content") {
          const contentEntryType = contentEntryConfigByExt.get(extname(filePath));
          if (!contentEntryType)
            throw UnexpectedLookupMapError;
          const { id, slug: generatedSlug } = await getContentEntryIdAndSlug({
            entry: pathToFileURL(filePath),
            contentDir,
            collection
          });
          const slug = await getEntrySlug({
            id,
            collection,
            generatedSlug,
            fs,
            fileUrl: pathToFileURL(filePath),
            contentEntryType
          });
          if (lookupMap[collection]?.entries?.[slug]) {
            throw new AstroError({
              ...AstroErrorData.DuplicateContentEntrySlugError,
              message: AstroErrorData.DuplicateContentEntrySlugError.message(
                collection,
                slug,
                lookupMap[collection].entries[slug],
                rootRelativePath(root, filePath)
              ),
              hint: slug !== generatedSlug ? `Check the \`slug\` frontmatter property in **${id}**.` : void 0
            });
          }
          lookupMap[collection] = {
            type: "content",
            entries: {
              ...lookupMap[collection]?.entries,
              [slug]: rootRelativePath(root, filePath)
            }
          };
        } else {
          const id = getDataEntryId({ entry: pathToFileURL(filePath), contentDir, collection });
          lookupMap[collection] = {
            type: "data",
            entries: {
              ...lookupMap[collection]?.entries,
              [id]: rootRelativePath(root, filePath)
            }
          };
        }
      })
    );
  }
  await Promise.all(promises);
  return lookupMap;
}
function globWithUnderscoresIgnored(relContentDir, exts) {
  const extGlob = getExtGlob(exts);
  const contentDir = appendForwardSlash(relContentDir);
  return [
    `${contentDir}**/*${extGlob}`,
    `!${contentDir}**/_*/**/*${extGlob}`,
    `!${contentDir}**/_*${extGlob}`
  ];
}
const UnexpectedLookupMapError = new AstroError({
  ...AstroErrorData.UnknownContentCollectionError,
  message: `Unexpected error while parsing content entry IDs and slugs.`
});
export {
  astroContentVirtualModPlugin,
  generateContentEntryFile,
  generateLookupMap
};
