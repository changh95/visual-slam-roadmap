import { collapseDuplicateSlashes, removeTrailingForwardSlash } from "../core/path.js";
import { isServerLikeOutput } from "../prerender/utils.js";
import { runWithErrorHandling } from "./controller.js";
import { handle500Response } from "./response.js";
import { handleRoute, matchRoute } from "./route.js";
import { recordServerError } from "./error.js";
async function handleRequest({
  pipeline,
  manifestData,
  controller,
  incomingRequest,
  incomingResponse,
  manifest
}) {
  const config = pipeline.getConfig();
  const moduleLoader = pipeline.getModuleLoader();
  const origin = `${moduleLoader.isHttps() ? "https" : "http"}://${incomingRequest.headers.host}`;
  const buildingToSSR = isServerLikeOutput(config);
  const url = new URL(collapseDuplicateSlashes(origin + incomingRequest.url));
  let pathname;
  if (config.trailingSlash === "never" && !incomingRequest.url) {
    pathname = "";
  } else {
    pathname = url.pathname;
  }
  url.pathname = removeTrailingForwardSlash(config.base) + url.pathname;
  if (!buildingToSSR && pathname !== "/_image") {
    const allSearchParams = Array.from(url.searchParams);
    for (const [key] of allSearchParams) {
      url.searchParams.delete(key);
    }
  }
  let body = void 0;
  if (!(incomingRequest.method === "GET" || incomingRequest.method === "HEAD")) {
    let bytes = [];
    await new Promise((resolve) => {
      incomingRequest.on("data", (part) => {
        bytes.push(part);
      });
      incomingRequest.on("end", resolve);
    });
    body = Buffer.concat(bytes);
  }
  await runWithErrorHandling({
    controller,
    pathname,
    async run() {
      const matchedRoute = await matchRoute(pathname, manifestData, pipeline);
      const resolvedPathname = matchedRoute?.resolvedPathname ?? pathname;
      return await handleRoute({
        matchedRoute,
        url,
        pathname: resolvedPathname,
        body,
        origin,
        pipeline,
        manifestData,
        incomingRequest,
        incomingResponse,
        manifest
      });
    },
    onError(_err) {
      const { error, errorWithMetadata } = recordServerError(moduleLoader, config, pipeline, _err);
      handle500Response(moduleLoader, incomingResponse, errorWithMetadata);
      return error;
    }
  });
}
export {
  handleRequest
};
