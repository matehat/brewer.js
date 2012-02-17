# ### CSS Extension
#
# This extension defined *Package* and *Source* subclasses specific
# for javascript files. This barely implies defining specific classes 
# properties and the compression behavior on the *Package* subclass.

{Package, Source} = require '..'
{finished, debug} = require '../command'

# *Package* is subclassed by providing the required 
# [class properties](package.html#section-2)
class JavascriptPackage extends Package
  @type = 'javascript'
  @aliases = ['js']
  @compressedext = '.min.js'
  @ext = '.js'
  
  requiredModules: -> 
    [super()..., 'uglify-js']
  
  
  # This method complies to the convention required by the `file.dependOn`
  # method, so it gets called whenever a dependent file in invalidated
  # and must be updated, relative to its source file. It takes an original
  # (the bundle) and destination file (the compressed counterpart) and 
  # updates the second.
  compressFile: (original, dest, cb) ->
    compress = (data, cb) -> 
      {parser, uglify} = require 'uglify-js'
      {gen_code, ast_squeeze, ast_mangle} = uglify
      cb null, gen_code ast_squeeze parser.parse data
    
    original.project dest, compress, (err) ->
      cb err if err
      finished 'Compressed', original.fullpath
      cb()
  

# *Source* is subclassed by providing, again, the required
# [class properties](source.html#section-2)
class JavascriptSource extends Source
  @type = 'javascript'
  @aliases = ['js']
  @ext = '.js'
  @header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m



Source.extend JavascriptSource
Package.extend JavascriptPackage

# Thumbs up if you noticed these docs are pretty much copy-pasted from 
# [css.coffee](css.html)! :)