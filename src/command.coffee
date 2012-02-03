
@finished = (action, target) ->
  console.log '-', require('ansi-color').set(action, 'blue'), target

@debug = (msgs...) ->
  console.log '?', require('ansi-color').set('DEBUG', 'red'), msgs...
