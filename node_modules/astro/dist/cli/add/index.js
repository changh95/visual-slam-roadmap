import boxen from "boxen";
import { diffWords } from "diff";
import { execa } from "execa";
import { bold, cyan, dim, green, magenta, red, yellow } from "kleur/colors";
import fsMod, { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import maxSatisfying from "semver/ranges/max-satisfying.js";
import ora from "ora";
import preferredPM from "preferred-pm";
import prompts from "prompts";
import {
  loadTSConfig,
  resolveConfig,
  resolveConfigPath,
  resolveRoot
} from "../../core/config/index.js";
import {
  defaultTSConfig,
  presets,
  updateTSConfigForFramework
} from "../../core/config/tsconfig.js";
import * as msg from "../../core/messages.js";
import { printHelp } from "../../core/messages.js";
import { appendForwardSlash } from "../../core/path.js";
import { apply as applyPolyfill } from "../../core/polyfill.js";
import { ensureProcessNodeEnv, parseNpmName } from "../../core/util.js";
import { eventCliSession, telemetry } from "../../events/index.js";
import { createLoggerFromFlags, flagsToAstroInlineConfig } from "../flags.js";
import { generate, parse, t, visit } from "./babel.js";
import { ensureImport } from "./imports.js";
import { wrapDefaultExport } from "./wrapper.js";
const ALIASES = /* @__PURE__ */ new Map([
  ["solid", "solid-js"],
  ["tailwindcss", "tailwind"]
]);
const ASTRO_CONFIG_STUB = `import { defineConfig } from 'astro/config';

export default defineConfig({});`;
const TAILWIND_CONFIG_STUB = `/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
	},
	plugins: [],
}
`;
const SVELTE_CONFIG_STUB = `import { vitePreprocess } from '@astrojs/svelte';

export default {
	preprocess: vitePreprocess(),
};
`;
const LIT_NPMRC_STUB = `# Lit libraries are required to be hoisted due to dependency issues.
public-hoist-pattern[]=*lit*
`;
const OFFICIAL_ADAPTER_TO_IMPORT_MAP = {
  netlify: "@astrojs/netlify",
  vercel: "@astrojs/vercel/serverless",
  cloudflare: "@astrojs/cloudflare",
  node: "@astrojs/node"
};
async function getRegistry() {
  const packageManager = (await preferredPM(process.cwd()))?.name || "npm";
  try {
    const { stdout } = await execa(packageManager, ["config", "get", "registry"]);
    return stdout?.trim()?.replace(/\/$/, "") || "https://registry.npmjs.org";
  } catch (e) {
    return "https://registry.npmjs.org";
  }
}
async function add(names, { flags }) {
  ensureProcessNodeEnv("production");
  const inlineConfig = flagsToAstroInlineConfig(flags);
  const { userConfig } = await resolveConfig(inlineConfig, "add");
  telemetry.record(eventCliSession("add", userConfig));
  applyPolyfill();
  if (flags.help || names.length === 0) {
    printHelp({
      commandName: "astro add",
      usage: "[...integrations] [...adapters]",
      tables: {
        Flags: [
          ["--yes", "Accept all prompts."],
          ["--help", "Show this help message."]
        ],
        "UI Frameworks": [
          ["react", "astro add react"],
          ["preact", "astro add preact"],
          ["vue", "astro add vue"],
          ["svelte", "astro add svelte"],
          ["solid-js", "astro add solid-js"],
          ["lit", "astro add lit"],
          ["alpinejs", "astro add alpinejs"]
        ],
        "Documentation Frameworks": [["starlight", "astro add starlight"]],
        "SSR Adapters": [
          ["netlify", "astro add netlify"],
          ["vercel", "astro add vercel"],
          ["deno", "astro add deno"],
          ["cloudflare", "astro add cloudflare"],
          ["node", "astro add node"]
        ],
        Others: [
          ["tailwind", "astro add tailwind"],
          ["image", "astro add image"],
          ["mdx", "astro add mdx"],
          ["partytown", "astro add partytown"],
          ["sitemap", "astro add sitemap"],
          ["prefetch", "astro add prefetch"]
        ]
      },
      description: `For more integrations, check out: ${cyan("https://astro.build/integrations")}`
    });
    return;
  }
  const cwd = flags.root;
  const logger = createLoggerFromFlags(flags);
  const integrationNames = names.map((name) => ALIASES.has(name) ? ALIASES.get(name) : name);
  const integrations = await validateIntegrations(integrationNames);
  let installResult = await tryToInstallIntegrations({ integrations, cwd, flags, logger });
  const rootPath = resolveRoot(cwd);
  const root = pathToFileURL(rootPath);
  root.href = appendForwardSlash(root.href);
  switch (installResult) {
    case 1 /* updated */: {
      if (integrations.find((integration) => integration.id === "tailwind")) {
        await setupIntegrationConfig({
          root,
          logger,
          flags,
          integrationName: "Tailwind",
          possibleConfigFiles: [
            "./tailwind.config.cjs",
            "./tailwind.config.mjs",
            "./tailwind.config.ts",
            "./tailwind.config.mts",
            "./tailwind.config.cts",
            "./tailwind.config.js"
          ],
          defaultConfigFile: "./tailwind.config.mjs",
          defaultConfigContent: TAILWIND_CONFIG_STUB
        });
      }
      if (integrations.find((integration) => integration.id === "svelte")) {
        await setupIntegrationConfig({
          root,
          logger,
          flags,
          integrationName: "Svelte",
          possibleConfigFiles: ["./svelte.config.js", "./svelte.config.cjs", "./svelte.config.mjs"],
          defaultConfigFile: "./svelte.config.js",
          defaultConfigContent: SVELTE_CONFIG_STUB
        });
      }
      if (integrations.find((integration) => integration.id === "lit") && (await preferredPM(fileURLToPath(root)))?.name === "pnpm") {
        await setupIntegrationConfig({
          root,
          logger,
          flags,
          integrationName: "Lit",
          possibleConfigFiles: ["./.npmrc"],
          defaultConfigFile: "./.npmrc",
          defaultConfigContent: LIT_NPMRC_STUB
        });
      }
      break;
    }
    case 2 /* cancelled */: {
      logger.info(
        null,
        msg.cancelled(
          `Dependencies ${bold("NOT")} installed.`,
          `Be sure to install them manually before continuing!`
        )
      );
      break;
    }
    case 3 /* failure */: {
      throw createPrettyError(new Error(`Unable to install dependencies`));
    }
  }
  const rawConfigPath = await resolveConfigPath({
    root: rootPath,
    configFile: flags.config,
    fs: fsMod
  });
  let configURL = rawConfigPath ? pathToFileURL(rawConfigPath) : void 0;
  if (configURL) {
    logger.debug("add", `Found config at ${configURL}`);
  } else {
    logger.info("add", `Unable to locate a config file, generating one for you.`);
    configURL = new URL("./astro.config.mjs", root);
    await fs.writeFile(fileURLToPath(configURL), ASTRO_CONFIG_STUB, { encoding: "utf-8" });
  }
  let ast = null;
  try {
    ast = await parseAstroConfig(configURL);
    logger.debug("add", "Parsed astro config");
    const defineConfig = t.identifier("defineConfig");
    ensureImport(
      ast,
      t.importDeclaration(
        [t.importSpecifier(defineConfig, defineConfig)],
        t.stringLiteral("astro/config")
      )
    );
    wrapDefaultExport(ast, defineConfig);
    logger.debug("add", "Astro config ensured `defineConfig`");
    for (const integration of integrations) {
      if (isAdapter(integration)) {
        const officialExportName = OFFICIAL_ADAPTER_TO_IMPORT_MAP[integration.id];
        if (officialExportName) {
          await setAdapter(ast, integration, officialExportName);
        } else {
          logger.info(
            null,
            `
  ${magenta(
              `Check our deployment docs for ${bold(
                integration.packageName
              )} to update your "adapter" config.`
            )}`
          );
        }
      } else {
        await addIntegration(ast, integration);
      }
      logger.debug("add", `Astro config added integration ${integration.id}`);
    }
  } catch (err) {
    logger.debug("add", "Error parsing/modifying astro config: ", err);
    throw createPrettyError(err);
  }
  let configResult;
  if (ast) {
    try {
      configResult = await updateAstroConfig({
        configURL,
        ast,
        flags,
        logger,
        logAdapterInstructions: integrations.some(isAdapter)
      });
    } catch (err) {
      logger.debug("add", "Error updating astro config", err);
      throw createPrettyError(err);
    }
  }
  switch (configResult) {
    case 2 /* cancelled */: {
      logger.info(null, msg.cancelled(`Your configuration has ${bold("NOT")} been updated.`));
      break;
    }
    case 0 /* none */: {
      const pkgURL = new URL("./package.json", configURL);
      if (existsSync(fileURLToPath(pkgURL))) {
        const { dependencies = {}, devDependencies = {} } = await fs.readFile(fileURLToPath(pkgURL)).then((res) => JSON.parse(res.toString()));
        const deps = Object.keys(Object.assign(dependencies, devDependencies));
        const missingDeps = integrations.filter(
          (integration) => !deps.includes(integration.packageName)
        );
        if (missingDeps.length === 0) {
          logger.info(null, msg.success(`Configuration up-to-date.`));
          break;
        }
      }
      logger.info(null, msg.success(`Configuration up-to-date.`));
      break;
    }
    default: {
      const list = integrations.map((integration) => `  - ${integration.packageName}`).join("\n");
      logger.info(
        null,
        msg.success(
          `Added the following integration${integrations.length === 1 ? "" : "s"} to your project:
${list}`
        )
      );
    }
  }
  const updateTSConfigResult = await updateTSConfig(cwd, logger, integrations, flags);
  switch (updateTSConfigResult) {
    case 0 /* none */: {
      break;
    }
    case 2 /* cancelled */: {
      logger.info(
        null,
        msg.cancelled(`Your TypeScript configuration has ${bold("NOT")} been updated.`)
      );
      break;
    }
    case 3 /* failure */: {
      throw new Error(
        `Unknown error parsing tsconfig.json or jsconfig.json. Could not update TypeScript settings.`
      );
    }
    default:
      logger.info(null, msg.success(`Successfully updated TypeScript settings`));
  }
}
function isAdapter(integration) {
  return integration.type === "adapter";
}
async function parseAstroConfig(configURL) {
  const source = await fs.readFile(fileURLToPath(configURL), { encoding: "utf-8" });
  const result = parse(source);
  if (!result)
    throw new Error("Unknown error parsing astro config");
  if (result.errors.length > 0)
    throw new Error("Error parsing astro config: " + JSON.stringify(result.errors));
  return result;
}
const toIdent = (name) => {
  const ident = name.trim().replace(/[-_\.\/]?astro(?:js)?[-_\.]?/g, "").replace(/\.js/, "").replace(/(?:[\.\-\_\/]+)([a-zA-Z])/g, (_, w) => w.toUpperCase()).replace(/^[^a-zA-Z$_]+/, "");
  return `${ident[0].toLowerCase()}${ident.slice(1)}`;
};
function createPrettyError(err) {
  err.message = `Astro could not update your astro.config.js file safely.
Reason: ${err.message}

You will need to add these integration(s) manually.
Documentation: https://docs.astro.build/en/guides/integrations-guide/`;
  return err;
}
async function addIntegration(ast, integration) {
  const integrationId = t.identifier(toIdent(integration.id));
  ensureImport(
    ast,
    t.importDeclaration(
      [t.importDefaultSpecifier(integrationId)],
      t.stringLiteral(integration.packageName)
    )
  );
  visit(ast, {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    ExportDefaultDeclaration(path2) {
      if (!t.isCallExpression(path2.node.declaration))
        return;
      const configObject = path2.node.declaration.arguments[0];
      if (!t.isObjectExpression(configObject))
        return;
      let integrationsProp = configObject.properties.find((prop) => {
        if (prop.type !== "ObjectProperty")
          return false;
        if (prop.key.type === "Identifier") {
          if (prop.key.name === "integrations")
            return true;
        }
        if (prop.key.type === "StringLiteral") {
          if (prop.key.value === "integrations")
            return true;
        }
        return false;
      });
      const integrationCall = t.callExpression(integrationId, []);
      if (!integrationsProp) {
        configObject.properties.push(
          t.objectProperty(t.identifier("integrations"), t.arrayExpression([integrationCall]))
        );
        return;
      }
      if (integrationsProp.value.type !== "ArrayExpression")
        throw new Error("Unable to parse integrations");
      const existingIntegrationCall = integrationsProp.value.elements.find(
        (expr) => t.isCallExpression(expr) && t.isIdentifier(expr.callee) && expr.callee.name === integrationId.name
      );
      if (existingIntegrationCall)
        return;
      integrationsProp.value.elements.push(integrationCall);
    }
  });
}
async function setAdapter(ast, adapter, exportName) {
  const adapterId = t.identifier(toIdent(adapter.id));
  ensureImport(
    ast,
    t.importDeclaration([t.importDefaultSpecifier(adapterId)], t.stringLiteral(exportName))
  );
  visit(ast, {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    ExportDefaultDeclaration(path2) {
      if (!t.isCallExpression(path2.node.declaration))
        return;
      const configObject = path2.node.declaration.arguments[0];
      if (!t.isObjectExpression(configObject))
        return;
      let outputProp = configObject.properties.find((prop) => {
        if (prop.type !== "ObjectProperty")
          return false;
        if (prop.key.type === "Identifier") {
          if (prop.key.name === "output")
            return true;
        }
        if (prop.key.type === "StringLiteral") {
          if (prop.key.value === "output")
            return true;
        }
        return false;
      });
      if (!outputProp) {
        configObject.properties.push(
          t.objectProperty(t.identifier("output"), t.stringLiteral("server"))
        );
      }
      let adapterProp = configObject.properties.find((prop) => {
        if (prop.type !== "ObjectProperty")
          return false;
        if (prop.key.type === "Identifier") {
          if (prop.key.name === "adapter")
            return true;
        }
        if (prop.key.type === "StringLiteral") {
          if (prop.key.value === "adapter")
            return true;
        }
        return false;
      });
      let adapterCall;
      switch (adapter.id) {
        case "node": {
          adapterCall = t.callExpression(adapterId, [
            t.objectExpression([
              t.objectProperty(t.identifier("mode"), t.stringLiteral("standalone"))
            ])
          ]);
          break;
        }
        default: {
          adapterCall = t.callExpression(adapterId, []);
        }
      }
      if (!adapterProp) {
        configObject.properties.push(t.objectProperty(t.identifier("adapter"), adapterCall));
        return;
      }
      adapterProp.value = adapterCall;
    }
  });
}
var UpdateResult = /* @__PURE__ */ ((UpdateResult2) => {
  UpdateResult2[UpdateResult2["none"] = 0] = "none";
  UpdateResult2[UpdateResult2["updated"] = 1] = "updated";
  UpdateResult2[UpdateResult2["cancelled"] = 2] = "cancelled";
  UpdateResult2[UpdateResult2["failure"] = 3] = "failure";
  return UpdateResult2;
})(UpdateResult || {});
async function updateAstroConfig({
  configURL,
  ast,
  flags,
  logger,
  logAdapterInstructions
}) {
  const input = await fs.readFile(fileURLToPath(configURL), { encoding: "utf-8" });
  let output = await generate(ast);
  const comment = "// https://astro.build/config";
  const defaultExport = "export default defineConfig";
  output = output.replace(`
${comment}`, "");
  output = output.replace(`${defaultExport}`, `
${comment}
${defaultExport}`);
  if (input === output) {
    return 0 /* none */;
  }
  const diff = getDiffContent(input, output);
  if (!diff) {
    return 0 /* none */;
  }
  const message = `
${boxen(diff, {
    margin: 0.5,
    padding: 0.5,
    borderStyle: "round",
    title: configURL.pathname.split("/").pop()
  })}
`;
  logger.info(
    null,
    `
  ${magenta("Astro will make the following changes to your config file:")}
${message}`
  );
  if (logAdapterInstructions) {
    logger.info(
      null,
      magenta(
        `  For complete deployment options, visit
  ${bold(
          "https://docs.astro.build/en/guides/deploy/"
        )}
`
      )
    );
  }
  if (await askToContinue({ flags })) {
    await fs.writeFile(fileURLToPath(configURL), output, { encoding: "utf-8" });
    logger.debug("add", `Updated astro config`);
    return 1 /* updated */;
  } else {
    return 2 /* cancelled */;
  }
}
async function getInstallIntegrationsCommand({
  integrations,
  logger,
  cwd = process.cwd()
}) {
  const pm = await preferredPM(cwd);
  logger.debug("add", `package manager: ${JSON.stringify(pm)}`);
  if (!pm)
    return null;
  const dependencies = await convertIntegrationsToInstallSpecifiers(integrations);
  switch (pm.name) {
    case "npm":
      return { pm: "npm", command: "install", flags: [], dependencies };
    case "yarn":
      return { pm: "yarn", command: "add", flags: [], dependencies };
    case "pnpm":
      return { pm: "pnpm", command: "add", flags: [], dependencies };
    case "bun":
      return { pm: "bun", command: "add", flags: [], dependencies };
    default:
      return null;
  }
}
async function convertIntegrationsToInstallSpecifiers(integrations) {
  const ranges = {};
  for (let { packageName, dependencies } of integrations) {
    ranges[packageName] = "*";
    for (const [name, range] of dependencies) {
      ranges[name] = range;
    }
  }
  return Promise.all(
    Object.entries(ranges).map(([name, range]) => resolveRangeToInstallSpecifier(name, range))
  );
}
async function resolveRangeToInstallSpecifier(name, range) {
  const versions = await fetchPackageVersions(name);
  if (versions instanceof Error)
    return name;
  const stableVersions = versions.filter((v) => !v.includes("-"));
  const maxStable = maxSatisfying(stableVersions, range);
  return `${name}@^${maxStable}`;
}
const INHERITED_FLAGS = /* @__PURE__ */ new Set([
  "P",
  "save-prod",
  "D",
  "save-dev",
  "E",
  "save-exact",
  "no-save"
]);
async function tryToInstallIntegrations({
  integrations,
  cwd,
  flags,
  logger
}) {
  const installCommand = await getInstallIntegrationsCommand({ integrations, cwd, logger });
  const inheritedFlags = Object.entries(flags).map(([flag]) => {
    if (flag == "_")
      return;
    if (INHERITED_FLAGS.has(flag)) {
      if (flag.length === 1)
        return `-${flag}`;
      return `--${flag}`;
    }
  }).filter(Boolean).flat();
  if (installCommand === null) {
    return 0 /* none */;
  } else {
    const coloredOutput = `${bold(installCommand.pm)} ${installCommand.command}${[
      "",
      ...installCommand.flags,
      ...inheritedFlags
    ].join(" ")} ${cyan(installCommand.dependencies.join(" "))}`;
    const message = `
${boxen(coloredOutput, {
      margin: 0.5,
      padding: 0.5,
      borderStyle: "round"
    })}
`;
    logger.info(
      null,
      `
  ${magenta("Astro will run the following command:")}
  ${dim(
        "If you skip this step, you can always run it yourself later"
      )}
${message}`
    );
    if (await askToContinue({ flags })) {
      const spinner = ora("Installing dependencies...").start();
      try {
        await execa(
          installCommand.pm,
          [
            installCommand.command,
            ...installCommand.flags,
            ...inheritedFlags,
            ...installCommand.dependencies
          ],
          {
            cwd,
            // reset NODE_ENV to ensure install command run in dev mode
            env: { NODE_ENV: void 0 }
          }
        );
        spinner.succeed();
        return 1 /* updated */;
      } catch (err) {
        spinner.fail();
        logger.debug("add", "Error installing dependencies", err);
        console.error("\n", err.stdout || err.message, "\n");
        return 3 /* failure */;
      }
    } else {
      return 2 /* cancelled */;
    }
  }
}
async function fetchPackageJson(scope, name, tag) {
  const packageName = `${scope ? `${scope}/` : ""}${name}`;
  const registry = await getRegistry();
  const res = await fetch(`${registry}/${packageName}/${tag}`);
  if (res.status >= 200 && res.status < 300) {
    return await res.json();
  } else if (res.status === 404) {
    return new Error();
  } else {
    return new Error(`Failed to fetch ${registry}/${packageName}/${tag} - GET ${res.status}`);
  }
}
async function fetchPackageVersions(packageName) {
  const registry = await getRegistry();
  const res = await fetch(`${registry}/${packageName}`, {
    headers: { accept: "application/vnd.npm.install-v1+json" }
  });
  if (res.status >= 200 && res.status < 300) {
    return await res.json().then((data) => Object.keys(data.versions));
  } else if (res.status === 404) {
    return new Error();
  } else {
    return new Error(`Failed to fetch ${registry}/${packageName} - GET ${res.status}`);
  }
}
async function validateIntegrations(integrations) {
  const spinner = ora("Resolving packages...").start();
  try {
    const integrationEntries = await Promise.all(
      integrations.map(async (integration) => {
        const parsed = parseIntegrationName(integration);
        if (!parsed) {
          throw new Error(`${bold(integration)} does not appear to be a valid package name!`);
        }
        let { scope, name, tag } = parsed;
        let pkgJson;
        let pkgType;
        if (scope && scope !== "@astrojs") {
          pkgType = "third-party";
        } else {
          const firstPartyPkgCheck = await fetchPackageJson("@astrojs", name, tag);
          if (firstPartyPkgCheck instanceof Error) {
            if (firstPartyPkgCheck.message) {
              spinner.warn(yellow(firstPartyPkgCheck.message));
            }
            spinner.warn(
              yellow(`${bold(integration)} is not an official Astro package. Use at your own risk!`)
            );
            const response = await prompts({
              type: "confirm",
              name: "askToContinue",
              message: "Continue?",
              initial: true
            });
            if (!response.askToContinue) {
              throw new Error(
                `No problem! Find our official integrations at ${cyan(
                  "https://astro.build/integrations"
                )}`
              );
            }
            spinner.start("Resolving with third party packages...");
            pkgType = "third-party";
          } else {
            pkgType = "first-party";
            pkgJson = firstPartyPkgCheck;
          }
        }
        if (pkgType === "third-party") {
          const thirdPartyPkgCheck = await fetchPackageJson(scope, name, tag);
          if (thirdPartyPkgCheck instanceof Error) {
            if (thirdPartyPkgCheck.message) {
              spinner.warn(yellow(thirdPartyPkgCheck.message));
            }
            throw new Error(`Unable to fetch ${bold(integration)}. Does the package exist?`);
          } else {
            pkgJson = thirdPartyPkgCheck;
          }
        }
        const resolvedScope = pkgType === "first-party" ? "@astrojs" : scope;
        const packageName = `${resolvedScope ? `${resolvedScope}/` : ""}${name}`;
        let dependencies = [
          [pkgJson["name"], `^${pkgJson["version"]}`]
        ];
        if (pkgJson["peerDependencies"]) {
          const meta = pkgJson["peerDependenciesMeta"] || {};
          for (const peer in pkgJson["peerDependencies"]) {
            const optional = meta[peer]?.optional || false;
            const isAstro = peer === "astro";
            if (!optional && !isAstro) {
              dependencies.push([peer, pkgJson["peerDependencies"][peer]]);
            }
          }
        }
        let integrationType;
        const keywords = Array.isArray(pkgJson["keywords"]) ? pkgJson["keywords"] : [];
        if (keywords.includes("astro-integration")) {
          integrationType = "integration";
        } else if (keywords.includes("astro-adapter")) {
          integrationType = "adapter";
        } else {
          throw new Error(
            `${bold(
              packageName
            )} doesn't appear to be an integration or an adapter. Find our official integrations at ${cyan(
              "https://astro.build/integrations"
            )}`
          );
        }
        return { id: integration, packageName, dependencies, type: integrationType };
      })
    );
    spinner.succeed();
    return integrationEntries;
  } catch (e) {
    if (e instanceof Error) {
      spinner.fail(e.message);
      process.exit(1);
    } else {
      throw e;
    }
  }
}
async function updateTSConfig(cwd = process.cwd(), logger, integrationsInfo, flags) {
  const integrations = integrationsInfo.map(
    (integration) => integration.id
  );
  const firstIntegrationWithTSSettings = integrations.find(
    (integration) => presets.has(integration)
  );
  if (!firstIntegrationWithTSSettings) {
    return 0 /* none */;
  }
  let inputConfig = await loadTSConfig(cwd);
  let inputConfigText = "";
  if (inputConfig === "invalid-config" || inputConfig === "unknown-error") {
    return 3 /* failure */;
  } else if (inputConfig === "missing-config") {
    logger.debug("add", "Couldn't find tsconfig.json or jsconfig.json, generating one");
    inputConfig = {
      tsconfig: defaultTSConfig,
      tsconfigFile: path.join(cwd, "tsconfig.json"),
      rawConfig: { tsconfig: defaultTSConfig, tsconfigFile: path.join(cwd, "tsconfig.json") }
    };
  } else {
    inputConfigText = JSON.stringify(inputConfig.rawConfig.tsconfig, null, 2);
  }
  const configFileName = path.basename(inputConfig.tsconfigFile);
  const outputConfig = updateTSConfigForFramework(
    inputConfig.rawConfig.tsconfig,
    firstIntegrationWithTSSettings
  );
  const output = JSON.stringify(outputConfig, null, 2);
  const diff = getDiffContent(inputConfigText, output);
  if (!diff) {
    return 0 /* none */;
  }
  const message = `
${boxen(diff, {
    margin: 0.5,
    padding: 0.5,
    borderStyle: "round",
    title: configFileName
  })}
`;
  logger.info(
    null,
    `
  ${magenta(`Astro will make the following changes to your ${configFileName}:`)}
${message}`
  );
  const conflictingIntegrations = [...Object.keys(presets).filter((config) => config !== "vue")];
  const hasConflictingIntegrations = integrations.filter((integration) => presets.has(integration)).length > 1 && integrations.filter((integration) => conflictingIntegrations.includes(integration)).length > 0;
  if (hasConflictingIntegrations) {
    logger.info(
      null,
      red(
        `  ${bold(
          "Caution:"
        )} Selected UI frameworks require conflicting tsconfig.json settings, as such only settings for ${bold(
          firstIntegrationWithTSSettings
        )} were used.
  More information: https://docs.astro.build/en/guides/typescript/#errors-typing-multiple-jsx-frameworks-at-the-same-time
`
      )
    );
  }
  if (await askToContinue({ flags })) {
    await fs.writeFile(inputConfig.tsconfigFile, output, {
      encoding: "utf-8"
    });
    logger.debug("add", `Updated ${configFileName} file`);
    return 1 /* updated */;
  } else {
    return 2 /* cancelled */;
  }
}
function parseIntegrationName(spec) {
  const result = parseNpmName(spec);
  if (!result)
    return;
  let { scope, name } = result;
  let tag = "latest";
  if (scope) {
    name = name.replace(scope + "/", "");
  }
  if (name.includes("@")) {
    const tagged = name.split("@");
    name = tagged[0];
    tag = tagged[1];
  }
  return { scope, name, tag };
}
async function askToContinue({ flags }) {
  if (flags.yes || flags.y)
    return true;
  const response = await prompts({
    type: "confirm",
    name: "askToContinue",
    message: "Continue?",
    initial: true
  });
  return Boolean(response.askToContinue);
}
function getDiffContent(input, output) {
  let changes = [];
  for (const change of diffWords(input, output)) {
    let lines = change.value.trim().split("\n").slice(0, change.count);
    if (lines.length === 0)
      continue;
    if (change.added) {
      if (!change.value.trim())
        continue;
      changes.push(change.value);
    }
  }
  if (changes.length === 0) {
    return null;
  }
  let diffed = output;
  for (let newContent of changes) {
    const coloredOutput = newContent.split("\n").map((ln) => ln ? green(ln) : "").join("\n");
    diffed = diffed.replace(newContent, coloredOutput);
  }
  return diffed;
}
async function setupIntegrationConfig(opts) {
  const logger = opts.logger;
  const possibleConfigFiles = opts.possibleConfigFiles.map(
    (p) => fileURLToPath(new URL(p, opts.root))
  );
  let alreadyConfigured = false;
  for (const possibleConfigPath of possibleConfigFiles) {
    if (existsSync(possibleConfigPath)) {
      alreadyConfigured = true;
      break;
    }
  }
  if (!alreadyConfigured) {
    logger.info(
      null,
      `
  ${magenta(`Astro will generate a minimal ${bold(opts.defaultConfigFile)} file.`)}
`
    );
    if (await askToContinue({ flags: opts.flags })) {
      await fs.writeFile(
        fileURLToPath(new URL(opts.defaultConfigFile, opts.root)),
        opts.defaultConfigContent,
        {
          encoding: "utf-8"
        }
      );
      logger.debug("add", `Generated default ${opts.defaultConfigFile} file`);
    }
  } else {
    logger.debug("add", `Using existing ${opts.integrationName} configuration`);
  }
}
export {
  add,
  validateIntegrations
};
