formula 'json2', ->
  @homepage 'https://github.com/douglascrockford/JSON-js'
  
  @urls -> 'https://raw.github.com/douglascrockford/JSON-js/master/json2.js'
  @md5 '2ee84c1e82528e5e09c645cf07c97877'
  
  @install (path, next) -> @include_file 'js', path, next()
