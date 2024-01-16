function routeIsRedirect(route) {
  return route?.type === "redirect";
}
function routeIsFallback(route) {
  return route?.type === "fallback";
}
function redirectRouteGenerate(redirectRoute, data) {
  const routeData = redirectRoute.redirectRoute;
  const route = redirectRoute.redirect;
  if (typeof routeData !== "undefined") {
    return routeData?.generate(data) || routeData?.pathname || "/";
  } else if (typeof route === "string") {
    let target = route;
    for (const param of Object.keys(data)) {
      const paramValue = data[param];
      target = target.replace(`[${param}]`, paramValue);
      target = target.replace(`[...${param}]`, paramValue);
    }
    return target;
  } else if (typeof route === "undefined") {
    return "/";
  }
  return route.destination;
}
function redirectRouteStatus(redirectRoute, method = "GET") {
  const routeData = redirectRoute.redirectRoute;
  if (routeData && typeof redirectRoute.redirect === "object") {
    return redirectRoute.redirect.status;
  } else if (method !== "GET") {
    return 308;
  }
  return 301;
}
export {
  redirectRouteGenerate,
  redirectRouteStatus,
  routeIsFallback,
  routeIsRedirect
};
