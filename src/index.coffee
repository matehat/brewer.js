##### Brewer.js, your asset management friend
# 
# *Version 0.2.2 - Source code is freely available on 
# [github](http://github.com/matehat/brewer.js).*
#
# This is the module obtained when importing `brewer`. 
# It exports the main classes from [project](project.html), [package](package.html), 
# [source](source.html) and [file](file.html).

{@Package} = require './package'
{@Project} = require './project'
{@Source} = require './source'
{@File} = require './file'

# It also parses the _extensions/_ directory to find modules that extends **brewer.js**
# functionality.

for file in (require 'fs').readdirSync((require 'path').resolve(__dirname, './extensions'))
  if file[0] != '.'
    require './extensions/' + file

##### MIT License
#
#     Copyright (c) 2012 Mathieu D'Amours
#
#     Permission is hereby granted, free of charge, to any person 
#     obtaining a copy of this software and associated documentation 
#     files (the "Software"), to deal in the Software without 
#     restriction, including without limitation the rights to use, 
#     copy, modify, merge, publish, distribute, sublicense, 
#     and/or sell copies of the Software, and to permit persons to 
#     whom the Software is furnished to do so, subject to the 
#     following conditions:
#
#     The above copyright notice and this permission notice shall be 
#     included in all copies or substantial portions of the Software.
#
#     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
#     EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES 
#     OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
#     NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
#     HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
#     WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
#     FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR 
#     OTHER DEALINGS IN THE SOFTWARE.