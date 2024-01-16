import { resolveIdToUrl } from "../core/util.js";
function createResolve(loader, root) {
  return async function(s) {
    return await resolveIdToUrl(loader, s, root);
  };
}
export {
  createResolve
};
