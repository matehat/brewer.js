_ = require 'underscore'
path = require 'path'
fs = require 'fs'
{Package} = require '../lib'
{debug, warning} = require './command'
util = require './util'

class Project
  @fromBrewfile: (file) ->
    (require './brewfile').readBrewfile file
  
  constructor: (opts) ->
    _.defaults opts,
      root: '.'
      reqs: []
      packages: []
      vendorDir: './vendor'
    
    {@root, reqs, packages, vendorDir} = opts
    @vendorlibs = new VendorLibraries @, vendorDir, reqs
    @length = packages.length
    _.each packages, (pkg, i) =>
      @[i] = Package.create pkg.opts, pkg.srcs, @vendorlibs
    
  clean: ->
    pkg.clean?() for pkg in @
  
  prepare: ->
    pkg.prepare?() for pkg in @
  

class VendorLibraries
  constructor: (@project, vendorDir, @requirements) ->
    @root = path.join @project.root, vendorDir
    util.makedirs @root
    @libs = @read()
  
  stateFile: -> 
    path.join @root, 'libraries.json'
  
  read: ->
    if path.existsSync(stateFile = @stateFile())
      JSON.parse fs.readFileSync stateFile, 'utf-8'
    else
      {}
  
  write: ->
    fs.writeFileSync @stateFile(), JSON.stringify(@libs), 'utf-8'
  
  libraries: (type) ->
    libs = []
    for name, lib of @libs
      for dpath, dir of lib.content when dir.type is type
        _lib = {path: path.join(@root, name, dpath)}
        _.extend _lib, dir
        libs.push _lib
    
    libs

exports.Project = Project