formula 'json2', ->
  @homepage 'https://github.com/douglascrockford/JSON-js'
  @urls -> 'https://raw.github.com/douglascrockford/JSON-js/master/json2.js'
  @install (path, next) -> @include_file 'js', path, next()
