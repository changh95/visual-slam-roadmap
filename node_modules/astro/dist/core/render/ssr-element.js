import { joinPaths, prependForwardSlash, slash } from "../../core/path.js";
function createAssetLink(href, base, assetsPrefix) {
  if (assetsPrefix) {
    return joinPaths(assetsPrefix, slash(href));
  } else if (base) {
    return prependForwardSlash(joinPaths(base, slash(href)));
  } else {
    return href;
  }
}
function createStylesheetElement(stylesheet, base, assetsPrefix) {
  if (stylesheet.type === "inline") {
    return {
      props: {},
      children: stylesheet.content
    };
  } else {
    return {
      props: {
        rel: "stylesheet",
        href: createAssetLink(stylesheet.src, base, assetsPrefix)
      },
      children: ""
    };
  }
}
function createStylesheetElementSet(stylesheets, base, assetsPrefix) {
  return new Set(stylesheets.map((s) => createStylesheetElement(s, base, assetsPrefix)));
}
function createModuleScriptElement(script, base, assetsPrefix) {
  if (script.type === "external") {
    return createModuleScriptElementWithSrc(script.value, base, assetsPrefix);
  } else {
    return {
      props: {
        type: "module"
      },
      children: script.value
    };
  }
}
function createModuleScriptElementWithSrc(src, base, assetsPrefix) {
  return {
    props: {
      type: "module",
      src: createAssetLink(src, base, assetsPrefix)
    },
    children: ""
  };
}
function createModuleScriptElementWithSrcSet(srces, site, assetsPrefix) {
  return new Set(
    srces.map((src) => createModuleScriptElementWithSrc(src, site, assetsPrefix))
  );
}
function createModuleScriptsSet(scripts, base, assetsPrefix) {
  return new Set(
    scripts.map((script) => createModuleScriptElement(script, base, assetsPrefix))
  );
}
export {
  createAssetLink,
  createModuleScriptElement,
  createModuleScriptElementWithSrc,
  createModuleScriptElementWithSrcSet,
  createModuleScriptsSet,
  createStylesheetElement,
  createStylesheetElementSet
};
