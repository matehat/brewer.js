{Command} = require 'commander'
clr = require('ansi-color').set

@version = getVersion = ->
  fs = require 'fs'
  path = require 'path'
  pkg = JSON.parse fs.readFileSync path.resolve __dirname, '../package.json'
  pkg.version

@finished = (action, target) ->
  console.log clr(action, 'blue'), target

@debug = (msgs...) ->
  console.log clr('DEBUG', 'red'), msgs...

@run = (argv) ->
  (program = new Command).version(getVersion())
    .command('init')
    .description "Initialize #{clr('Brewer', 'green')} in the current directory"
  
  program
    .command('bundle [packages*]')
    .description "Aggregate bundles from the given packages (or all)"
  
  program
    .command('compress [packages*]')
    .description "Aggregate and compress bundles from the given packages (or all)"
  
  program
    .command("update")
    .description "Download dependencies into a local cache"
  
  program
    .
  
  program
    .command('watch')
    .description """
      Watch for modifications on source files, automatically
      compiling/compressing/packaging when they occur.
    """
  
  program.parse argv
