import { visit } from "unist-util-visit";
import { createShikiHighlighter } from "./shiki.js";
function remarkShiki(config) {
  let highlighterAsync;
  return async (tree) => {
    highlighterAsync ??= createShikiHighlighter(config);
    const highlighter = await highlighterAsync;
    visit(tree, "code", (node) => {
      const lang = typeof node.lang === "string" ? node.lang : "plaintext";
      const html = highlighter.highlight(node.value, lang);
      node.type = "html";
      node.value = html;
      node.children = [];
    });
  };
}
export {
  remarkShiki
};
