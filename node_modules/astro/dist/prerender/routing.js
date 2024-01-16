import { RedirectComponentInstance, routeIsRedirect } from "../core/redirects/index.js";
import { preload } from "../vite-plugin-astro-server/index.js";
import { getPrerenderStatus } from "./metadata.js";
async function getSortedPreloadedMatches({
  pipeline,
  matches,
  settings
}) {
  return (await preloadAndSetPrerenderStatus({
    pipeline,
    matches,
    settings
  })).sort((a, b) => prioritizePrerenderedMatchesComparator(a.route, b.route));
}
async function preloadAndSetPrerenderStatus({
  pipeline,
  matches,
  settings
}) {
  const preloaded = await Promise.all(
    matches.map(async (route) => {
      const filePath = new URL(`./${route.component}`, settings.config.root);
      if (routeIsRedirect(route)) {
        return {
          preloadedComponent: RedirectComponentInstance,
          route,
          filePath
        };
      }
      const preloadedComponent = await preload({ pipeline, filePath });
      const prerenderStatus = getPrerenderStatus({
        filePath,
        loader: pipeline.getModuleLoader()
      });
      if (prerenderStatus !== void 0) {
        route.prerender = prerenderStatus;
      }
      return { preloadedComponent, route, filePath };
    })
  );
  return preloaded;
}
function prioritizePrerenderedMatchesComparator(a, b) {
  if (areRegexesEqual(a.pattern, b.pattern)) {
    if (a.prerender !== b.prerender) {
      return a.prerender ? -1 : 1;
    }
    return a.component < b.component ? -1 : 1;
  }
  return 0;
}
function areRegexesEqual(regexp1, regexp2) {
  return regexp1.source === regexp2.source && regexp1.global === regexp2.global;
}
export {
  getSortedPreloadedMatches
};
