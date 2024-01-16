import { transformWithEsbuild } from "vite";
import { cachedCompilation } from "../core/compile/index.js";
import { getFileInfo } from "../vite-plugin-utils/index.js";
const FRONTMATTER_PARSE_REGEXP = /^\-\-\-(.*)^\-\-\-/ms;
async function cachedFullCompilation({
  compileProps,
  logger
}) {
  let transformResult;
  let esbuildResult;
  try {
    transformResult = await cachedCompilation(compileProps);
    esbuildResult = await transformWithEsbuild(transformResult.code, compileProps.filename, {
      loader: "ts",
      target: "esnext",
      sourcemap: "external",
      tsconfigRaw: {
        compilerOptions: {
          // Ensure client:only imports are treeshaken
          verbatimModuleSyntax: false,
          importsNotUsedAsValues: "remove"
        }
      }
    });
  } catch (err) {
    await enhanceCompileError({
      err,
      id: compileProps.filename,
      source: compileProps.source,
      config: compileProps.astroConfig,
      logger
    });
    throw err;
  }
  const { fileId: file, fileUrl: url } = getFileInfo(
    compileProps.filename,
    compileProps.astroConfig
  );
  let SUFFIX = "";
  SUFFIX += `
const $$file = ${JSON.stringify(file)};
const $$url = ${JSON.stringify(
    url
  )};export { $$file as file, $$url as url };
`;
  if (!compileProps.viteConfig.isProduction) {
    let i = 0;
    while (i < transformResult.scripts.length) {
      SUFFIX += `import "${compileProps.filename}?astro&type=script&index=${i}&lang.ts";`;
      i++;
    }
  }
  if (!compileProps.viteConfig.isProduction) {
    SUFFIX += `
if (import.meta.hot) { import.meta.hot.decline() }`;
  }
  return {
    ...transformResult,
    code: esbuildResult.code + SUFFIX,
    map: esbuildResult.map
  };
}
async function enhanceCompileError({
  err,
  id,
  source
}) {
  const lineText = err.loc?.lineText;
  const scannedFrontmatter = FRONTMATTER_PARSE_REGEXP.exec(source);
  if (scannedFrontmatter) {
    const frontmatter = scannedFrontmatter[1].replace(/\breturn\b/g, "throw");
    if (lineText && !frontmatter.includes(lineText))
      throw err;
    try {
      await transformWithEsbuild(frontmatter, id, {
        loader: "ts",
        target: "esnext",
        sourcemap: false
      });
    } catch (frontmatterErr) {
      if (frontmatterErr?.message) {
        frontmatterErr.message = frontmatterErr.message.replace(
          "end of file",
          "end of frontmatter"
        );
      }
      throw frontmatterErr;
    }
  }
  throw err;
}
export {
  cachedFullCompilation
};
