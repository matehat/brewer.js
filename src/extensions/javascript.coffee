{Package, Source} = require '..'
{finished, debug} = require '../command'

class JavascriptPackage extends Package
  @type = 'javascript'
  @aliases = ['js']
  @compressedext = '.min.js'
  @ext = '.js'
  
  compressFile: (original, dest, cb) ->
    compress = (data, cb) -> 
      {parser, uglify} = require 'uglify-js'
      {gen_code, ast_squeeze, ast_mangle} = uglify
      cb null, gen_code ast_squeeze parser.parse data
    
    original.project dest, compress, (err) ->
      cb err if err
      finished 'Compressed', original.fullpath
      cb()
  


class JavascriptSource extends Source
  @type = 'javascript'
  @aliases = ['js']
  @ext = '.js'
  @header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m


Source.extend JavascriptSource
Package.extend JavascriptPackage