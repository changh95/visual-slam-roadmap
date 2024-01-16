import * as colors from "kleur/colors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { eventConfigError, telemetry } from "../../events/index.js";
import { trackAstroConfigZodError } from "../errors/errors.js";
import { AstroError, AstroErrorData } from "../errors/index.js";
import { formatConfigErrorMessage } from "../messages.js";
import { mergeConfig } from "./merge.js";
import { createRelativeSchema } from "./schema.js";
import { loadConfigWithVite } from "./vite-load.js";
async function validateConfig(userConfig, root, cmd) {
  const AstroConfigRelativeSchema = createRelativeSchema(cmd, root);
  let result;
  try {
    result = await AstroConfigRelativeSchema.parseAsync(userConfig);
  } catch (e) {
    if (e instanceof ZodError) {
      trackAstroConfigZodError(e);
      console.error(formatConfigErrorMessage(e) + "\n");
      telemetry.record(eventConfigError({ cmd, err: e, isFatal: true }));
    }
    throw e;
  }
  if (result.build.inlineStylesheets !== "auto" && result.experimental.contentCollectionCache) {
    result.experimental.contentCollectionCache = false;
  }
  return result;
}
function resolveFlags(flags) {
  return {
    root: typeof flags.root === "string" ? flags.root : void 0,
    site: typeof flags.site === "string" ? flags.site : void 0,
    base: typeof flags.base === "string" ? flags.base : void 0,
    port: typeof flags.port === "number" ? flags.port : void 0,
    config: typeof flags.config === "string" ? flags.config : void 0,
    host: typeof flags.host === "string" || typeof flags.host === "boolean" ? flags.host : void 0,
    open: typeof flags.open === "string" || typeof flags.open === "boolean" ? flags.open : void 0
  };
}
function resolveRoot(cwd) {
  if (cwd instanceof URL) {
    cwd = fileURLToPath(cwd);
  }
  return cwd ? path.resolve(cwd) : process.cwd();
}
async function search(fsMod, root) {
  const paths = [
    "astro.config.mjs",
    "astro.config.js",
    "astro.config.ts",
    "astro.config.mts",
    "astro.config.cjs",
    "astro.config.cts"
  ].map((p) => path.join(root, p));
  for (const file of paths) {
    if (fsMod.existsSync(file)) {
      return file;
    }
  }
}
async function resolveConfigPath(options) {
  let userConfigPath;
  if (options.configFile) {
    userConfigPath = path.join(options.root, options.configFile);
    if (!options.fs.existsSync(userConfigPath)) {
      throw new AstroError({
        ...AstroErrorData.ConfigNotFound,
        message: AstroErrorData.ConfigNotFound.message(options.configFile)
      });
    }
  } else {
    userConfigPath = await search(options.fs, options.root);
  }
  return userConfigPath;
}
async function loadConfig(root, configFile, fsMod = fs) {
  if (configFile === false)
    return {};
  const configPath = await resolveConfigPath({
    root,
    configFile,
    fs: fsMod
  });
  if (!configPath)
    return {};
  try {
    return await loadConfigWithVite({
      root,
      configPath,
      fs: fsMod
    });
  } catch (e) {
    const configPathText = configFile ? colors.bold(configFile) : "your Astro config";
    console.error(`${colors.bold(colors.red("[astro]"))} Unable to load ${configPathText}
`);
    throw e;
  }
}
function splitInlineConfig(inlineConfig) {
  const { configFile, mode, logLevel, ...inlineUserConfig } = inlineConfig;
  return {
    inlineUserConfig,
    inlineOnlyConfig: {
      configFile,
      mode,
      logLevel
    }
  };
}
async function resolveConfig(inlineConfig, command, fsMod = fs) {
  const root = resolveRoot(inlineConfig.root);
  const { inlineUserConfig, inlineOnlyConfig } = splitInlineConfig(inlineConfig);
  if (inlineConfig.root) {
    inlineUserConfig.root = root;
  }
  const userConfig = await loadConfig(root, inlineOnlyConfig.configFile, fsMod);
  const mergedConfig = mergeConfig(userConfig, inlineUserConfig);
  const astroConfig = await validateConfig(mergedConfig, root, command);
  return { userConfig, astroConfig };
}
export {
  resolveConfig,
  resolveConfigPath,
  resolveFlags,
  resolveRoot,
  validateConfig
};
