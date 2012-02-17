# ### LESS extension
#
# The LESS extension works by compiling all *.less* files
# contained in a source of type *less*, into an output 
# directory. That compiled file is marked as impermanent and depends on 
# the original *.less* file. Imports specified into a *.less* file
# are carried over to the compiled *stylesheet*.

{Source} = require '..'
{finished, debug, showError} = require '../command'

# The *Source* class is subclassed and essential 
# [class variables](source.html#section-2) are specified.
class LessSource extends Source
  @type = 'less'
  @aliases = []
  @ext = '.less'
  @header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  
  # This method overrides the `createFile` instance method to create 
  # a compiled counterpart for every less source file found.
  createFile: (path) ->
    original = super
    @createCompiledFile original
    original
  
  
  # This method takes a source file as argument and creates another
  # file that represent the compiled counterpart of the original file.
  # The fullpath is obtained by concatenating the output directory,
  # the access path and the '.less' extension. The new file is marked as
  # depending on the original less source file, carries over
  # its imports and marked as impermanent.
  createCompiledFile: (original) ->
    cpath = (require '../util').changeext (opath = original.relpath), '.css'
    compiled = @package.file opath, 'stylesheets', (require 'path').join(@output, cpath), @
    compiled.dependOn original, (require 'underscore').bind(@compile, @)
    compiled.setImportedPaths original.readImportedPaths()
    compiled.impermanent = true
    compiled.register()
    compiled
  
  
  # This method takes two files and continuation callback, the first
  # being a less source file and the second its compiled 
  # counterpart. This follows the convention needed by the `file.dependOn`
  # method. This method gets called whenever the second file is invalidated
  # and needs updating.
  compile: (original, compiled, cb) ->
    resolve = (require 'path').resolve
    
    # The directory of all sources of type less are put into a list of paths
    # so the compiler knows where to look for referenced less files.
    paths = (resolve(src.path) for src in @package.sources.less)
    paths.push(resolve(lib.path)) for lib in @package.vendorlibs.libraries 'less'
    parser = new (require('less').Parser)
      filename: original.fullpath
      paths: paths
    
    # We try to catch parsing error and show them in the CLI so developers
    # gets a useful error message whenever possible. If it fails, parsing
    # aborts, but the package actualization continues.
    compile = (data, cb2) ->
      try
        parser.parse data, (err, tree) ->
          if err
            showError 'in', original.fullpath, ':', err.message
            cb()
          else
            cb2 null, tree.toCSS()
      catch err
        showError 'in', original.fullpath, ':', err.message
        cb()
    
    # It compiles less code from the first file and output the result to the 
    # second file, all of this using the `file.project` method.
    original.project compiled, compile, (err) ->
      cb err if err
      finished 'Compiled', original.fullpath
      cb()
    
  

Source.extend exports.LessSource = LessSource