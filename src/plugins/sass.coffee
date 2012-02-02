util = require './../util'
fs = require 'fs'
path = require 'path'
{Source} = require './..'
{StylesheetsBrewer, StylesheetsSource, StylesheetsBundle} = require './css'

@SassBundle = class SassBundle extends StylesheetsBundle
  constructor: (@brewer, @file) ->
    super @brewer @file
    @ext = '.sass'
    @buildext = '.css'
    @sass = require 'sass'
  
  bundle: (cb) ->
    super (data) =>
      util.makedirs path.dirname fp = @filepath()
      fs.writeFile fp, @sass.render(data), 'utf-8', => cb fp
    
  sourcePath: (i) ->
    file = if i < @files.length then @files[i] else @file
    fname = util.changeExtension file, '.sass'
    fname = '_' + fname if file != @file
    path.join @brewer.source(file).css_path, fname
  
  readFile: (i, cb, mod=((a)->a)) ->
    file = if i < @files.length then @files[i] else @file
    rs = fs.readFile @sourcePath(i), {encoding: 'utf-8'}, (err, data) =>
      throw err if err
      @stream += mod(data.toString())
      @nextFile i, cb, mod
    
  

@SassSource = class SassSource extends StylesheetsSource
  @Bundle = SassBundle
  @types = ['sass']
  
  constructor: (options) ->
    super options
    @ext = '.sass'
    @headerRE = /^\/\/\s*require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/
    @css_path = @path
  
  find: (rel) ->
    return fullPath if (fullPath = super(rel)) != false
    
    rel = util.changeExtension rel, @ext
    fullPath = path.join @path, rel
    fullPath = path.join path.dirname(fullPath), "_#{path.basename fullPath}"
    if path.existsSync fullPath then fullPath else false
  
  test: (path) -> 
    path.basename(path)[0] != '_' and path.extname(path) == '.sass'
  

Source.extend SassSource