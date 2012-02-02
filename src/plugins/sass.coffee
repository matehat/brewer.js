util = require './../util'
fs = require 'fs'
path = require 'path'
{Source} = require './..'
{StylesheetsBrewer, StylesheetsSource, StylesheetsBundle} = require './css'

@SassBundle = class SassBundle extends StylesheetsBundle
  constructor: (@brewer, @file) ->
    super @brewer @file
    @ext = '.sass'
    @sass = require 'sass'
  
  filepath: ->
    @_filepath = util.changeExtension @basepath, '.css' unless @_filepath?
    @_filepath
  
  bundle: (cb) ->
    super (data) =>
      util.makedirs path.dirname, fp = @filepath()
      fs.writeFile fp, @sass.render(data), 'utf-8', => cb fp
    
  

@SassSource = class SassSource extends StylesheetsSource
  @Bundle = SassBundle
  @types = ['sass']
  
  constructor: (options) ->
    super options
    @ext = '.sass'
    @headerRE = /^\/\/\s*require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/
    @css_path = @path
  
  find: (rel) ->
    return fullpath if (fullpath = super(rel)) != false
    
    rel = util.changeExtension rel, @ext
    fullpath = path.join @path, rel
    fullpath = path.join path.dirname(fullpath), "_#{basename fullpath}"
    if path.existsSync fullpath then fullpath else false
  
  test: (path) -> 
    path.basename(path)[0] != '_' and path.extname(path) == '.sass'
  

Source.extend SassSource