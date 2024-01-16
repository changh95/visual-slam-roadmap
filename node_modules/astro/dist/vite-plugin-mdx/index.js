import { transformWithEsbuild } from "vite";
import babel from "@babel/core";
import { CONTENT_FLAG, PROPAGATED_ASSET_FLAG } from "../content/index.js";
import { astroEntryPrefix } from "../core/build/plugins/plugin-component-entry.js";
import { removeQueryString } from "../core/path.js";
import tagExportsPlugin from "./tag.js";
async function transformJSX({
  code,
  mode,
  id,
  ssr,
  renderer,
  root
}) {
  const { jsxTransformOptions } = renderer;
  const options = await jsxTransformOptions({ mode, ssr });
  const plugins = [...options.plugins || []];
  if (ssr) {
    plugins.push(await tagExportsPlugin({ rendererName: renderer.name, root }));
  }
  const result = await babel.transformAsync(code, {
    presets: options.presets,
    plugins,
    cwd: process.cwd(),
    filename: id,
    ast: false,
    compact: false,
    sourceMaps: true,
    configFile: false,
    babelrc: false,
    inputSourceMap: options.inputSourceMap
  });
  if (!result)
    return null;
  if (renderer.name === "astro:jsx") {
    const { astro } = result.metadata;
    return {
      code: result.code || "",
      map: result.map,
      meta: {
        astro,
        vite: {
          // Setting this vite metadata to `ts` causes Vite to resolve .js
          // extensions to .ts files.
          lang: "ts"
        }
      }
    };
  }
  return {
    code: result.code || "",
    map: result.map
  };
}
const SPECIAL_QUERY_REGEX = new RegExp(
  `[?&](?:worker|sharedworker|raw|url|${CONTENT_FLAG}|${PROPAGATED_ASSET_FLAG})\\b`
);
function mdxVitePlugin({ settings }) {
  let viteConfig;
  let astroJSXRenderer;
  return {
    name: "astro:jsx",
    enforce: "pre",
    // run transforms before other plugins
    async configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
      astroJSXRenderer = settings.renderers.find((r) => r.jsxImportSource === "astro");
    },
    async transform(code, id, opts) {
      if (SPECIAL_QUERY_REGEX.test(id) || id.startsWith(astroEntryPrefix)) {
        return null;
      }
      id = removeQueryString(id);
      if (!id.endsWith(".mdx")) {
        return null;
      }
      const { code: jsxCode } = await transformWithEsbuild(code, id, {
        loader: "jsx",
        jsx: "preserve",
        sourcemap: "inline",
        tsconfigRaw: {
          compilerOptions: {
            // Ensure client:only imports are treeshaken
            verbatimModuleSyntax: false,
            importsNotUsedAsValues: "remove"
          }
        }
      });
      return transformJSX({
        code: jsxCode,
        id,
        renderer: astroJSXRenderer,
        mode: viteConfig.mode,
        ssr: Boolean(opts?.ssr),
        root: settings.config.root
      });
    }
  };
}
export {
  mdxVitePlugin as default
};
