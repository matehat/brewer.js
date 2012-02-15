## Brewer.js
#### Your asset management best friend.

Brewer.js is a tool that eases all sorts of tasks related to the management of 
stylesheets and javascript source files. From a single command, it takes care of :

* Compilation of coffee-script source files to javascript
* Compilation of LESS or Stylus files to CSS
* Bundling different files (javascript or CSS) into a single file (optionally compressing it) while maintaining references and their proper ordering.
* Watching a directory for changes, triggering any or all of the above.

Watching a whole project structure of Coffee-script, LESS or Stylus source files can be as easy as :

    $ brewer watch
    Info Watching project /path/to/current/working/directory
    Compiled coffee/test.coffee
    Compiled less/index.less
    Packaged build/css/index.css
    Compressed build/css/index.css

### Installation

To setup Brewer.js, make sure you have installed Node.js. When this is done, enter the terminal and type.

    $ npm install -g brewer

The -g flag is used to make the installation global, so you get access to the brewer executable. Then, from a project directory you wish to manage using Brewer.js

    $ brewer init [<template name>]

The <template name> part is optional. Anyway, for the moment, there is only one template available, lesscoffee, which is also the default. This template sets up LESS and Coffeescript support for the current directory.

What this does is create a Brewfile in the current directory, according to the template provided and run brewer make (see usage) on it.

### Brewfile

### Usage



### MIT License

Copyright (c) 2012 Mathieu D'Amours

Permission is hereby granted, free of charge, to any person 
obtaining a copy of this software and associated documentation 
files (the "Software"), to deal in the Software without 
restriction, including without limitation the rights to use, 
copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to 
whom the Software is furnished to do so, subject to the 
following conditions:

The above copyright notice and this permission notice shall be 
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES 
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR 
OTHER DEALINGS IN THE SOFTWARE.