{@Brewer} = require './brewer'
{@Source} = require './source'

for file in (require 'fs').readdirSync((require 'path').resolve(__dirname, './plugins'))
  if file[0] != '.'
    require './plugins/' + file
