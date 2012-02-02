util = require '../util'
fs = require 'fs'
path = require 'path'
{Source} = require '..'
{Bundle} = require '../bundle'
{finished} = require '../command'
{StylesheetsBrewer, StylesheetsSource, StylesheetsBundle} = require './css'

@LessBundle = class LessBundle extends StylesheetsBundle
  constructor: (@brewer, @file) ->
    super @brewer, @file
    @buildext = '.css'
    @less = require 'less'
    @parser = new (@less.Parser) 
      filename: @file
      paths: (src.less_path ? src.css_path) for src in @brewer.sources
    
  
  bundle: (cb) ->
    Bundle::bundle.call @, (data) =>
      @parser.parse data, (err, tree) =>
        throw err if err
        fs.writeFile (fp = @buildPath()), tree.toCSS(), 'utf-8', ->
          finished 'Compiled', fp
          cb fp
      
    
  
  sourcePath: (i) ->
    file = if i < @files.length then @files[i] else @file
    path.join (src = @brewer.source(file)).css_path, util.changeExtension file, src.constructor.ext
  
  readFile: (i, cb, mod=((a)->a)) ->
    file = if i < @files.length then @files[i] else @file
    rs = fs.readFile @sourcePath(i), {encoding: 'utf-8'}, (err, data) =>
      throw err if err
      @stream += mod(data.toString()) + '\n'
      @nextFile i, cb, mod
    
  

@LessSource = class LessSource extends StylesheetsSource
  @types = ['less']
  @ext = LessBundle.ext = '.less'
  @buildext = LessBundle.buildext = '.css'
  @header = /^\/\/\s*(?:import|require)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  
  @Bundle = LessBundle
  
  constructor: (options, @brewer) ->
    _.defaults options, compileAll: false
    super options
    @css_path = @path
    
  
  find: (rel) ->
    return fullPath if (fullPath = super(rel)) != false
    
    rel = util.changeExtension rel, @constructor.ext
    fullPath = path.join @path, rel
    if path.existsSync fullPath then fullPath else false
    
  test: (relpath) -> 
    path.extname(relpath) == '.less'
  
  compileAll: (cb) ->
    return cb() unless @options.compileAll
    super cb
  
  compileFile: (relpath, next) ->
    (new LessBundle(@brewer, relpath)).bundle ->
      next()
  

Source.extend LessSource