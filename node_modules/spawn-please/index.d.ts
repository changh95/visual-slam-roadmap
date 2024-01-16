export = spawnPlease;
/** Spawns a child process, as long as you ask nicely.
 * @param {string} command - The shell command to execute.
 * @param {string[]} args - An array of arguments that are given after the command.
 * @param {string | any} [stdin] - A string that is passed to stdin.
 * @param {any} [options] - Options that are passed directly to child_process.spawn.
 * @returns {Promise<string>}
 */
declare function spawnPlease(command: string, args: string[], stdin?: string | any, options?: any): Promise<string>;
//# sourceMappingURL=index.d.ts.map