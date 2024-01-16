import {
  createMarkdownProcessor,
  InvalidAstroDataError
} from "@astrojs/markdown-remark";
import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { normalizePath } from "vite";
import { AstroError, AstroErrorData, MarkdownError } from "../core/errors/index.js";
import { isMarkdownFile } from "../core/util.js";
import { shorthash } from "../runtime/server/shorthash.js";
import { getFileInfo } from "../vite-plugin-utils/index.js";
import { getMarkdownCodeForImages } from "./images.js";
function safeMatter(source, id) {
  try {
    return matter(source);
  } catch (err) {
    const markdownError = new MarkdownError({
      name: "MarkdownError",
      message: err.message,
      stack: err.stack,
      location: {
        file: id
      }
    });
    if (err.name === "YAMLException") {
      markdownError.setLocation({
        file: id,
        line: err.mark.line,
        column: err.mark.column
      });
      markdownError.setMessage(err.reason);
    }
    throw markdownError;
  }
}
const astroServerRuntimeModulePath = normalizePath(
  fileURLToPath(new URL("../runtime/server/index.js", import.meta.url))
);
const astroErrorModulePath = normalizePath(
  fileURLToPath(new URL("../core/errors/index.js", import.meta.url))
);
function markdown({ settings, logger }) {
  let processor;
  return {
    enforce: "pre",
    name: "astro:markdown",
    async buildStart() {
      processor = await createMarkdownProcessor(settings.config.markdown);
    },
    // Why not the "transform" hook instead of "load" + readFile?
    // A: Vite transforms all "import.meta.env" references to their values before
    // passing to the transform hook. This lets us get the truly raw value
    // to escape "import.meta.env" ourselves.
    async load(id) {
      if (isMarkdownFile(id)) {
        const { fileId, fileUrl } = getFileInfo(id, settings.config);
        const rawFile = await fs.promises.readFile(fileId, "utf-8");
        const raw = safeMatter(rawFile, id);
        const fileURL = pathToFileURL(fileId);
        const renderResult = await processor.render(raw.content, {
          // @ts-expect-error passing internal prop
          fileURL,
          frontmatter: raw.data
        }).catch((err) => {
          if (err instanceof InvalidAstroDataError) {
            throw new AstroError(AstroErrorData.InvalidFrontmatterInjectionError);
          }
          throw err;
        });
        let html = renderResult.code;
        const { headings, imagePaths: rawImagePaths, frontmatter } = renderResult.metadata;
        const imagePaths = [];
        for (const imagePath of rawImagePaths.values()) {
          imagePaths.push({
            raw: imagePath,
            resolved: (await this.resolve(imagePath, id))?.id ?? path.join(path.dirname(id), imagePath),
            safeName: shorthash(imagePath)
          });
        }
        const { layout } = frontmatter;
        if (frontmatter.setup) {
          logger.warn(
            "markdown",
            `[${id}] Astro now supports MDX! Support for components in ".md" (or alternative extensions like ".markdown") files using the "setup" frontmatter is no longer enabled by default. Migrate this file to MDX.`
          );
        }
        const code = `
				import { unescapeHTML, spreadAttributes, createComponent, render, renderComponent, maybeRenderHead } from ${JSON.stringify(
          astroServerRuntimeModulePath
        )};
				import { AstroError, AstroErrorData } from ${JSON.stringify(astroErrorModulePath)};
				${layout ? `import Layout from ${JSON.stringify(layout)};` : ""}

				${// Only include the code relevant to `astro:assets` if there's images in the file
        imagePaths.length > 0 ? getMarkdownCodeForImages(imagePaths, html) : `const html = ${JSON.stringify(html)};`}

				export const frontmatter = ${JSON.stringify(frontmatter)};
				export const file = ${JSON.stringify(fileId)};
				export const url = ${JSON.stringify(fileUrl)};
				export function rawContent() {
					return ${JSON.stringify(raw.content)};
				}
				export function compiledContent() {
					return html;
				}
				export function getHeadings() {
					return ${JSON.stringify(headings)};
				}

				export const Content = createComponent((result, _props, slots) => {
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;

					return ${layout ? `render\`\${renderComponent(result, 'Layout', Layout, {
								file,
								url,
								content,
								frontmatter: content,
								headings: getHeadings(),
								rawContent,
								compiledContent,
								'server:root': true,
							}, {
								'default': () => render\`\${unescapeHTML(html)}\`
							})}\`;` : `render\`\${maybeRenderHead(result)}\${unescapeHTML(html)}\`;`}
				});
				export default Content;
				`;
        return {
          code,
          meta: {
            astro: {
              hydratedComponents: [],
              clientOnlyComponents: [],
              scripts: [],
              propagation: "none",
              containsHead: false,
              pageOptions: {}
            },
            vite: {
              lang: "ts"
            }
          }
        };
      }
    }
  };
}
export {
  markdown as default
};
