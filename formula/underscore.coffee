formula 'underscore', ->
  @homepage 'http://underscorejs.org'
  @doc      'http://underscorejs.org'
  @latest '1.3.1'
  @versions '0.6.0', '1.0.4', '1.1.7', '1.2.4', '1.3.1'
  
  @urls
    latest: 'http://underscorejs.org/underscore.js'
    '1.X.X': (v) -> "https://github.com/documentcloud/underscore/tarball/#{v}"
  
  @install (path, next) ->
    if @version == 'latest'
      @include_file 'js', path, next()
    else
      @deflate path, 'tar.gz', (path) ->
        @include_file 'js', "#{path}/underscore.js", next()
  
