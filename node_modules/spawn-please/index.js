const spawn = require('cross-spawn')

/** Spawns a child process, as long as you ask nicely.
 * 
 * @param {string} command - The shell command to execute.
 * @param {string[]} args - An array of arguments that are given after the command.
 * @param {string | any} [stdin] - A string that is passed to stdin.
 * @param {any} [options] - Options that are passed directly to child_process.spawn.
 * @returns {Promise<string>}
 */
const spawnPlease = (command, args, stdin, options) => {
  // if there are only three arguments and the third argument is an object, treat it as the options object and set stdin to null
  if (!options && typeof stdin === 'object') {
    options = stdin
    stdin = undefined
  }

  // defaults
  options = options || {}
  if (options.rejectOnError === undefined) {
    options.rejectOnError = true
  }

  let stdout = ''
  let stderr = ''
  const child = spawn(command, args, options)

  return new Promise((resolve, reject) => {
    if (stdin !== undefined && stdin !== null) {
      child.stdin.write(stdin)
    }
    child.stdin.end()

    child.stdout.on('data', data => {
      stdout += data
      if (options.stdout) options.stdout(data)
    })

    child.stderr.on('data', data => {
      stderr += data
      if (options.stderr) options.stderr(data)
    })

    if (options.rejectOnError) {
      child.addListener('error', reject)
    }

    child.on('close', code => {
      if (code !== 0 && options.rejectOnError) {
        reject(stderr)
      } else {
        resolve(stdout)
      }
    })
  })
}

module.exports = spawnPlease
