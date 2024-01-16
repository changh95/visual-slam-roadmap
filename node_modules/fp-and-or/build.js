const fs = require('fs')
const _ = require('lodash')

const readmeTemplateFile = fs.readFileSync('README-template.md', 'utf-8')
const testFile = fs.readFileSync('index.test.js', 'utf-8')

const usage = testFile
  // strip require, closing brackets, and leading indentations
  .replace(/.*require\(.*\).*/, '')
  .replace(/\s*\}\)\s*/g, '\n')
  .replace(/^\s+/gm, '')
  // convert describe to h3
  .replace(/.*describe\(['"](.*)['"].*/g, (_, title) => `\n### ${title}`)
  // convert test to h4
  .replace(/.*test\(['"](.*)['"].*/g, (_, title) => `\n#### ${title}`)
  // convert expect to code block
  .replace(/.*expect\((.*)\).toBe\((.*)\)/g, (_, received, value) => `\`\`\`js\n${received} // ${value}\n\`\`\``)
  // merge adjacent code blocks
  .replace(/```\n```js\n/g, '')
  // add closing code block above first describe
  .replace('\n###', '```\n\n###')

const readme = _.template(readmeTemplateFile)({ usage })
fs.writeFileSync('README.md', readme)
