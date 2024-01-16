import { bundledLanguages, getHighlighter } from "shikiji";
import { visit } from "unist-util-visit";
const ASTRO_COLOR_REPLACEMENTS = {
  "#000001": "var(--astro-code-color-text)",
  "#000002": "var(--astro-code-color-background)",
  "#000004": "var(--astro-code-token-constant)",
  "#000005": "var(--astro-code-token-string)",
  "#000006": "var(--astro-code-token-comment)",
  "#000007": "var(--astro-code-token-keyword)",
  "#000008": "var(--astro-code-token-parameter)",
  "#000009": "var(--astro-code-token-function)",
  "#000010": "var(--astro-code-token-string-expression)",
  "#000011": "var(--astro-code-token-punctuation)",
  "#000012": "var(--astro-code-token-link)"
};
const COLOR_REPLACEMENT_REGEX = new RegExp(
  `(${Object.keys(ASTRO_COLOR_REPLACEMENTS).join("|")})`,
  "g"
);
async function createShikiHighlighter({
  langs = [],
  theme = "github-dark",
  experimentalThemes = {},
  wrap = false
} = {}) {
  const themes = experimentalThemes;
  const highlighter = await getHighlighter({
    langs: langs.length ? langs : Object.keys(bundledLanguages),
    themes: Object.values(themes).length ? Object.values(themes) : [theme]
  });
  const loadedLanguages = highlighter.getLoadedLanguages();
  return {
    highlight(code, lang = "plaintext", options) {
      if (lang !== "plaintext" && !loadedLanguages.includes(lang)) {
        console.warn(`[Shiki] The language "${lang}" doesn't exist, falling back to "plaintext".`);
        lang = "plaintext";
      }
      const themeOptions = Object.values(themes).length ? { themes } : { theme };
      const inline = options?.inline ?? false;
      return highlighter.codeToHtml(code, {
        ...themeOptions,
        lang,
        transforms: {
          pre(node) {
            if (inline) {
              node.tagName = "code";
            }
            const classValue = node.properties.class ?? "";
            const styleValue = node.properties.style ?? "";
            node.properties.class = classValue.replace(/shiki/g, "astro-code");
            if (wrap === false) {
              node.properties.style = styleValue + "; overflow-x: auto;";
            } else if (wrap === true) {
              node.properties.style = styleValue + "; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;";
            }
          },
          line(node) {
            if (lang === "diff") {
              const innerSpanNode = node.children[0];
              const innerSpanTextNode = innerSpanNode?.type === "element" && innerSpanNode.children?.[0];
              if (innerSpanTextNode && innerSpanTextNode.type === "text") {
                const start = innerSpanTextNode.value[0];
                if (start === "+" || start === "-") {
                  innerSpanTextNode.value = innerSpanTextNode.value.slice(1);
                  innerSpanNode.children.unshift({
                    type: "element",
                    tagName: "span",
                    properties: { style: "user-select: none;" },
                    children: [{ type: "text", value: start }]
                  });
                }
              }
            }
          },
          code(node) {
            if (inline) {
              return node.children[0];
            }
          },
          root(node) {
            if (Object.values(experimentalThemes).length) {
              return;
            }
            const themeName = typeof theme === "string" ? theme : theme.name;
            if (themeName === "css-variables") {
              visit(node, "element", (child) => {
                if (child.properties?.style) {
                  child.properties.style = replaceCssVariables(child.properties.style);
                }
              });
            }
          }
        }
      });
    }
  };
}
function replaceCssVariables(str) {
  return str.replace(COLOR_REPLACEMENT_REGEX, (match) => ASTRO_COLOR_REPLACEMENTS[match] || match);
}
export {
  createShikiHighlighter,
  replaceCssVariables
};
