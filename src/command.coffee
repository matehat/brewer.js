{Command} = require 'commander'
clr = require('ansi-color').set
fs = require 'fs'
path = require 'path'
_ = require 'underscore'

exports.version = getVersion = ->
  fs = require 'fs'
  path = require 'path'
  pkg = JSON.parse fs.readFileSync path.resolve __dirname, '../package.json'
  pkg.version

getLocalProject = ->
  (require './index').Project.fromBrewfile './Brewfile'

# ### A few message display functions
cli = {
  finished: (action, target) ->
    console.log clr(action, 'blue'), target

  debug: (msgs...) ->
    console.log clr('DEBUG', 'red'), msgs...

  warning: (msgs...) ->
    console.log clr('Warning', 'yellow'), msgs...

  info: (msgs...) ->
    console.log clr('Info', 'green'), msgs...
}
_.extend exports, cli

# ### The command-line interface
@run = (argv) ->
  (program = new Command)
    .version(getVersion())
    .option('-t, --template <template>', 'Specify the project template to use (default to \'lesscoffee\') when initializing.')
  
  program
    .command('init')
    .description("Initialize #{clr('Brewer', 'green')} in the current directory")
    .action ->
      templ = program.template ? 'lesscoffee'
      template = path.join(__dirname, '..', 'templates', "#{templ}.coffee")
      content = fs.readFileSync template, 'utf-8'
      cli.info 'Writing Brewfile'
      fs.writeFileSync 'Brewfile', content, 'utf-8'
      
      cli.info 'Making initial folder structure'
      getLocalProject().prepare()
  
  program
    .command('watch')
    .description("""
      Watch for modifications on source files, automatically
      compiling/compressing/packaging when they occur.
    """)
    .action (pkgs) ->
  
  program
    .command('make [packages]*')
    .description("Aggregate bundles from the given packages (or all)")
    .action (pkgs) ->
      project = getLocalProject()
      if pkgs is 'all'
        packages = project
      else
        names = pkgs.split(',')
        packages = (pkg for pkg in project when pkg.name in names)
      
      for pkg in packages
        do (pkg) ->
          pkg.actualize ->
            cli.info "Finished making #{clr(pkg.name, 'underline')} package"
  
  program.parse argv
