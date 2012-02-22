fs = require 'fs'
{join, basename, resolve, exists, existsSync} = require 'path'
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
util = require './util'
move = fs.renameSync

validVersionSpec = (vsn) ->
  return (
    semver.valid(vsn) or 
    semver.validRange(vsn) or 
    vsn is 'latest'
  )


class InvalidChecksum extends Error
  constructor: (@formula, @version, @url) ->
    @message = "Invalid checksum for #{formula.name} (#{version}), downloaded from #{url}"
    @name = 'InvalidChecksum'
  

class NonSemanticVersion extends TypeError
  constructor: (@version) ->
    @message = "Provided version (#{@version}) is not a valid semantic version (see http://semver.org)"
    @name = "NonSemanticVersion"
  

class Installer
  constructor: (@formula, @project, @version="latest") ->
  
  context: ->
    include: (src, opts, cb) =>
      [cb, opts] = [opts, {}] if _.isFunction opts
      info "Moving #{src} into vendor folder"
      root = @project.vendorlibs.root
      (spawn 'cp', ['-fpLR', src, root]).on 'end', ->
        if (dest = opts.rename)?
          move (join(root, d) for d in [basename(src), dest])...
        cb.call @
      
    
    deflate: (file, ext, cb) =>
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
      
    
  
  install: (cb) ->
    @formula.fetch @version, (err, download) =>
      if err? then cb(err)
      else @formula.installer.call @context(), download, cb
  

class Formula
  @formattedVersion: (vsn) ->
    return vsn if vsn == 'latest'
    if (version = semver.clean vsn)?
      [v, tag] = version.split '-'
      [major, minor, patch] = v.split '.'
      {tag, major, minor, patch, version, toString: -> version}
    else
      throw new Error "The supplied version is not correctly formatted: '#{vsn}'"
  
  
  constructor: (@name) ->
    @requirements = []
    @optionals = []
    @versions = {}
  
  
  valid: -> @urls? and @installer?
  url: (vsn) ->
    # Proxy the list of available versions and the
    # defined urls getter
    versions = _.keys @versions
    urls = @urls
    vsn = @latest if @latest and vsn is 'latest'
    
    if _.isFunction urls
      # If urlGetter is a function, we match 'latest'
      # to the latest available version and pass it over
      
      vsn = 'X.X.X' if vsn is 'latest'
      vsn = if vsn? and versions.length > 0 
        Formula.formattedVersion semver.maxSatisfying versions, vsn
      
      urls vsn
    else
      # urlGetter can also be a hash, mapping semantic versions
      # or version ranges to either a string or a function
      version = if vsn is 'latest' then 'X.X.X' else vsn
      version = semver.maxSatisfying versions, version
      if vsn is 'latest' and 'latest' of urls
        match = urls.latest
      else
        match = _.find urls, (url, ver) ->
          return false if ver is 'latest'
          semver.satisfies version, ver
        return false unless match?
      
      if _.isFunction match
        match = match Formula.formattedVersion version
      match
  
  checksum: (vsn) ->
    if @versions? and (chksum = @versions[vsn])? then chksum else @md5
  
  fetch: (vsn, cb) ->
    tempdir = temp.mkdirSync()
    chdir tempdir
    url = @url vsn
    dlfile = join tempdir, vsn
    info "Downloading #{url} to #{dlfile}"
    req = request url
    ws = fs.createWriteStream dlfile
    req.on 'error', (err) -> cb(err)
    ws.on 'error', (err) -> cb(err)
    req.pipe ws
    
    if (checksum = @checksum(vsn))?
      md5 = crypto.createHash 'md5'
      req.on 'data', (data) -> md5.update data
    
    req.on 'end', =>
      if checksum? and checksum isnt md5.digest 'hex'
        cb new InvalidChecksum @, vsn, url
      else cb(null, dlfile)
    
    req
  
  calcsum: (vsn, cb) ->
    md5 = crypto.createHash 'md5'
    dl = @fetch vsn, (err) -> 
      return cb(err) if err?
      cb null, md5.digest 'hex'
    
    dl.on 'data', (data) -> md5.update data
    null
  
  
  context: ->
    homepage: (@homepage) =>
    doc: (@doc) =>
    install: (@installer) =>
    latest: (@latest) =>
    md5: (@md5) =>
    
    versions: (versions...) =>
      if versions.length is 1
        @versions ?= {}
        if _.isObject versions
          _.extend @versions, versions[0]
        if _.isString versions
          @versions[versions] = null
      else if versions.length > 1
        for vsn in versions
          @versions[vsn] = null
    
    urls: (map) =>
      if _.isFunction map
        @urls = map
      else if _.isObject map
        for version, value of map
          unless validVersionSpec version
            throw new NonSemanticVersion version
          if !@urls? or _.isFunction @urls
            @urls = {}
          @urls[version] = value
    
    require: (formulae...) =>
      @requirements.push(formula) for formula in formulae when not _.include(@requirements, formula)
    
    optional: (formulae...) =>
      @optionals.push(formula) for formula in formulae when not _.include(@optionals, formula)
    
  

