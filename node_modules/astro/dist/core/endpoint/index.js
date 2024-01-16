import { renderEndpoint } from "../../runtime/server/index.js";
import { ASTRO_VERSION } from "../constants.js";
import { AstroCookies, attachCookiesToResponse } from "../cookies/index.js";
import { AstroError, AstroErrorData } from "../errors/index.js";
import { callMiddleware } from "../middleware/callMiddleware.js";
import {
  computeCurrentLocale,
  computePreferredLocale,
  computePreferredLocaleList
} from "../render/context.js";
import {} from "../render/index.js";
const clientAddressSymbol = Symbol.for("astro.clientAddress");
const clientLocalsSymbol = Symbol.for("astro.locals");
function createAPIContext({
  request,
  params,
  site,
  props,
  adapterName,
  locales,
  routingStrategy,
  defaultLocale
}) {
  let preferredLocale = void 0;
  let preferredLocaleList = void 0;
  let currentLocale = void 0;
  const context = {
    cookies: new AstroCookies(request),
    request,
    params,
    site: site ? new URL(site) : void 0,
    generator: `Astro v${ASTRO_VERSION}`,
    props,
    redirect(path, status) {
      return new Response(null, {
        status: status || 302,
        headers: {
          Location: path
        }
      });
    },
    get preferredLocale() {
      if (preferredLocale) {
        return preferredLocale;
      }
      if (locales) {
        preferredLocale = computePreferredLocale(request, locales);
        return preferredLocale;
      }
      return void 0;
    },
    get preferredLocaleList() {
      if (preferredLocaleList) {
        return preferredLocaleList;
      }
      if (locales) {
        preferredLocaleList = computePreferredLocaleList(request, locales);
        return preferredLocaleList;
      }
      return void 0;
    },
    get currentLocale() {
      if (currentLocale) {
        return currentLocale;
      }
      if (locales) {
        currentLocale = computeCurrentLocale(request, locales, routingStrategy, defaultLocale);
      }
      return currentLocale;
    },
    url: new URL(request.url),
    get clientAddress() {
      if (clientAddressSymbol in request) {
        return Reflect.get(request, clientAddressSymbol);
      }
      if (adapterName) {
        throw new AstroError({
          ...AstroErrorData.ClientAddressNotAvailable,
          message: AstroErrorData.ClientAddressNotAvailable.message(adapterName)
        });
      } else {
        throw new AstroError(AstroErrorData.StaticClientAddressNotAvailable);
      }
    },
    get locals() {
      let locals = Reflect.get(request, clientLocalsSymbol);
      if (locals === void 0) {
        locals = {};
        Reflect.set(request, clientLocalsSymbol, locals);
      }
      if (typeof locals !== "object") {
        throw new AstroError(AstroErrorData.LocalsNotAnObject);
      }
      return locals;
    },
    // We define a custom property, so we can check the value passed to locals
    set locals(val) {
      if (typeof val !== "object") {
        throw new AstroError(AstroErrorData.LocalsNotAnObject);
      } else {
        Reflect.set(request, clientLocalsSymbol, val);
      }
    }
  };
  return context;
}
async function callEndpoint(mod, env, ctx, onRequest) {
  const context = createAPIContext({
    request: ctx.request,
    params: ctx.params,
    props: ctx.props,
    site: env.site,
    adapterName: env.adapterName,
    routingStrategy: ctx.routing,
    defaultLocale: ctx.defaultLocale,
    locales: ctx.locales
  });
  let response;
  if (onRequest) {
    response = await callMiddleware(onRequest, context, async () => {
      return await renderEndpoint(mod, context, env.ssr, env.logger);
    });
  } else {
    response = await renderEndpoint(mod, context, env.ssr, env.logger);
  }
  attachCookiesToResponse(response, context.cookies);
  return response;
}
export {
  callEndpoint,
  createAPIContext
};
