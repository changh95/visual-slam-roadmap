import { AstroError, AstroErrorData } from "../errors/index.js";
import { routeIsFallback } from "../redirects/helpers.js";
import { routeIsRedirect } from "../redirects/index.js";
import { getParams } from "../routing/params.js";
import { callGetStaticPaths, findPathItemByKey } from "./route-cache.js";
async function getParamsAndProps(opts) {
  const { logger, mod, route, routeCache, pathname, ssr } = opts;
  if (!route || route.pathname) {
    return [{}, {}];
  }
  const params = getRouteParams(route, pathname) ?? {};
  if (routeIsRedirect(route) || routeIsFallback(route)) {
    return [params, {}];
  }
  if (mod) {
    validatePrerenderEndpointCollision(route, mod, params);
  }
  const staticPaths = await callGetStaticPaths({
    mod,
    route,
    routeCache,
    logger,
    ssr
  });
  const matchedStaticPath = findPathItemByKey(staticPaths, params, route, logger);
  if (!matchedStaticPath && (ssr ? route.prerender : true)) {
    throw new AstroError({
      ...AstroErrorData.NoMatchingStaticPathFound,
      message: AstroErrorData.NoMatchingStaticPathFound.message(pathname),
      hint: AstroErrorData.NoMatchingStaticPathFound.hint([route.component])
    });
  }
  const props = matchedStaticPath?.props ? { ...matchedStaticPath.props } : {};
  return [params, props];
}
function getRouteParams(route, pathname) {
  if (route.params.length) {
    const paramsMatch = route.pattern.exec(decodeURIComponent(pathname));
    if (paramsMatch) {
      return getParams(route.params)(paramsMatch);
    }
  }
}
function validatePrerenderEndpointCollision(route, mod, params) {
  if (route.type === "endpoint" && mod.getStaticPaths) {
    const lastSegment = route.segments[route.segments.length - 1];
    const paramValues = Object.values(params);
    const lastParam = paramValues[paramValues.length - 1];
    if (lastSegment.length === 1 && lastSegment[0].dynamic && lastParam === void 0) {
      throw new AstroError({
        ...AstroErrorData.PrerenderDynamicEndpointPathCollide,
        message: AstroErrorData.PrerenderDynamicEndpointPathCollide.message(route.route),
        hint: AstroErrorData.PrerenderDynamicEndpointPathCollide.hint(route.component),
        location: {
          file: route.component
        }
      });
    }
  }
}
export {
  getParamsAndProps
};
