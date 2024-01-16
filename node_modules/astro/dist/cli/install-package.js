import boxen from "boxen";
import { execa } from "execa";
import { bold, cyan, dim, magenta } from "kleur/colors";
import ora from "ora";
import prompts from "prompts";
import resolvePackage from "resolve";
import whichPm from "which-pm";
import {} from "../core/logger/core.js";
async function getPackage(packageName, logger, options, otherDeps = []) {
  let packageImport;
  try {
    await tryResolve(packageName, options.cwd ?? process.cwd());
    packageImport = await import(packageName);
  } catch (e) {
    logger.info(
      null,
      `To continue, Astro requires the following dependency to be installed: ${bold(packageName)}.`
    );
    const result = await installPackage([packageName, ...otherDeps], options, logger);
    if (result) {
      packageImport = await import(packageName);
    } else {
      return void 0;
    }
  }
  return packageImport;
}
function tryResolve(packageName, cwd) {
  return new Promise((resolve, reject) => {
    resolvePackage(
      packageName,
      {
        basedir: cwd
      },
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(0);
        }
      }
    );
  });
}
function getInstallCommand(packages, packageManager) {
  switch (packageManager) {
    case "npm":
      return { pm: "npm", command: "install", flags: [], dependencies: packages };
    case "yarn":
      return { pm: "yarn", command: "add", flags: [], dependencies: packages };
    case "pnpm":
      return { pm: "pnpm", command: "add", flags: [], dependencies: packages };
    case "bun":
      return { pm: "bun", command: "add", flags: [], dependencies: packages };
    default:
      return null;
  }
}
async function installPackage(packageNames, options, logger) {
  const cwd = options.cwd ?? process.cwd();
  const packageManager = (await whichPm(cwd)).name ?? "npm";
  const installCommand = getInstallCommand(packageNames, packageManager);
  if (!installCommand) {
    return false;
  }
  const coloredOutput = `${bold(installCommand.pm)} ${installCommand.command}${[
    "",
    ...installCommand.flags
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
  let response;
  if (options.skipAsk) {
    response = true;
  } else {
    response = (await prompts({
      type: "confirm",
      name: "askToContinue",
      message: "Continue?",
      initial: true
    })).askToContinue;
  }
  if (Boolean(response)) {
    const spinner = ora("Installing dependencies...").start();
    try {
      await execa(
        installCommand.pm,
        [installCommand.command, ...installCommand.flags, ...installCommand.dependencies],
        { cwd }
      );
      spinner.succeed();
      return true;
    } catch (err) {
      logger.debug("add", "Error installing dependencies", err);
      spinner.fail();
      return false;
    }
  } else {
    return false;
  }
}
export {
  getPackage
};
