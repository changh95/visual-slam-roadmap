import { getWasmInlined } from './wasm.mjs';
import { createdBundledHighlighter, createSingletonShorthands } from './core.mjs';
export { getHighlighterCore, getShikiContext, loadWasm, toShikiTheme } from './core.mjs';
import { bundledThemes } from './themes.mjs';
import { bundledLanguages } from './langs.mjs';
export { bundledLanguagesAlias, bundledLanguagesBase } from './langs.mjs';

const getHighlighter = /* @__PURE__ */ createdBundledHighlighter(
  bundledLanguages,
  bundledThemes,
  getWasmInlined
);
const {
  codeToHtml,
  codeToHast,
  codeToThemedTokens,
  codeToTokensWithThemes
} = /* @__PURE__ */ createSingletonShorthands(
  getHighlighter
);

export { bundledLanguages, bundledThemes, codeToHast, codeToHtml, codeToThemedTokens, codeToTokensWithThemes, createSingletonShorthands, createdBundledHighlighter, getHighlighter, getWasmInlined };
