_ = require 'underscore'
vm = require 'vm'
coffeescript = require 'coffee-script'
fs = require 'fs'
{Package, Source} = require '../lib'

SourceRegistry = Source.registry
PackageRegistry = Package.registry

Source =
  options: (opts) ->
    _.extend @opts, opts
  

Package =
  options: (opts) -> 
    _.extend @opts, opts
  
  source: (path, opts, cb) ->
    src = PackageRegistry[@opts.type].default
    @_source.call this, src, path, opts, cb
  
  _source: (type, path, opts, cb) ->
    src = Object.create Source
    @srcs.push src
    if _.isFunction opts
      cb = opts
      opts = {}
    
    opts ?= {}
    opts.type ?= type
    opts.path = path
    src.opts = opts
    cb.call src if _.isFunction cb
  

_.each _.keys(SourceRegistry), (key) ->
  Package[key] = (path, options, cb) ->
    Package._source.call this, key, path, options, cb
  

package = (type, name, opts, cb) ->
  pkg = Object.create Package
  @packages.push pkg
  if _.isFunction opts
    cb = opts
    opts = {}
  
  opts.type ?= type
  opts.name = name
  pkg.opts = _.clone opts
  pkg.srcs = []
  cb.call pkg if _.isFunction cb


newContext = ->
  ctx = {}
  ctx.configs = {packages: []}
  _.each _.keys(PackageRegistry), (key) ->
    ctx[key] = (name, opts, cb) ->
      package.call ctx.configs, key, name, opts, cb
  
  vm.createContext ctx

@configs = configs = (file) ->
  coffeescript.eval fs.readFileSync(file, 'utf-8'), 
    sandbox: ctx = newContext()
    filename: file
  
  return ctx.configs.packages

@packages = (file) ->
  _Package = (require '../lib').Package
  _.map configs(file), (pkg) ->
    _Package.create pkg.opts, pkg.srcs
  
