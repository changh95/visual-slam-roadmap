import { renderPage as runtimeRenderPage } from "../../runtime/server/index.js";
import { attachCookiesToResponse } from "../cookies/index.js";
import { CantRenderPage } from "../errors/errors-data.js";
import { AstroError } from "../errors/index.js";
import { routeIsFallback } from "../redirects/helpers.js";
import { redirectRouteGenerate, redirectRouteStatus, routeIsRedirect } from "../redirects/index.js";
import { createResult } from "./result.js";
async function renderPage({ mod, renderContext, env, cookies }) {
  if (routeIsRedirect(renderContext.route)) {
    return new Response(null, {
      status: redirectRouteStatus(renderContext.route, renderContext.request.method),
      headers: {
        location: redirectRouteGenerate(renderContext.route, renderContext.params)
      }
    });
  } else if (routeIsFallback(renderContext.route)) {
    return new Response(null, {
      status: 404
    });
  } else if (!mod) {
    throw new AstroError(CantRenderPage);
  }
  const Component = mod.default;
  if (!Component)
    throw new Error(`Expected an exported Astro component but received typeof ${typeof Component}`);
  const result = createResult({
    adapterName: env.adapterName,
    links: renderContext.links,
    styles: renderContext.styles,
    logger: env.logger,
    params: renderContext.params,
    pathname: renderContext.pathname,
    componentMetadata: renderContext.componentMetadata,
    resolve: env.resolve,
    renderers: env.renderers,
    clientDirectives: env.clientDirectives,
    compressHTML: env.compressHTML,
    request: renderContext.request,
    partial: !!mod.partial,
    site: env.site,
    scripts: renderContext.scripts,
    ssr: env.ssr,
    status: renderContext.status ?? 200,
    cookies,
    locals: renderContext.locals ?? {},
    locales: renderContext.locales,
    defaultLocale: renderContext.defaultLocale,
    routingStrategy: renderContext.routing
  });
  const response = await runtimeRenderPage(
    result,
    Component,
    renderContext.props,
    {},
    env.streaming,
    renderContext.route
  );
  if (result.cookies) {
    attachCookiesToResponse(response, result.cookies);
  }
  return response;
}
export {
  renderPage
};
