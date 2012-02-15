# This module is used internally to parse a Brewfile at the
# root folder of a given project. It exports a single function :
#
# * `configs(file)`
#
#   This function takes the path to a Brewfile and returns a
#   configuration object that can be used to initialize a 
#   `Project` object.

# Some essential core modules are loaded, as well as coffee-script
# since a brewfile is written using this language.
_ = require 'underscore'
vm = require 'vm'
fs = require 'fs'
coffeescript = require 'coffee-script'

# Brewer classes (and utilities) are imported
{debug} = require './command'
brewer = require './index'

# ### Source directives
#
# This is the prototype of a Source configuration object.
# The functions defined here are available in the
# function body provided at the end of a `@source` statement

Source =
  # The method used to specify options on a source 
  # configuration object
  options: (opts) ->
    _.extend @opts, opts
  

# ### Package directives
#
# This is the prototype of a Package configuration object.
# The functions defined here are available in the
# function body provided at the end of a package statement
# such as `@javascript` or `@stylesheets`, and operate on
# a package configuration object, used later as the first
# argument when initializing a *[Package](package.html)* object.
Package =
  # A method used to specify options on a package 
  # configuration object.
  options: (opts) -> 
    _.extend @opts, opts
  
  # A method used to define bundles within a package
  bundles: (bundles...) ->
    @opts.bundles ?= []
    @opts.bundles = _.union @opts.bundles, bundles
  
  # A method used to define a source in a package.
  # The type of the source here is inferred by the
  # default source type of the parent package
  source: (path, opts, cb) ->
    @_source.call this, @opts.type, path, opts, cb
  
  # A common method used to define any type of 
  # source in a package.
  # A source configuration object is initialized
  # with the Source prototype above.
  # The options object is initialized then
  # put in the source object. We add the source 
  # config object to parent package, then call the trailing 
  # function, if present with `this` set to the source object
  _source: (type, path, opts, cb) ->
    src = Object.create Source
    
    if _.isFunction opts
      cb = opts
      opts = {}
    
    opts ?= {}
    opts.type ?= type
    opts.path = path
    src.opts = opts
    @srcs.push src.opts
    
    cb.call src if _.isFunction cb
  

# Iterate through all defined source types to add their
# type names to the Package object prototype, to add them as
# proxies to the Package._source method
_.each brewer.Source.types(), (key) ->
  Package[key] = (path, options, cb) ->
    Package._source.call this, brewer.Source[key].type, path, options, cb
  

# The function used to define a package object in a Brewfile.
package = (type, name, opts, cb) ->
  # A package config object is initialized with the
  # Package prototype above, then added to the list of 
  # packages for the Brewfile.
  pkg = Object.create Package
  @packages.push pkg
  
  # The package options are set using the provided values
  if _.isFunction opts
    cb = opts
    opts = {}
  
  opts.type ?= type
  opts.name = name
  pkg.opts = _.clone opts
  pkg.srcs = []
  
  # Then the trailing function is called with `this` set
  # as the new package object
  cb.call pkg if _.isFunction cb

# A utility function used to initialize a V8 Context
# to encapsulate the configuration included in the
# Brewfile and all the DSL functions.

newContext = () ->
  ctx = {
    project: prj = {
      root: '.'
      packages: []
      reqs: {}
      vendorDir: './vendor'
    }
  }
  
  # Iterate through all package types, using their
  # type name to proxy the `package` definition function
  # above.
  _.each brewer.Package.types(), (key) ->
    ctx[key] = (name, opts, cb) ->
      package.call ctx.project, brewer.Package[key].type, name, opts, cb
    
  # Define DSL functions to specify properties of the project
  ctx.root = (newRoot) -> prj.root = newRoot
  ctx.vendor = (newVendorDir) -> prj.vendorDir = newVendorDir
  
  # Define the DSL `require` function that adds libraries to be the
  # included in the project. This function can be called any number
  # of times in a Brewfile. All dependencies are stored in an object
  # in the form of `<library name>: <semantic version>`.
  ctx.require = (reqs) ->
    if _.isArray reqs
      for req in reqs when req not of prj.reqs
        prj.reqs[lib] = 'latest'
    else if _.isString reqs
      if reqs not in prj.reqs
        prj.reqs[reqs] = 'latest'
    else if _.isObject reqs
      for key, value of reqs
        prj.reqs[key] = value
  
  # Return a V8 context, using the container above as
  # a seed.
  vm.createContext ctx

# This is the exported function, which takes a path to a Brewfile 
# as argument and returns a configuration object containing all the 
# packages. It uses Coffee-script's `eval` function to execute the file 
# content, using the `newContext` function above to get a context 
# appropriate for the DSL, and setting the filename to ease debugging.
# Once the file was executed, `ctx.project` 
# holds the set of configurations for a project object, which is returned.

@configs = configs = (file) ->
  coffeescript.eval fs.readFileSync(file, 'utf-8'), 
    sandbox: ctx = newContext()
    filename: file
  
  return ctx.project
