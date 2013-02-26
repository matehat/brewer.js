# ### Mustache extension
#
# The Mustache extension works in a similar way the Coffeescript extension
# does. Only, we wouldn't speak about "compiling" mustache to javascript as
# much as "embedding". Really, all this extension does is wrap the template
# content in a javascript global object (configurable), alongside any other ones
# you would require.

_ = require 'underscore'
{Source} = require '..'
cli = require '../command'

# This piece if the "wrapping mustache in javascript" logic. It's a function
# that takes a name for the global object in which the template will be embedded
# and a json representation of {<template access path>: <template content>}, to
# automatically escape the string content. It attaches the template to the global
# object with the key given. That's all.
embedTemplate = (global, json) -> """
(function() { var _JST = this["#{global}"] = this["#{global}"] == null ? {
  __extend: function(obj) {
    for (var key in obj) if (Object.prototype.hasOwnProperty.call(obj, key)) this[key] = obj[key];
  }} : this["#{global}"]; _JST.__extend(#{json}); }).call(this);
"""

embedPrecompTemplate = (global, json) -> """
(function() {
  var _JST = this["#{global}"] = this["#{global}"] == null ? {
    extend: function(obj) {
      var key, p, _partials, _templates;
      for (key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) continue; 
        p = ((_partials = this.partials) != null ? _partials : this.partials = {})[key] = obj[key];
        ((_templates = this.templates) != null ? 
          _templates : this.templates = {})[key] = Mustache.compile(p);
      }
    }
  } : this["#{global}"]; _JST.extend(#{json}); }).call(this);
"""

class MustacheSource extends Source
  @type = 'mustache'
  @ext = ['.mustache', '.mu']
  # The header key is not needed since we don't allow importing in mustache just yet
  @header = null
  
  # We only need to check for a `global` option set on the source directive, and 
  # capture it. It will be used as the javascript global object.
  constructor: (options) ->
    super
    _.defaults options, 
      global: 'JST'
      precompiled: false
    {@global, @precompiled} = options
  
  
  # This function is the glue between the embedding function above and the
  # way tranforming a representation into another works in Brewer.js.
  compile: (original, compiled, cb) ->
    compile = (data, cb2) =>
      # We make the object
      (json = {})[original.relpath] = data
      embedder = if @precompiled then embedPrecompTemplate else embedTemplate
      # and pass it to the embedding function
      cb2 null, embedder @global, JSON.stringify json
    
    original.project compiled, compile, (err) ->
      cb err if err
      cli.finished 'Embedded', original.fullpath
      cb()
    
  
  
  # The rest is the same as, say, the coffeescript extension.
  createFile: (path) ->
    original = super
    @createCompiledFile original
    original
  
  createCompiledFile: (original) ->
    cpath = (require '../util').changeext (opath = original.relpath), '.js'
    compiled = @package.file opath, 'javascript', 
      (require 'path').join(@output, cpath), @
    compiled.dependOn original, _.bind(@compile, @)
    
    # except this, where we indicate that we need mustache to render the 
    # template.
    compiled.setImportedPaths ['mustache']
    compiled.impermanent = true
    compiled.register()
    compiled
  

Source.extend exports.MustacheSource = MustacheSource