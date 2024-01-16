import { deterministicString } from "deterministic-object-hash";
import { basename, extname } from "node:path";
import { removeQueryString } from "../../core/path.js";
import { shorthash } from "../../runtime/server/shorthash.js";
import { isESMImportedImage } from "./imageKind.js";
function propsToFilename(transform, hash) {
  let filename = removeQueryString(
    isESMImportedImage(transform.src) ? transform.src.src : transform.src
  );
  const ext = extname(filename);
  filename = decodeURIComponent(basename(filename, ext));
  let outputExt = transform.format ? `.${transform.format}` : ext;
  return `/${filename}_${hash}${outputExt}`;
}
function hashTransform(transform, imageService, propertiesToHash) {
  const hashFields = propertiesToHash.reduce(
    (acc, prop) => {
      acc[prop] = transform[prop];
      return acc;
    },
    { imageService }
  );
  return shorthash(deterministicString(hashFields));
}
export {
  hashTransform,
  propsToFilename
};
