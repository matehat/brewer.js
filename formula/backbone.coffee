formula 'backbone', ->
  @homepage 'http://backbonejs.org'
  @doc      'http://backbonejs.org'
  
  @latest '0.9.1'
  @require 'underscore'
  @optional 'zepto', 'jquery', 'json2'
  
  @versions
    '0.5.3': '819395a6bca7ab67e5d61e2eb0252e5c'
    '0.9.1': 'adad938b293d186b9a91db505ee3cb02'
  
  @urls 
    latest: 'http://backbonejs.org/backbone.js'
    '> 0.1.0': (v) -> "https://github.com/documentcloud/backbone/tarball/#{v}"
  
  @install (path, next) ->
    if @version == 'latest'
      @include_file 'js', path, next()
    else
      @deflate path, 'tar.gz', (path) ->
        @include_file 'js', "#{path}/underscore.js", next()
  
