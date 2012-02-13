@javascript 'scripts', ->
  @options
    build: './build/js'
    compress: true
  
  @coffeescript './coffee', output: './js'

@stylesheets 'styles', ->
  @options
    build: './build/css'
    compress: true
  
  @less './less'
