import { MIDDLEWARE_MODULE_ID } from "./vite-plugin.js";
import { MiddlewareCantBeLoaded } from "../errors/errors-data.js";
import { AstroError } from "../errors/index.js";
async function loadMiddleware(moduleLoader) {
  try {
    return await moduleLoader.import(MIDDLEWARE_MODULE_ID);
  } catch (error) {
    const astroError = new AstroError(MiddlewareCantBeLoaded, { cause: error });
    throw astroError;
  }
}
export {
  loadMiddleware
};
