_ = require 'underscore'
{Package} = require '../lib'
{debug} = require './command'

@Project = class Project
  @fromBrewfile: (file) ->
    (require './brewfile').readBrewfile file
  
  constructor: (opts) ->
    _.defaults opts,
      root: '.'
      libs: []
      packages: []
      vendorDir: './vendor'
    
    {@root, @libs, packages, @vendorDir} = opts
    _.each packages, (pkg, i) =>
      @[i] = Package.create pkg.opts, pkg.srcs
  