class Catalog
  constructor: (@dirpath=resolve(__dirname, '..', 'formula')) ->
    @path = join @dirpath, 'catalog.json'
    Object.defineProperty @, 'formulae',
      get: ->
        if @_formulae?
          return            @_formulae
        else
          if @exists() then @_formulae = @readFile()
          else              @formulae = @reload()
      
      set: (@_formulae) -> @writeFile @_formulae
  
  readFile: ->
    try
      JSON.parse fs.readFileSync @path, 'utf-8'
    catch err
      if err instanceof SyntaxError
        @formulae = @reload()
      else
        throw err
  
  writeFile: (formulae) ->
    fs.writeFileSync @path, JSON.stringify(formulae, null, 4), 'utf-8'
  
  exists: -> existsSync @path
  
  get: (name) ->
    if (formula = @formulae[name])?
      @formulaFromFile name, formula.file
    else
      throw new Error("Formula (#{formula}) not available")
  
  formulaFiles: ->
    filelist = []
    walk = (dpath) ->
      files = _.map fs.readdirSync(dpath), (p) ->
        fpath = join dpath, p
        stats = fs.statSync fpath
        if stats.isFile() and util.hasext fpath, '.coffee'
          [fpath]
        else if stats.isDirectory()
          walk fpath
      
      _.flatten _.filter files, (file) -> file?
      
    files = walk @dirpath
    files
  
  
  entriesFromFile: (file) ->
    entries = {}
    file = file.replace(@dirpath, '')[1...]
    _.each @formulaeFromFile(join @dirpath, file), (formula, name) =>
      entry = entries[name] = {file}
      entry[p] = formula[p] for p in [
        'name', 'homepage', 'doc'
        'latest', 'md5', 'versions', 
        'requirements', 'optionals']
      null
    entries
  
  formulaeFromFile: (file) ->
    ctx = _.clone global
    ctx.formulae = {}
    
    ctx.formula = (name, body) ->
      ctx.formulae[name] = formula = new Formula name
      body.call formula.context()
    
    coffeescript.eval fs.readFileSync(file, 'utf-8'), 
      sandbox: vm.createContext(ctx)
      filename: file
    
    ctx.formulae
  
  formulaFromFile: (name, file) ->
    ctx = _.clone global
    formula = null
    
    ctx.formula = (_name, body) ->
      if name is _name
        formula = new Formula(name)
        body.call formula.context()
    
    coffeescript.eval fs.readFileSync(join(@dirpath, file), 'utf-8'), 
      sandbox: vm.createContext(ctx)
      filename: file
    
    formula
  
  reload: (cb) ->
    formulae = {}
    for file in @formulaFiles()
      _formulae = @entriesFromFile file
      _.extend formulae, _formulae
    
    formulae
  


_.extend exports,
  Installer: Installer
  Formula: Formula
  InvalidChecksum: InvalidChecksum
  catalog: new Catalog()
