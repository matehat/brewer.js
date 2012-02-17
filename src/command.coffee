# This module holds everything related to interacting with brewer.js from 
# the shell, including the *[bin/brewer](#section-6)* utility, and 
# different [shell printing functions](#section-5).

# Essential modules are imported
fs = require 'fs'
path = require 'path'
Command = require('commander').Command
clr = require('ansi-color').set
_ = require 'underscore'

# This function returns the version number from the *package.json* file.
exports.version = getVersion = ->
  fs = require 'fs'
  path = require 'path'
  pkg = JSON.parse fs.readFileSync path.resolve __dirname, '../package.json'
  pkg.version

# This function returns a `Project` object from the Brewfile located
# in the current working directory.
getLocalProject = ->
  new (require './index').Project './Brewfile'

##### CLI utility functions
#
# These functions are used to standardize how certain types of
# of messages are displayed in the shell, are all exported and used
# throughout brewer.js.

_.extend exports, cli = {
  finished: (action, target) ->
    console.log clr(action, 'blue'), target
  
  debug: (msgs...) ->
    console.log clr('DEBUG', 'red'), msgs...
  
  warning: (msgs...) ->
    console.log clr('Warning', 'yellow'), msgs...
  
  info: (msgs...) ->
    console.log clr('Info', 'green'), msgs...
  
  error: (msgs...) ->
    console.log clr('Error', 'red'), msgs...
  
}

#### bin/brewer 
#
# Making heavy use of 
# [commander.js](http://visionmedia.github.com/commander.js/).
# A `run` function is exported, which takes the process argument list (`process.argv`)
# as arguments and executes a *Commander.js*'s Command object on them. The version is
# extracted using [`getVersion()`](#section-3) above.

exports.run = (argv) ->
  (program = new Command)
    .version(getVersion())
    .option('-t, --template <template>', 
      'Specify the project template to use (default to \'lesscoffee\') when initializing.')
  
  ##### The `init` command
  #
  # This command is used to initialize a Brewfile and a directory structure in the
  # current working directory. It first checks if a template was specified, using the 
  # default otherwise. It writes that template file into *Brewfile*, initialize a
  # `Project` object from it and asks it to produce the directory structure.
  
  program
    .command('init')
    .description(" Initialize #{clr('Brewer', 'green')} in the current directory")
    .action ->
      templ = program.template ? 'lesscoffee'
      template = path.join(__dirname, '..', 'templates', "#{templ}.coffee")
      content = fs.readFileSync template, 'utf-8'
      cli.info 'Writing Brewfile'
      fs.writeFileSync 'Brewfile', content, 'utf-8'
      
      cli.info 'Making initial folder structure'
      getLocalProject().prepare()
    
  
  ##### The `watch` command
  #
  # This command is used to watch a whole project, monitoring changes on the
  # *Brewfile*, as well as changed, new, deleted or moved source files. When such 
  # changes occus, the local `Project` object is asked to re-actualize.
  # All the logic is contained in the `Project` class, so here only the `.watch()`
  # method is called.
  
  program
    .command('watch')
    .description("""
       Watch for modifications in source and configuration files, 
      automatically re-making when they occur.
    """)
    .action ->
      getLocalProject().watch()
      cli.info 'Watching project', process.cwd()
    
  
  ##### The `make` command
  #
  # This command is used to actualize a whole project or specific packages within it.
  # It first checks to see if package names were specified, defaulting to 'all' otherwise.
  # Then, the `.actualize()` method is called on each matching package.
  
  program
    .command('make [packages]*')
    .description(" Aggregate bundles from the given packages (or all)")
    .action (pkgs) ->
      pkgs ?= 'all'
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
    
  
  ##### The `clean` command
  #
  # This command is used to remove files that are derived from source files. This 
  # includes compiled *javascript* and *css* files, as well as bundles and their
  # compressed counterparts.
  
  program
    .command('clean [packages]*')
    .description(" Delete bundles and compiled files from the given packages (or all)")
    .action (pkgs) ->
      pkgs ?= 'all'
      project = getLocalProject()
      if pkgs is 'all'
        packages = project
      else
        names = pkgs.split(',')
        packages = (pkg for pkg in project when pkg.name in names)
      
      for pkg in packages
        do (pkg) -> pkg.clean()
    
  
  # #### The `install` command
  #
  # This command is used to install the modules required for the current project 
  # to function properly, according to the Brewfile.
  
  program
    .command('install')
    .description(" Install missing modules required to manage the current project")
    .action ->
      project = getLocalProject()
      if project.missingModules().length > 0
        project.installMissingModules()
      else
        cli.info 'No modules are missing.'
    
  
  # This tells the `Command` object to parse the given program arguments, triggering
  # the proper action, or printing the usage.
  program.parse argv
