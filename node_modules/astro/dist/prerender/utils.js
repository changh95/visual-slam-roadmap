import { getOutDirWithinCwd } from "../core/build/common.js";
function isServerLikeOutput(config) {
  return config.output === "server" || config.output === "hybrid";
}
function getPrerenderDefault(config) {
  return config.output === "hybrid";
}
function getOutputDirectory(config) {
  const ssr = isServerLikeOutput(config);
  if (ssr) {
    return config.build.server;
  } else {
    return getOutDirWithinCwd(config.outDir);
  }
}
export {
  getOutputDirectory,
  getPrerenderDefault,
  isServerLikeOutput
};
