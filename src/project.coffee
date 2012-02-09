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
    @vendor = new VendorLibraries @, vendorDir, reqs
    _.each packages, (pkg, i) =>
      @[i] = Package.create pkg.opts, pkg.srcs, @vendor
    
  

class VendorLibraries
  constructor: (@project, vendorDir, @requirements) ->
    @root = path.join @project.root, vendorDir
    util.makedirs @root
    @libraries = @read()
  
  stateFile: -> path.join @root, 'libraries.json'
  read: ->
    if path.existsSync(stateFile = @stateFile())
      JSON.parse fs.readFileSync stateFile, 'utf-8'
    else
      {}
  
  write: ->
    fs.writeFileSync @stateFile(), JSON.stringify(@libraries), 'utf-8'
  
  dirs: (type) ->
    dirs = []
    for modname, info of @libraries
      for dir in (info.dirs[type] ? [])
        dirs.push path.join @root, modname, dir
    
    dirs

exports.Project = Project