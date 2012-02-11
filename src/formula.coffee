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

validVersionSpec = (vsn) ->
  return (
    semver.valid(vsn) or 
    semver.validRange(vsn) or 
    vsn is 'latest'
  )


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
    # Proxy the list of available versions and the
    # defined urlGetter
    versions = @formula.availableVersions
    urlGetter = @formula.urlGetter
    
    if _.isFunction urlGetter
      # If urlGetter is a function, we match 'latest'
      # to the latest available version and pass it over
      vsn = 'X.X.X' if vsn is 'latest'
      urls @_formattedVersion semver.maxSatisfying versions, vsn
    else
      # urlGetter can also be a hash, mapping semantic versions
      # or version ranges to either a string or a function
      version = if vsn is 'latest' then 'X.X.X' else vsn
      version = semver.maxSatisfying versions, version
      if vsn is 'latest' and 'latest' of urlGetter
        match = urlGetter.latest
      else
        match = _.find urlGetter, (url, ver) ->
          return false if ver is 'latest'
          semver.satisfies version, ver
        return false unless match?
      
      if _.isFunction match
        match = match @_formattedVersion version
      match
  
  _fetch: (cb) ->
    formula = @formula
    vsn = @version
    temp.mkdir (err, @temp) =>
      throw new Error err if err
      chdir tempdir
      url = @_getUrl vsn
      download = join tempdir, vsn
      info "Downloading #{url} to #{download}"
      req = request url
      req.pipe fs.createWriteStream download
      req.on 'end', cb
    
  
  _install: (cb) ->
    @_fetch =>
      @formula.installer.call @, download, cb
    
  

class Formula
  constructor: (@name) ->
  
  homepage: (url) -> @homepageURL = url
  doc: (url) -> @docURL = url
  install: (cb) -> @installer = cb
  latest: (vsn) -> @latestVersion = vsn
  
  valid: ->
    @availableVersions? and @urlGetter? and @installer?
  
  versions: (versions...) ->
    @availableVersions ?= []
    @availableVersions.push versions...
  
  urls: (map) ->
    if _.isFunction map
      @urlGetter = map
    else if _.isObject map
      for version, value of map
        debug map
        unless validVersionSpec(version)
          throw new Error("Invalid version specifier")
        if !@urlGetter? or _.isFunction @urlGetter
          @urlGetter = {}
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
  
  ctx.formulae
