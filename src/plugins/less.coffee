util = require '../util'
fs = require 'fs'
path = require 'path'
{Source} = require '..'
{Bundle} = require '../bundle'
{finished, debug} = require '../command'
{StylesheetsPackage, StylesheetsSource, StylesheetsBundle} = require './css'

@LessBundle = class LessBundle extends StylesheetsBundle
  @buildext = '.css'
  constructor: (@package, @file) ->
    super @package, @file
  
  importPath: (src, file) ->
    if src instanceof LessSource
      path.join src.path, util.changeExtension file, src.constructor.ext
    else
      super src, file
  
  less: ->
    paths = ((src.less_path ? src.css_path) for src in @package.sources)
    new (require('less').Parser)
      filename: @file
      paths: paths
  
  convertFile: (data, cb) ->
    @less().parse data, (err, tree) =>
      throw err if err
      cb tree.toCSS()
  


@LessSource = class LessSource extends StylesheetsSource
  @types = ['less']
  @ext = LessBundle.ext = '.less'
  @buildext = LessBundle.buildext = '.css'
  @header = /^\/\/\s*(?:import|require)\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m
  
  @Bundle = LessBundle
  
  constructor: (options, @package) ->
    _.defaults options, compileAll: false
    {@output} = options
    super options
    @less_path = @path
    @css_path = @output
  
  find: (rel) ->
    return fullPath if (fullPath = super(rel)) != false
    
    rel = util.changeExtension rel, @constructor.ext
    fullPath = path.join @path, rel
    if path.existsSync fullPath then fullPath else false
    
  test: (relpath) -> 
    path.extname(relpath) == '.less'
  
  compileAll: (cb) ->  
    if @options.compileAll then super cb else cb()
  
  compileFile: (relpath, next) ->
    (new LessBundle(@package, relpath)).bundle -> next()
  

Source.extend LessSource