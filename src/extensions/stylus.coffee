# ### Stylus extension
#
# The Stylus extension works by compiling all *.styl* files
# contained in a source of type *Stylus*, into an output 
# directory. That compiled file is marked as impermanent and depends on 
# the original *.styl* file. Imports specified into a *.styl* file
# are carried over to the compiled *stylesheet*.

_ = require 'underscore'
{Source} = require '..'
{finished, debug, error} = require '../command'

# The *Source* class is subclassed and essential 
# [class variables](source.html#section-2) are specified.
class StylusSource extends Source
  @type = 'stylus'
  @aliases = ['styl']
  @ext = '.styl'
  @header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  requiredModules: -> ['stylus']
  
  # This method overrides the `createFile` instance method to create 
  # a compiled counterpart for every stylus source file found.
  createFile: (path) ->
    original = super
    @createCompiledFile original
    original
  
  
  # This method takes a source file as argument and creates another
  # file that represent the compiled counterpart of the original file.
  # The fullpath is obtained by concatenating the output directory,
  # the access path and the '.styl' extension. The new file is marked as
  # depending on the original stylus source file, carries over
  # its imports and marked as impermanent.
  createCompiledFile: (original) ->
    cpath = (require '../util').changeext (opath = original.relpath), '.css'
    compiled = @package.file opath, 'stylesheets', 
      (require 'path').join(@output, cpath), @
    compiled.dependOn original, _.bind(@compile, @)
    compiled.setImportedPaths original.readImportedPaths()
    compiled.impermanent = true
    compiled.register()
    compiled
  
  # This method takes two files and continuation callback, the first
  # being a stylus source file and the second its compiled 
  # counterpart. This follows the convention needed by the `file.dependOn`
  # method. This method gets called whenever the second file is invalidated
  # and needs updating.
  compile: (original, compiled, cb) ->
    compile = (data, cb2) =>
      parser = require('stylus') data
      parser.set 'filename', @file
      
      # The directory of all sources of type stylus are put into a list of paths
      # so the compiler knows where to look for referenced stylus files. Also,
      # if a stylus vendor library happens to be a stylus module, we try
      # to `use()` it.
      parser.set 'paths', (src.path for src in @package.sources.stylus)
      for mod in @package.vendorlibs.libraries 'stylus'
        try
          module = require (require 'path').resolve mod.path
          parser.use(module()) if _.isFunction module
        catch err
          continue
      
      parser.render (err, css) ->
        if err?
          error 'in', original.fullpath, ':', err.message
          cb()
        else
          cb2 null, css
    
    # It compiles stylus code from the first file and output the result to the 
    # second file, all of this using the `file.project` method.
    original.project compiled, compile, (err) ->
      cb err if err
      finished 'Compiled', original.fullpath
      cb()
    
  

StylusSource.register()
exports.StylusSource = StylusSource