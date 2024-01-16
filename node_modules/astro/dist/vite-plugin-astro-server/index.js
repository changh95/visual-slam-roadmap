import { enhanceViteSSRError } from "../core/errors/dev/index.js";
import { AggregateError, CSSError, MarkdownError } from "../core/errors/index.js";
import { viteID } from "../core/util.js";
async function preload({
  pipeline,
  filePath
}) {
  await pipeline.loadRenderers();
  try {
    const mod = await pipeline.getModuleLoader().import(viteID(filePath));
    return mod;
  } catch (error) {
    if (MarkdownError.is(error) || CSSError.is(error) || AggregateError.is(error)) {
      throw error;
    }
    throw enhanceViteSSRError({ error, filePath, loader: pipeline.getModuleLoader() });
  }
}
import { createController, runWithErrorHandling } from "./controller.js";
import { default as default2 } from "./plugin.js";
import { handleRequest } from "./request.js";
export {
  createController,
  handleRequest,
  preload,
  runWithErrorHandling,
  default2 as vitePluginAstroServer
};
