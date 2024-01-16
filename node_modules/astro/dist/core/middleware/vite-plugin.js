import { normalizePath } from "vite";
import { getOutputDirectory } from "../../prerender/utils.js";
import { addRollupInput } from "../build/add-rollup-input.js";
import { MIDDLEWARE_PATH_SEGMENT_NAME } from "../constants.js";
const MIDDLEWARE_MODULE_ID = "\0astro-internal:middleware";
const EMPTY_MIDDLEWARE = "\0empty-middleware";
function vitePluginMiddleware({ settings }) {
  let isCommandBuild = false;
  let resolvedMiddlewareId = void 0;
  const hasIntegrationMiddleware = settings.middlewares.pre.length > 0 || settings.middlewares.post.length > 0;
  let userMiddlewareIsPresent = false;
  return {
    name: "@astro/plugin-middleware",
    config(opts, { command }) {
      isCommandBuild = command === "build";
      return opts;
    },
    async resolveId(id) {
      if (id === MIDDLEWARE_MODULE_ID) {
        const middlewareId = await this.resolve(
          `${decodeURI(settings.config.srcDir.pathname)}${MIDDLEWARE_PATH_SEGMENT_NAME}`
        );
        userMiddlewareIsPresent = !!middlewareId;
        if (middlewareId) {
          resolvedMiddlewareId = middlewareId.id;
          return MIDDLEWARE_MODULE_ID;
        } else if (hasIntegrationMiddleware) {
          return MIDDLEWARE_MODULE_ID;
        } else {
          return EMPTY_MIDDLEWARE;
        }
      }
      if (id === EMPTY_MIDDLEWARE) {
        return EMPTY_MIDDLEWARE;
      }
    },
    async load(id) {
      if (id === EMPTY_MIDDLEWARE) {
        return "export const onRequest = undefined";
      } else if (id === MIDDLEWARE_MODULE_ID) {
        if (isCommandBuild) {
          this.emitFile({
            type: "chunk",
            preserveSignature: "strict",
            fileName: "middleware.mjs",
            id
          });
        }
        const preMiddleware = createMiddlewareImports(settings.middlewares.pre, "pre");
        const postMiddleware = createMiddlewareImports(settings.middlewares.post, "post");
        const source = `
				${userMiddlewareIsPresent ? `import { onRequest as userOnRequest } from '${resolvedMiddlewareId}';` : ""}
import { sequence } from 'astro:middleware';
${preMiddleware.importsCode}${postMiddleware.importsCode}

export const onRequest = sequence(
	${preMiddleware.sequenceCode}${preMiddleware.sequenceCode ? "," : ""}
	${userMiddlewareIsPresent ? `userOnRequest${postMiddleware.sequenceCode ? "," : ""}` : ""}
	${postMiddleware.sequenceCode}
);
`.trim();
        return source;
      }
    }
  };
}
function createMiddlewareImports(entrypoints, prefix) {
  let importsRaw = "";
  let sequenceRaw = "";
  let index = 0;
  for (const entrypoint of entrypoints) {
    const name = `_${prefix}_${index}`;
    importsRaw += `import { onRequest as ${name} } from '${normalizePath(entrypoint)}';
`;
    sequenceRaw += `${index > 0 ? "," : ""}${name}`;
    index++;
  }
  return {
    importsCode: importsRaw,
    sequenceCode: sequenceRaw
  };
}
function vitePluginMiddlewareBuild(opts, internals) {
  return {
    name: "@astro/plugin-middleware-build",
    options(options) {
      return addRollupInput(options, [MIDDLEWARE_MODULE_ID]);
    },
    writeBundle(_, bundle) {
      for (const [chunkName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== "asset" && chunk.fileName === "middleware.mjs") {
          const outputDirectory = getOutputDirectory(opts.settings.config);
          internals.middlewareEntryPoint = new URL(chunkName, outputDirectory);
        }
      }
    }
  };
}
export {
  MIDDLEWARE_MODULE_ID,
  vitePluginMiddleware,
  vitePluginMiddlewareBuild
};
