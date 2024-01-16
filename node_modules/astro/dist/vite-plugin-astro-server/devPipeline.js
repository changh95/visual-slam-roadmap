import { Pipeline } from "../core/pipeline.js";
import { createEnvironment, loadRenderer } from "../core/render/index.js";
import { RouteCache } from "../core/render/route-cache.js";
import { isServerLikeOutput } from "../prerender/utils.js";
import { createResolve } from "./resolve.js";
class DevPipeline extends Pipeline {
  #settings;
  #loader;
  #devLogger;
  constructor({
    manifest,
    logger,
    settings,
    loader
  }) {
    const env = DevPipeline.createDevelopmentEnvironment(manifest, settings, logger, loader);
    super(env);
    this.#devLogger = logger;
    this.#settings = settings;
    this.#loader = loader;
    this.setEndpointHandler(this.#handleEndpointResult);
  }
  clearRouteCache() {
    this.env.routeCache.clearAll();
  }
  getSettings() {
    return this.#settings;
  }
  getConfig() {
    return this.#settings.config;
  }
  getModuleLoader() {
    return this.#loader;
  }
  get logger() {
    return this.#devLogger;
  }
  async loadRenderers() {
    const renderers = await Promise.all(
      this.#settings.renderers.map((r) => loadRenderer(r, this.#loader))
    );
    this.env.renderers = renderers.filter(Boolean);
  }
  static createDevelopmentEnvironment(manifest, settings, logger, loader) {
    const mode = "development";
    return createEnvironment({
      adapterName: manifest.adapterName,
      logger,
      mode,
      // This will be overridden in the dev server
      renderers: [],
      clientDirectives: manifest.clientDirectives,
      compressHTML: manifest.compressHTML,
      resolve: createResolve(loader, settings.config.root),
      routeCache: new RouteCache(logger, mode),
      site: manifest.site,
      ssr: isServerLikeOutput(settings.config),
      streaming: true
    });
  }
  async #handleEndpointResult(_, response) {
    return response;
  }
  async handleFallback() {
  }
}
export {
  DevPipeline as default
};
