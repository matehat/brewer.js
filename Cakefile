{spawn, exec} = require 'child_process'

compile = (dir, options="-c") ->
  coffee = spawn 'coffee', [options, '-o', "#{dir}/lib", "#{dir}/src"]
  coffee.stdout.on 'data', (data) -> console.log data.toString().trim()

task 'build', 'continually build coffee files with --watch', ->
  compile "."

task 'watch', 'continually build coffee files with --watch', ->
  compile ".", "-cw"

task 'test', 'Run tests', ->
  require './tests'
