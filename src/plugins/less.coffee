util = require '../util'
fs = require 'fs'
path = require 'path'
{Source} = require '..'
{Bundle} = require '../bundle'
{StylesheetsBrewer, StylesheetsSource, StylesheetsBundle} = require './css'

@LessBundle = class LessBundle extends StylesheetsBundle
  constructor: (@brewer, @file) ->
    super @brewer, @file
    @ext = @brewer.source(@file).ext
    @buildext = '.css'
    @less = require 'less'
    @parser = new (@less.Parser) 
      filename: @file
      paths: (src.less_path ? src.css_path) for src in @brewer.sources
    
  
  bundle: (cb) ->
    Bundle::bundle.call @, (data) =>
      util.makedirs path.dirname fp = @buildPath()
      @parser.parse data, (err, tree) ->
        throw err if err
        fs.writeFile fp, tree.toCSS(), 'utf-8', -> cb fp
      
    
  
  sourcePath: (i) ->
    file = if i < @files.length then @files[i] else @file
    path.join (src = @brewer.source(file)).css_path, util.changeExtension file, src.ext
  
  readFile: (i, cb, mod=((a)->a)) ->
    file = if i < @files.length then @files[i] else @file
    rs = fs.readFile @sourcePath(i), {encoding: 'utf-8'}, (err, data) =>
      throw err if err
      @stream += mod(data.toString()) + '\n'
      @nextFile i, cb, mod
    
  

@LessSource = class LessSource extends StylesheetsSource
  @Bundle = LessBundle
  @types = ['less']
  
  constructor: (options) ->
    _.defaults options, compileAll: false
    super options
    @ext = '.less'
    @css_path = @path
    @headerRE = /^\/\/\s*(?:import|require)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  
  find: (rel) ->
    return fullPath if (fullPath = super(rel)) != false
    
    rel = util.changeExtension rel, @ext
    fullPath = path.join @path, rel
    fullPath = path.join path.dirname(fullPath), path.basename fullPath
    if path.existsSync fullPath then fullPath else false
    
  test: (path) -> 
    path.extname(path) == '.less'
  

Source.extend LessSource