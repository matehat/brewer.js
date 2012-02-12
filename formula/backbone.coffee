formula 'backbone', ->
  @homepage 'http://backbonejs.org'
  @doc      'http://backbonejs.org'
  
  @latest '0.9.1'
  @require 'underscore'
  @optional 'zepto', 'jquery', 'json2'
  
  @urls 
    latest: 'http://backbonejs.org/backbone.js'
    'X.X.X': (v) -> "https://github.com/documentcloud/backbone/tarball/#{v}"
  
  @install (path, next) ->
    if @version == 'latest'
      @include_file 'js', path, next()
    else
      @deflate path, 'tar.gz', (path) ->
        @include_file 'js', "#{path}/underscore.js", next()
  
