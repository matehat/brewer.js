_ = require 'underscore'
fs = require 'fs'
path = require 'path'
util = require './../util'
{Source} = require './../source'
{JavascriptBundle} = require './javascript'

@CoffeescriptSource = class CoffeescriptSource extends Source
  @types = ['coffee-script', 'coffeescript', 'cs']
  @Bundle: JavascriptBundle
  
  constructor: (options) ->
    throw "Coffeescript source needs a 'output' options" unless options.output?
    _.defaults options, follow: true
    {@follow, @output} = options
    @ext = '.coffee'
    @js_path = @output
    @headerRE = /^#\s*require\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/
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
      
    
  

Source.extend CoffeescriptSource