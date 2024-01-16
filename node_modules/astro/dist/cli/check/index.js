import path from "node:path";
import { createLoggerFromFlags, flagsToAstroInlineConfig } from "../flags.js";
import { getPackage } from "../install-package.js";
import { ensureProcessNodeEnv } from "../../core/util.js";
async function check(flags) {
  ensureProcessNodeEnv("production");
  const logger = createLoggerFromFlags(flags);
  const getPackageOpts = { skipAsk: flags.yes || flags.y, cwd: flags.root };
  const checkPackage = await getPackage(
    "@astrojs/check",
    logger,
    getPackageOpts,
    ["typescript"]
  );
  const typescript = await getPackage("typescript", logger, getPackageOpts);
  if (!checkPackage || !typescript) {
    logger.error(
      "check",
      "The `@astrojs/check` and `typescript` packages are required for this command to work. Please manually install them into your project and try again."
    );
    return;
  }
  const { default: sync } = await import("../../core/sync/index.js");
  const inlineConfig = flagsToAstroInlineConfig(flags);
  const exitCode = await sync(inlineConfig);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
  const { check: checker, parseArgsAsCheckConfig } = checkPackage;
  const config = parseArgsAsCheckConfig(process.argv);
  logger.info("check", `Getting diagnostics for Astro files in ${path.resolve(config.root)}...`);
  return await checker(config);
}
export {
  check
};
