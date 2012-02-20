
_ = require 'underscore'
cli = require './command'
{Source} = require './source'
{DSL} = require './index'

ALIASES =
  'javascript': ['js', 'javascript', 'javascripts', 'scripts']
  'stylesheet': ['css', 'stylesheet', 'stylesheets', 'styles']

COMPRESSORS = 
  stylesheet: (data, cb2) ->
    {cssmin} = require 'css-compressor'
    cb2 null, cssmin data
  
  javascript: (data, cb2) -> 
    {parser, uglify} = require 'uglify-js'
    {gen_code, ast_squeeze, ast_mangle} = uglify
    cb null, gen_code ast_squeeze parser.parse data
  

class Bundler extends Source
  @term: 'bundler'
  
  constructor: (@options, @project) ->
    {join} = require 'path'
    bundles = @bundles = {}
    for type, names of ALIASES
      bundles[type] = []
      for name in names when @options[name]?
        bundles[type] = _.union bundles[type], @options[name]
    {@name, build} = @options
    @shouldCompress = @options.compress
    if _.isString build
      @build = {javascript: join(build, 'js'), stylesheet: join(build, 'css')}
    else
      @build = {}
      for alias in ALIASES[type]
        if alias in build
          @build[type] = build[alias]
        if @bundles[type].length > 0 and !@build[type]?
          throw new Error("""
          Bundles of #{type}s are provided, but no build path was specified for this type.
          """)
  
  requiredModules: ->
    mods = []
    mods.push 'uglify-js'       if @bundles.javascript.length > 0
    mods.push 'css-compressor'  if @bundles.stylesheet.length > 0
    mods
  
  files: (yield, list) ->
    if @filelist?
      super
    else
      @filelist = []
      for type in ['javascript', 'stylesheet']
        for fpath in @bundles[type]
          file = @createFile type, util.changeext(fpath, '')
          yield file if yield?
          @filelist.push(file) if list?
    
      list @filelist if list?
  
  createFile: (type, fpath) ->  
    {join} = require 'path'
    fullpath = join @build[type], fpath
    ext = if type is 'javascript' then '.js' else '.css'
    file = @project.file fpath, "#{type}-bundle", fullpath + ext, this
    srcfile = @project.file fpath, type
    file.dependOnImports srcfile, _.bind(@bundle, this)
    file.impermanent = true
    file.parent = srcfile
    if @shouldCompress
      cext = ".min#{ext}"
      cfile = @project.file fpath, "#{type}-bundle-min", fullpath + cext, this
      cfile.dependOn file, _.bind(@compress, this)
      cfile.impermanent = true
  
  # This method is used to produce a bundle file by aggregating all the
  # necessary imported files. It uses `file.tsortedImports` to obtain a
  # sorted list of all necessary imports, then iterate through each, creating
  # a ReadStream and piping the content to the bundle's WriteStream. When
  # all content have been read, close the WriteStream and print a confirmation.
  bundle: (imported, bundle, cb) ->
    i = 0
    imports = bundle.parent.tsortedImports()
    ws = bundle.writeStream()
    ws.on 'close', ->
      finished 'Packaged', bundle.fullpath
      cb()
    
    iter = ->
      if i is imports.length
        ws.end()
        return
      
      rs = (file = imports[i++]).readStream()
      rs.pipe ws, {end: false}
      rs.on 'end', iter
    
    iter()
  
  # This method complies to the convention required by the `file.dependOn`
  # method, so it gets called whenever a dependent file in invalidated
  # and must be updated, relative to its source file. It takes an original
  # (the bundle) and destination file (the compressed counterpart) and 
  # updates the second.
  compress: (original, dest, cb) ->
    original.project dest, COMPRESSORS[original.type], (err) ->
      cb err if err
      finished 'Compressed', original.fullpath
      cb()
    
  

Bundler.register()