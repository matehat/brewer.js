# ### CSS Extension
#
# This extension defined a *Source* subclass specific
# for stylesheets. This barely implies defining specific classes properties.

{Package, Source} = require '..'
{finished, debug} = require '../command'

# *Source* is subclassed by providing, again, the required
# [class properties](source.html#section-2)
class StylesheetsSource extends Source
  @term = @type = 'stylesheet'
  @aliases = ['css', 'styles', 'stylesheets']
  @header = /^\/\*\s*import\s+([a-zA-Z0-9_\-\,\.\[\]\{\}\u0022/ ]+)\*\//m
  @ext = '.css'


StylesheetsSource.register()
exports.StylesheetsSource = StylesheetsSource