{Command} = require 'commander'
clr = require('ansi-color').set

@version = getVersion = ->
  fs = require 'fs'
  path = require 'path'
  pkg = JSON.parse fs.readFileSync path.resolve __dirname, '../package.json'
  pkg.version

@finished = (action, target) ->
  console.log '-', clr(action, 'blue'), target

@debug = (msgs...) ->
  console.log '?', clr('DEBUG', 'red'), msgs...

@run = (argv) ->
  (program = new Command).version(getVersion())
    .command('init')
    .description("Initialize #{clr('Brewer', 'green')} in the current directory")
      
  program
    .command('watch')
    .description("""Watch for modifications on source files, automatically
    compiling/compressing/packaging when they occur.""")
  
  program
    .command('server [port]')
    .description("Start the #{clr('Brewer', 'green')} server")
    .action (port) ->
      (require './web').run port ? 3000
  
  program.parse argv
