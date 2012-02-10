fs = require 'fs'
{join, basename} = require 'path'
crypto = require 'crypto'
vm = require 'vm'
{spawn} = require 'child_process'
{EventEmitter} = require 'events'
temp = require 'temp'
semver = require 'semver'
request = require 'request'
_ = require 'underscore'
coffeescript = require 'coffee-script'

{chdir} = process
{info, debug} = require './command'
move = fs.renameSync

class Installer extends EventEmitter
  constructor: (@formula, @root, @version="latest") ->
  
  # ### Methods that are accessible in the installer body
  
  include: (src, opts, cb) ->
    [cb, opts] = [opts, {}] if _.isFunction opts
    info "Moving #{src} into vendor folder"
    (spawn 'cp', ['-fpLR', src, (root = @root)]).on 'end', ->
      if (dest = opts.rename)?
        move (join(root, d) for d in [basename(src), dest])...
      cb.call @
    
  
  deflate: (file, ext, cb) ->
    flags = _.reject ext.split('.'), (f) -> f is ''
    
    if flags[0] is 'tar'
      flag = {'bz2': 'j', 'gz': 'z'}[flags[1]] ? ''
      child = spawn 'tar', ['-xvf'+flag, file]
    else if flags[0] is 'zip'
      child = spawn 'unzip', [file]
    else return cb
    
    info "Deflating #{file}"
    child.on 'end', =>
      fs.unlink file, =>
        fs.readdir '.', (err, files) =>
          if files.length == 1 and fs.statSync(files[0]).isDirectory()
            chdir files[0]
          cb.call @
      
    
  
  
  # ### Private methods
  
  _formattedVersion = ->
    return vsn if vsn == 'latest'
    unless (version = semver.clean vsn)?
      [v, tag] = version.split '-'
      [major, minor, patch] = v.split '.'
      {tag, major, minor, patch, version, toString: -> version}
    else
      throw new Error "The supplied version is not correctly formatted: '#{vsn}'"
  
  _getUrl: ->
    if _.isFunction (urls = @formula.urlGetter)
      if vsn is 'latest'
      else
        vsn = semver.maxSatisfying(versions, vsn) if (versions = @formula.availableVersions)?
      urls(if vsn isnt 'latest' then @_formattedVersion vsn else vsn)
    else 
      vsn = 'X.X.X' if vsn is 'latest' and 'latest' not of urls
      vsn = semver.maxSatisfying(versions, vsn) if (versions = @formula.availableVersions)?
      vsn = semver.maxSatisfying((_.without _.keys(urls), 'latest'), vsn) if vsn isnt 'latest'
      if _.isFunction (match = urls[vsn]) then match(@_formattedVersion vsn) else match
  
  _fetch: ->
    formula = @formula
    temp.mkdir (err, @temp) =>
      throw new Error err if err
      chdir tempdir
      req = request(url = @_getUrl vsn)
      info "Downloading #{url}"
      req.pipe fs.createWriteStream (download = join tempdir, vsn)
      req.on 'end', => @formula.installer.call @, download
    
  

class Formula
  constructor: (@name) ->
  
  homepage: (url) -> @homepageURL = url
  doc: (url) -> @docURL = url
  install: (cb) -> @installer = cb
  latest: (vsn) -> @latestVersion = vsn
  
  versions: (versions...) ->
    @availableVersions ?= []
    @availableVersions.push versions...
  
  urls: (map) ->
    if _.isFunction map
      @urlGetter = map
    else if _.isObject map
      for version, value of map
        debug map
        unless version == 'latest' or semver.valid version
          throw new Error("Invalid version specifier")
        @urlGetter = {} if !@urlGetter? or _.isFunction @urlGetter
        @urlGetter[version] = value
  
  require: (formulae...) ->
    @requirements.push(formula) for formula in formulae when not _.include(@requirements, formula)
  


@formulae = (file) ->
  ctx = _.clone global
  ctx.formulae = []
  
  ctx.formula = (name, body) ->
    ctx.formulae.push (formula = new Formula(name))
    body.call formula
  
  coffeescript.eval fs.readFileSync(file, 'utf-8'), 
    sandbox: vm.createContext(ctx)
    filename: file
  