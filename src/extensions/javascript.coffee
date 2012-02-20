# ### CSS Extension
#
# This extension defined a *Source* subclass specific
# for javascript files. This barely implies defining specific classes 
# properties.

{Source} = require '..'
{finished, debug} = require '../command'

# *Source* is subclassed by providing, again, the required
# [class properties](source.html#section-2)
class JavascriptSource extends Source
  @aliases = ['js', 'javascripts', 'scripts']
  @term = @type = 'javascript'
  @ext = '.js'
  @header = /^\/\/\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)/m


JavascriptSource.register()
exports.JavascriptSource = JavascriptSource

# Thumbs up if you noticed these docs are pretty much copy-pasted from 
# [css.coffee](css.html)! :)