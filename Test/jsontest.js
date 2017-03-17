var Files = require('fs')

try {
var Options = JSON.parse(Files.readFileSync(__dirname + '/Example/options.json', 'utf8'))
} catch (e) {
  console.error('unabled to read the options file')
} finally {
  console.error('bye')
  return
}


console.log(Options.version)
