{@Package} = require './package'
{@Project} = require './project'
{@Source} = require './source'
{@Bundle} = require './bundle'

for file in (require 'fs').readdirSync((require 'path').resolve(__dirname, './plugins'))
  if file[0] != '.'
    require './plugins/' + file

@brewfile = require('./brewfile').readBrewfile