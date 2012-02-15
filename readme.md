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

To setup Brewer.js, make sure you have [installed Node.js](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager). When this is done, enter the terminal and type.

    $ npm install -g brewer

The `-g` flag is used to make the installation global, so you get access to the `brewer` executable. Then, from a project directory you wish to manage using Brewer.js

    $ brewer init [<template name>]

The `<template name>` part is optional. Anyway, for the moment, there is only one template available, **lesscoffee**, which is also the default. This template sets up LESS and Coffeescript support for the current directory.

What this does is create a Brewfile in the current directory, according to the template provided and run `brewer make` on it (see Usage).

### Brewfile

A <strong>Brewfile</strong> is a file that sits at the root folder of your project, named, 
well, "Brewfile", which syntax is plain [Coffeescript](http://coffeescript.org). It is used to specify the structure of the project to Brewer.js, so it knows what to do when you tell it to `make`, `watch` or `clean`. 

##### Packages

At the top-level of the Brewfile, the following functions are available :

```coffeescript
# In Brewfile

stylesheets 'package_name', ->
  # package body ...

javascript 'other_package_name', ->
  # package body ...
```

Those two functions can be used interchangeably with `js` or `css` to be more concise. The `package_name` is used to identify certain parts of a project, in case you would like to run `$ brewer make package_name`. A **Package** is a conceptual component of a project in which you can define **bundles** and in which files can *import* each other. A file contained in a package can really be anywhere on the file system -- a package is not bound to a specific directory.

Package can receive options, which can be specified in one of two ways :

````coffeescript
# In Brewfile

javascript 'package_name', {build: './build', compress: true}, ->
  # package body

# equivalent to
javascript 'package_name', ->
  @options {build: './build', compress: true}
```

The `build` option specifies where to put bundles aggregated from source files, and `compress` &hellip; well, I think you can guess that one.

### Usage



### MIT License

Copyright &copy; 2012 Mathieu D'Amours

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