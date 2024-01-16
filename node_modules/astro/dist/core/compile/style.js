import fs from "node:fs";
import { preprocessCSS } from "vite";
import { AstroErrorData, CSSError, positionAt } from "../errors/index.js";
function createStylePreprocessor({
  filename,
  viteConfig,
  cssDeps,
  cssTransformErrors
}) {
  return async (content, attrs) => {
    const lang = `.${attrs?.lang || "css"}`.toLowerCase();
    const id = `${filename}?astro&type=style&lang${lang}`;
    try {
      const result = await preprocessCSS(content, id, viteConfig);
      result.deps?.forEach((dep) => {
        cssDeps.add(dep);
      });
      let map;
      if (result.map) {
        if (typeof result.map === "string") {
          map = result.map;
        } else if (result.map.mappings) {
          map = result.map.toString();
        }
      }
      return { code: result.code, map };
    } catch (err) {
      try {
        err = enhanceCSSError(err, filename, content);
      } catch {
      }
      cssTransformErrors.push(err);
      return { error: err + "" };
    }
  };
}
function enhanceCSSError(err, filename, cssContent) {
  const fileContent = fs.readFileSync(filename).toString();
  const styleTagBeginning = fileContent.indexOf(cssContent);
  if (err.name === "CssSyntaxError") {
    const errorLine = positionAt(styleTagBeginning, fileContent).line + (err.line ?? 0);
    return new CSSError({
      ...AstroErrorData.CSSSyntaxError,
      message: err.reason,
      location: {
        file: filename,
        line: errorLine,
        column: err.column
      },
      stack: err.stack
    });
  }
  if (err.line && err.column) {
    const errorLine = positionAt(styleTagBeginning, fileContent).line + (err.line ?? 0);
    return new CSSError({
      ...AstroErrorData.UnknownCSSError,
      message: err.message,
      location: {
        file: filename,
        line: errorLine,
        column: err.column
      },
      frame: err.frame,
      stack: err.stack
    });
  }
  const errorPosition = positionAt(styleTagBeginning, fileContent);
  errorPosition.line += 1;
  return new CSSError({
    name: "CSSError",
    message: err.message,
    location: {
      file: filename,
      line: errorPosition.line,
      column: 0
    },
    frame: err.frame,
    stack: err.stack
  });
}
export {
  createStylePreprocessor
};
