# ### CSS Extension
#
# This extension defined *Package* and *Source* subclasses specific
# for stylesheets. This barely implies defining specific classes properties
# and the compression behavior on the *Package* subclass.

{Package, Source} = require '..'
{finished, debug} = require '../command'

# *Package* is subclassed by providing the required 
# [class properties](package.html#section-2)
class StylesheetsPackage extends Package
  @type = 'stylesheets'
  @aliases = ['css']
  @compressedext = '.min.css'
  @ext = '.css'
  
  # This method complies to the convention required by the `file.dependOn`
  # method, so it gets called whenever a dependent file in invalidated
  # and must be updated, relative to its source file. It takes an original
  # (the bundle) and destination file (the compressed counterpart) and 
  # updates the second.
  compressFile: (original, dest, cb) ->
    {cssmin} = require 'css-compressor'
    compress = (data, cb2) ->
      cb2 null, cssmin data
    
    original.project dest, compress, (err) ->
      cb err if err
      finished 'Compressed', original.fullpath
      cb()
  
# *Source* is subclassed by providing, again, the required
# [class properties](source.html#section-2)
class StylesheetsSource extends Source
  @type = 'stylesheets'
  @aliases = ['css']
  @header = /^\/\*\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//m
  @ext = '.css'


Source.extend StylesheetsSource
Package.extend StylesheetsPackage
