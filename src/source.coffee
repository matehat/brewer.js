path  = require 'path'
fs    = require 'fs'
_     = require 'underscore'
util  = require './util'
{EventEmitter} = require 'events'

class Source extends EventEmitter
  constructor: (options) ->
    _.defaults options, watch: false
    {@watch, @path} = options
  
  deps: (data) -> 
    parseHeader @headerRE, data
  
  find: (rel) ->
    rel = util.changeExtension rel, @ext
    fullpath = path.join @path, rel
    if path.existsSync fullpath then fullpath else false
  
  compileAll: (cb) ->
    return cb() unless @compileFile?
    
    list = []
    @listFiles (cfpath) =>
      list.push cfpath
      @compileFile cfpath, =>
        list = _.without list, cfpath
        if list.length == 0 and cb?
          cb()
  
  listFiles: (yield) ->
    walk = require 'walker'
    filelist = []
    walker = new walk @path, followLinks: true
    walker.on 'file', (root, stat) =>
      fpath = path.resolve root, stat.name
      return unless @test fpath
      yield fpath
  

@JavascriptSource = class JavascriptSource extends Source
  constructor: (options) ->
    _.defaults options, follow: true
    super options
    {@follow} = options
    @ext = '.js'
    @headerRE = /^\/\/require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/]+)/
    @js_path = @path
  

@CoffeescriptSource = class CoffeescriptSource extends Source
  constructor: (options) ->
    throw "Coffeescript source needs a 'output' options" unless options.output?
    _.defaults options, follow: true
    {@follow, @output} = options
    @ext = '.coffee'
    @js_path = @output
    @headerRE = /^#require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/
    super options
  
  test: (path) -> 
    util.hasExtension path, '.coffee'
  
  compileFile: (cfpath, next) ->
    coffee = require 'coffee-script'
    fs.readFile cfpath, 'utf-8', (err, cf) =>
      jspath = cfpath.replace path.resolve(@path), path.resolve(@output)
      jspath = util.changeExtension jspath, '.js'
      util.makedirs path.dirname jspath
      fs.writeFile jspath, coffee.compile(cf), 'utf-8', (err) =>
        throw err if err
        console.log "Compiled #{cfpath.replace(@path, '')} -> #{jspath.replace(@output, '')}"
        next()
  

@StylesheetsSource = class StylesheetsSource extends Source
  constructor: (options) ->
    super options
    @ext = '.css'
    @css_path = @path
    @headerRE = /^\/\*require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//
  
  test: (path) -> 
    util.hasExtension path, '.css'
  

@SassSource = class SassSource extends StylesheetsSource
  constructor: (options) ->
    super options
    @ext = '.sass'
    @headerRE = /^\/\/require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/
    @css_path = @path
  
  find: (rel) ->
    return fullpath if (fullpath = super(rel)) != false
    
    rel = util.changeExtension rel, @ext
    fullpath = path.join @path, rel
    fullpath = path.join path.dirname(fullpath), "_#{basename fullpath}"
    if path.existsSync fullpath then fullpath else false
  
  test: (path) -> path.basename(path)[0] != '_' and path.extname(path) == '.sass'

parseHeader = (regexp, data) ->
  recurse = (_data) ->
    return '' unless (match = _data.match regexp)?
    match[1] + recurse _data[match[0].length+match.index ...]
  
  if (json = recurse data).length > 0 then JSON.parse json else []

