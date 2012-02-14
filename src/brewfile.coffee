_ = require 'underscore'
vm = require 'vm'
coffeescript = require 'coffee-script'
fs = require 'fs'
{debug} = require './command'
{Package, Source} = require '../lib'

# Alias the two registries so that the names don't collide 
# with others
SourceRegistry = Source.registry
PackageRegistry = Package.registry

# The prototype of a Source configuration object.
# The functions defined here are available in the
# function body provided at the end of a `@source` statement

Source =
  # The method used to specify options on a source 
  # configuration object
  options: (opts) ->
    _.extend @opts, opts
  

# The prototype of a Package configuration object
# The functions defined here are available in the
# function body provided at the end of a package statement
# such as `@javascript` or `@stylesheets`

Package =
  # Method used to specify options on a package 
  # configuration object.
  options: (opts) -> 
    _.extend @opts, opts
  
  # Method used to define bundles within a package
  bundles: (bundles...) ->
    @opts.bundles ?= []
    @opts.bundles = _.union @opts.bundles, bundles
  
  # Method used to define a source in a package.
  # The type of the source here is inferred by the
  # default source type of the parent package
  source: (path, opts, cb) ->
    @_source.call this, @opts.type, path, opts, cb
  
  # A common method used to define any type of 
  # source in a package.
  _source: (type, path, opts, cb) ->
    # A source configuration object is initialized
    # with the Source prototype above, then
    # we add it to parent package.
    src = Object.create Source
    
    # The options object is initialized then
    # put in the source object.
    if _.isFunction opts
      cb = opts
      opts = {}
    
    opts ?= {}
    opts.type ?= type
    opts.path = path
    src.opts = opts
    @srcs.push src.opts
    
    # Finally we call the trailing function, if present
    # with `this` set to the source object
    cb.call src if _.isFunction cb
  

# Iterate through all defined source types to add their
# type names to the Package object prototype, to add them as
# proxies to the Package._source method
_.each _.keys(SourceRegistry), (key) ->
  Package[key] = (path, options, cb) ->
    Package._source.call this, SourceRegistry[key].type, path, options, cb
  

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
newContext = ->
  # Initialize a container object
  ctx = 
    project: prj =
      root: '.'
      packages: []
      reqs: {}
      vendorDir: './vendor'
  
  # Iterate through all package types, using their
  # type name to proxy the `package` definition function
  # above.
  _.each _.keys(PackageRegistry), (key) ->
    ctx[key] = (name, opts, cb) ->
      package.call ctx.project, PackageRegistry[key].type, name, opts, cb
    
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

# An exported function that takes a path to a Brewfile as argument
# and returns a configuration object containing all the packages
@configs = configs = (file) ->
  # Use Coffee-script's `eval` function to execute the file content
  coffeescript.eval fs.readFileSync(file, 'utf-8'), 
    # using the above function to get a context appropriate for the DSL
    sandbox: ctx = newContext()
    # and setting the filename to ease debugging
    filename: file
  
  # Once the file was executed, `ctx.project` holds the set of
  # configurations for a project object, which is returned.
  return ctx.project

# An exported function that takes a path to a Brewfile as argument
# and returns a Project object, containing all packages and specific 
# configurations.
@readBrewfile = (file) ->
  new (require '../lib').Project configs(file)
