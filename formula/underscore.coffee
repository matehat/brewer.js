formula 'underscore', ->
  @homepage 'http://underscorejs.org'
  @doc      'http://underscorejs.org'
  @latest '1.3.1'
  
  @versions
    '0.6.0': '575c471beca85c3898d1d687f0d7ddb5'
    '1.0.4': 'ca96e87d532ae80b44850655c718a103'
    '1.1.7': '20313652dbcb33aa0bf1436581829abb'
    '1.2.4': 'a28e690a41615d34540749497567c356'
    '1.3.1': 'acce8b5ffbab5c5f2b6da40e6c8d0d27'
  
  @urls
    latest: 'http://underscorejs.org/underscore.js'
    '>= 0.6.0': (v) -> "https://github.com/documentcloud/underscore/tarball/#{v}"
  
  @install (path, next) ->
    if @version == 'latest'
      @include_file 'js', path, next()
    else
      @deflate path, 'tar.gz', (path) ->
        @include_file 'js', "#{path}/underscore.js", next()
  
