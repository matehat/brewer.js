{Package, Source} = require '..'
{finished, debug} = require '../command'

class StylesheetsPackage extends Package
  @type = 'stylesheets'
  @aliases = ['css']
  @compressedext = '.min.css'
  @ext = '.css'
  
  compressFile: (original, dest, cb) ->
    compress = (data, cb) -> cb null, (require 'ncss') data
    original.project dest, compress, (err) ->
      cb err if err
      finished 'Compressed', original.fullpath
      cb()
  

  
class StylesheetsSource extends Source
  @type = 'stylesheets'
  @aliases = ['css']
  @ext = '.css'
  @header = /^\/\*\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//m


Source.extend StylesheetsSource
Package.extend StylesheetsPackage
(require 'underscore').extend exports, {StylesheetsPackage, StylesheetsSource}
