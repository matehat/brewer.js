# ### Coffeescript extension
#
# The coffee-script extension works by compiling all *.coffee* files
# contained in a source of type *coffeescript*, into an output 
# directory. That compiled file is marked as impermanent and depends on 
# the original *.coffee* file. Imports specified into a *.coffee* file
# are carried over to the compiled *javascript* file.

# Underscore, CLI utilities and the *Source* class are loaded
_ = require 'underscore'
{debug, finished, showError} = require '../command'
{Source} = require '../source'

# The *Source* class is subclassed and essential 
# [class variables](source.html#section-2) are specified.
class CoffeescriptSource extends Source
  @type = 'coffeescript'
  @aliases = ['coffee-script', 'cs']
  @header = /^#\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  @ext = '.coffee'
  
  # This method overrides the `createFile` instance method to create 
  # a compiled counterpart for every coffeescript source file found.
  createFile: (path) ->
    original = super
    @createCompiledFile original
    original
  
  
  # This method takes a source file as argument and creates another
  # file that represent the compiled counterpart of the original file.
  # The fullpath is obtained by concatenating the output directory,
  # the access path and the '.js' extension. The new file is marked as
  # depending on the original coffeescript source file, carries over
  # its imports and marked as impermanent.
  createCompiledFile: (original) ->
    cpath = (require '../util').changeext (fpath = original.relpath), '.js'
    compiled = @package.file fpath, 'javascript', (require 'path').join(@output, cpath), this
    compiled.dependOn original, _.bind(@compile, this)
    compiled.setImportedPaths original.readImportedPaths()
    compiled.impermanent = true
    compiled.register()
    compiled
  
  
  # This method takes two files and continuation callback, the first
  # being a coffeescript source file and the second its compiled 
  # counterpart. This follows the convention needed by the `file.dependOn`
  # method. This method gets called whenever the second file is invalidated
  # and needs updating. What it does is simply to compile coffeescript code
  # from the first file and output the result to the second file, all of
  # this using the `file.project` method.
  compile: (original, compiled, cb) ->
    compile = (data, cb2) ->
      try
        cb2 null, (require 'coffee-script').compile data
      catch err
        # In case the compilation triggered an error, we catch it
        # and display it in the CLI, aborting the compilation, but
        # continuing the package actualization.
        showError 'in', original.fullpath, ':', err.message
        cb()
    
    original.project compiled, compile, (err) ->
      cb err if err
      finished 'Compiled', original.fullpath
      cb()
    
  


Source.extend CoffeescriptSource