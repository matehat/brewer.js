path  = require 'path'
util  = require './util'
fs    = require 'fs'

class Bundle
  constructor: (@brewer, @file) ->
    @basepath = path.join @brewer.build, @file
    @compressed = @brewer.compressed_name filename: util.changeExtension @basepath, ''
  
  filepath: ->
    @_filepath = util.changeExtension @basepath, @ext unless @_filepath?
    @_filepath
  
  readFile: (i, cb, mod=((a)->a)) ->
    file = if i < @files.length then @files[i] else @file
    rs = fs.readFile path.resolve(@brewer.compressible(file)), {encoding: 'utf-8'}, (err, data) =>
      throw err if err
      @stream += mod(data.toString())
      @nextFile i, cb, mod
  
  nextFile: (i, cb, mod) ->
    if i < @files.length
      @readFile i+1, cb, mod
    else
      cb @stream
      delete @stream
  
  bundle: (cb) ->
    @brewer.deps @file, (@files) =>
      @stream = ''
      @readFile 0, cb
  

@JavascriptBundle = class JavascriptBundle extends Bundle
  constructor: (@brewer, @file) ->
    @ext = '.js'
    @uglify = require 'uglify-js'
    super @brewer, @file
  
  bundle: (cb) ->
    {parser, uglify} = require 'uglify-js'
    super (data) =>
      util.makedirs path.dirname fp = @filepath()
      fs.writeFile fp, data, 'utf-8', -> 
        cb fp
  
  compress: (cb) ->
    {parser, uglify} = require 'uglify-js'
    {gen_code, ast_squeeze, ast_mangle} = uglify
    @brewer.deps @file, (@files) =>
      @stream = ''
      @readFile 0, (data) =>
        util.makedirs path.dirname fp = @compressed
        fs.writeFile fp, data, 'utf-8', -> 
          cb(fp)
      , (data) =>
        gen_code(ast_squeeze parser.parse(data)) + ';'
  

@CSSBundle = class CSSBundle extends Bundle
  constructor: (@brewer, @file) ->
    @ext = '.css'
    @ncss = require 'ncss'
    super @brewer, @file
  
  bundle: (cb) ->
    super (data) =>
      util.makedirs dirname fp = @filepath()
      fs.writeFile fp, data, 'utf-8', -> cb fp
  
  compress: (cb) ->
    fs.readFile @filepath(), 'utf-8', (err, data) =>
      fs.writeFile @compressed, @ncss(data), 'utf-8', => cb @compressed
  

@SassBundle = class SassBundle extends CSSBundle
  constructor: (@brewer, @file) ->
    super @brewer @file
    @ext = '.sass'
    @sass = require 'sass'
  
  filepath: ->
    @_filepath = util.changeExtension @basepath, '.css' unless @_filepath?
    @_filepath
  
  bundle: (cb) ->
    super (data) =>
      util.makedirs dirname, fp = @filepath()
      fs.writeFile fp, @sass.render(data), 'utf-8', => cb fp
  
