temp =    require 'temp'
fs =      require 'fs'
request = require 'request'
crypto =  require 'crypto'
semver =  require 'semver'
_ =       require 'underscore'
vm =      require 'vm'
{spawn} = require 'child_process'

{EventEmitter} = require 'events'

extractors =
  'tar': (file, flag, cb) ->
    if _.isFunction flag
      cb = flag
      flag = ''
    tar = spawn 'tar', ['-xvf'+flag, file]
    tar.on 'end', ->
      fs.unlink file, ->
        fs.readdir '.', (err, files) ->
          if files.length == 1 and fs.statSync(files[0]).isDirectory()
            process.chdir files[0]
          cb process.cwd()
  
  'tar.bz2': (file, cb) -> extractors['tar'] file, 'j', cb
  'tar.gz': (file, cb) -> extractors['tar'] file, 'z', cb
  'zip': (file, cb) ->
    uzip = spawn 'unzip', [file]
    uzip.on 'end', ->
      fs.unlink file, ->
        fs.readdir '.', (err, files) ->
          if files.length == 1 and fs.statSync(files[0]).isDirectory()
            process.chdir files[0]
          cb process.cwd()
    
  

class Installer extends EventEmitter
  constructor: (@formula, root, version="latest") ->
    for key, hooks of @formula.hooks
      @on key, hook for hook in hooks
    
    @on 'done', => @emit 'clean'
  
  include: (src, opts, cb) ->
    if _.isFunction opts
      cb = opts
      opts = {}
    
    cp = spawn 'cp', ['-fpLR', src, (root = @root)]
    cp.on 'end', ->
      if opts.rename?
        src = path.join(root, path.basename src)
        target = path.join(root, opts.rename)
        fs.rename src, target, -> cb()
      else
        cb()
  
  deflate: (cb) ->
    
  
  _formattedVersion = (vsn) ->
    return vsn if vsn == 'latest'
    unless (version = semver.clean vsn)?
      [v, tag] = version.split '-'
      [major, minor, patch] = v.split '.'
      {
        tag, major, minor, patch, version
        toString: -> version
      }
    else
      throw new Error "The supplied version is not correctly formatted: '#{vsn}'"
  
  _getUrl: (vsn) ->
    if _.isFunction (urls = @formula.urlGetter)
      vsn = semver.maxSatisfying(versions, vsn) if (versions = @formula.availableVersions)?
      urls(if vsn == 'latest' then @_formattedVersion vsn else vsn)
    else 
      vsn = 'X.X.X' if vsn is 'latest' and 'latest' not of urls
      vsn = semver.maxSatisfying((_.without _.keys(urls), 'latest'), vsn) if vsn isnt 'latest'
      if _.isFunction (match = urls[vsn]) then match(@_formattedVersion vsn) else match
  
  _fetch: (vsn, cb) ->
    formula = @formula
    temp.mkdir (err, tempdir) =>
      throw new Error err if err
      process.chdir tempdir
      archive = path.join tempdir, "#{vsn}.#{formula.extension}"
      tStream = fs.createWriteStream archive
      req = request(@_getUrl vsn).pipe tStream
      req.on 'end', =>
        if (ext = formula.extension)?
          extractors[formula.extension] archive, (dir) =>
            @formula.installHook dir
        else
          @formula.installHook archive
    
  

class Formula
  constructor: (@name) ->
  
  homepage: (url) -> @homepageURL = url
  doc: (url) -> @docURL = url
  install: (cb) -> @installer = cb
  
  versions: (versions...) ->
    @availableVersions ?= []
    @availableVersions.push versions...
  
  urls: (map) ->
    if _.isFunction map
      @urlGetter = map
    else if _.isObject map
      for version, value of urls
        unless version == 'latest' or semver.valid version
          throw new Error("Invalid version specifier")
        @urlGetter = {} if !@urlGetter? or _.isFunction @urlGetter
        @urlGetter[version] = value
  
  compression: (cmp) ->
    if cmp not of extractors
      throw new Error "Compression not understood: #{cmp}"
    @extension = cmp
  
  require: (formulae...) ->
    @requirements.push(formula) for formula in formulae when not _.include(@requirements, formula)
  
  latest: (vsn) ->
    @latestVersion = vsn
  


@formulae = (file) ->
  ctx = {formulae: []}
  vm.createContext ctx
  coffeescript.eval fs.readFileSync(file, 'utf-8'), 
    sandbox: ctx = newContext()
    filename: file
  
  _.map ctx.formulae, (pkg) ->
