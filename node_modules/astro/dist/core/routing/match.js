function matchRoute(pathname, manifest) {
  const decodedPathname = decodeURI(pathname);
  return manifest.routes.find((route) => {
    return route.pattern.test(decodedPathname) || route.fallbackRoutes.some((fallbackRoute) => fallbackRoute.pattern.test(decodedPathname));
  });
}
function matchAllRoutes(pathname, manifest) {
  return manifest.routes.filter((route) => route.pattern.test(pathname));
}
export {
  matchAllRoutes,
  matchRoute
};
