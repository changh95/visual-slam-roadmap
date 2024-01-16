const chai = require('chai')
const should = chai.should()
const chaiAsPromised = require('chai-as-promised')
const spawn = require('../index.js')

chai.use(chaiAsPromised)

describe('spawn-please', () => {
  it('resolve on success', async () => {
    await spawn('true')
  })

  it('reject on fail', async () => {
    return spawn('false').catch(function (err) {
      should.exist(err)
    })
  })

  it('allow errors to be ignored with rejectOnError: false', async () => {
    await spawn('false', [], { rejectOnError: false })
  })

  it('ignore stderr with rejectOnError: false', async () => {
    const output = await spawn('node', ['./stdout-and-stderr.js'], { cwd: __dirname, rejectOnError: false })
    output.should.equal('STDOUT\n')
  })

  it('no arguments', async () => {
    const output = await spawn('env')
    output.trim().should.match(/^PATH=/gm)
  })

  it('one argument', async () => {
    const output = await spawn('printf', ['hello'])
    output.should.equal('hello')
  })

  it('accept options as third argument', async () => {
    const output = await spawn('pwd', [], { cwd: __dirname })
    output.trim().should.equal(__dirname)
  })

  it('accept options as fourth argument', async () => {
    const pwd = await spawn('pwd', [], 'test', { cwd: __dirname })
    pwd.trim().should.equal(__dirname)
  })

  it('accept stdin', async () => {
    const output = await spawn('cat', [], 'test')
    output.should.equal('test')
  })

  it('accept options as fourth argument and read stdin', async () => {
    const cat = await spawn('cat', [], 'test', { cwd: __dirname })
    cat.should.equal('test')
  })

  it('only resolve stdout when fulfilled', async () => {
    const output = await spawn('node', ['./stdout-and-stderr.js'], { cwd: __dirname })
    output.should.equal('STDOUT\n')
  })

  it('expose stdout and stderr', () => {
    let stdoutOutput = ''
    let stderrOutput = ''
    return spawn('node', ['./stdout-and-stderr.js'], {
      cwd: __dirname,
      stderr: function (data) {
        stderrOutput += data
      },
      stdout: function (data) {
        stdoutOutput += data
      },
    }).then(() => {
      stderrOutput.trim().should.equal('STDERR')
      stdoutOutput.trim().should.equal('STDOUT')
    })
  })
})
