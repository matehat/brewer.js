# ### Iced Coffeescript extension
#
# The iced-coffee-script extension works by compiling all *.iced* files
# contained in a source of type *icedcoffeescript*, into an output 
# directory. That compiled file is marked as impermanent and depends on 
# the original *.iced* file. Imports specified into a *.iced* file
# are carried over to the compiled *javascript* file.

# Underscore, CLI utilities and the *Source* class are loaded
{debug, finished, error} = require '../command'
{Source} = require '../source'
require './coffee-script'

class CoffeescriptSource extends Source.coffeescript
  @type = 'icedcoffeescript'
  @aliases = ['iced-coffee-script', 'ics']
  @header = /^#\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  @ext = '.iced'
  requiredModules: -> ['iced-coffee-script']
  constructor: (options) ->
    super
    # We make an additional available option on this type of source:
    # `runtime`, which can be either 'window' or 'node'. In the first case,
    # which is also the default, utilities essential to IcedCoffeescript are
    # attached to the window object and in the second, they are pulled using
    # node.js's normal module system (which requires the user to have 
    # iced-coffee-script installed).
    (require 'underscore').defaults options, {runtime: 'window'}
    {@runtime} = options
  
  # This method takes two files and continuation callback, the first
  # being a iced-coffeescript source file and the second its compiled 
  # counterpart. This follows the convention needed by the `file.dependOn`
  # method. This method gets called whenever the second file is invalidated
  # and needs updating. What it does is simply to compile icedcoffeescript code
  # from the first file and output the result to the second file, all of
  # this using the `file.project` method.
  compile: (original, compiled, cb) ->
    compile = (data, cb2) =>
      try
        ndata = (require 'iced-coffee-script').compile(data, {runtime: @runtime})
        cb2 null, ndata
      catch err
        # In case the compilation triggered an error, we catch it
        # and display it in the CLI, aborting the compilation, but
        # continuing the package actualization.
        error 'in', original.fullpath, ':', err.message
        cb()
    
    original.project compiled, compile, (err) ->
      cb err if err
      finished 'Compiled', original.fullpath
      cb()
    
  

Source.extend CoffeescriptSource