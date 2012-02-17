{spawn, exec} = require 'child_process'

compile = (dir, options="-c") ->
  coffee = spawn 'coffee', [options, '-o', "#{dir}/lib", "#{dir}/src"]
  coffee.stdout.on 'data', (data) ->
    console.log data.toString().trim()
  

task 'build', 'Build coffee source files into lib/ folder', -> 
  compile '.', '-c'

task 'watch', 'Continually build coffee source files into lib/ subfolder', -> 
  compile ".", "-cw"

task 'test', 'Run tests', ->
  require './tests'

task 'docs', 'Produce HTML documentation in docs/ subfolder', ->
  files = [
    'index', 'command', 'brewfile', 'util'
    'project', 'package', 'source', 'file'
    
    'extensions/javascript', 'extensions/css'
    'extensions/coffee-script', 'extensions/iced-coffee-script'
    'extensions/less', 'extensions/stylus'
  ]
  docco = spawn './node_modules/docco/bin/docco', ("src/#{f}.coffee" for f in files)
  docco.stdout.on 'data', (data) -> 
    console.log data.toString().trim()
  
  docco.stderr.on 'data', (data) -> 
    console.log data.toString().trim()
