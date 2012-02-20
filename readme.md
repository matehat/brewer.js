## Brewer.js
#### Your asset management best friend.

Brewer.js is a tool that eases all sorts of tasks related to the management of 
stylesheets and javascript source files. From a single command, it takes care of :

* Compilation of coffee-script source files to javascript
* Compilation of LESS or Stylus files to CSS
* Bundling different files (javascript or CSS) into a single file (optionally compressing it) while maintaining references and their proper ordering.
* Watching a directory for changes, triggering any or all of the above.

Watching a whole project structure of Coffee-script, LESS or Stylus source files can be as easy as :

    $ brake watch
    Info Watching project /path/to/current/working/directory
    Compiled coffee/test.coffee
    Compiled less/index.less
    Packaged build/css/index.css
    Compressed build/css/index.css

### Installation

#### Using a prepared package

To setup Brewer.js, make sure you have [installed Node.js](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager). When this is done, enter the terminal and type.

    $ npm install -g brewer

The `-g` flag is used to make the installation global, so you get access to the `brake` executable. Then, from a project directory you wish to manage using Brewer.js

    $ brake init [<template name>]

The `<template name>` part is optional. Anyway, for the moment, there is only one template available, **lesscoffee**, which is also the default. This template sets up LESS and Coffeescript support for the current directory.

What this does is create a Brewfile in the current directory, according to the template provided and run `brake make` on it (see Usage).

#### Using this repository

You need Node.js, as well as coffee-script, installed globally to get the `cake` executable. You can do so by doing :

    $ npm install -g coffee-script
    
Then, to get brewer.js to work locally

    $ git clone git@github.com:matehat/brewer.js.git brewer
    $ cd brewer
    $ npm install
    $ cake build
  
Then, if you want the `brewer` executable, you can do

    $ npm link

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

Those two functions can be used interchangeably with `js` or `css` to be more concise. The `package_name` is used to identify certain parts of a project, in case you would like to run `$ brake make package_name`. A **Package** is a conceptual component of a project in which you can define **bundles** and in which files can *import* each other. A file contained in a package can really be anywhere on the file system -- a package is not bound to a specific directory.

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

`@options` is a method available in the package definition body, that specifies additional options for the package. Another such method is `@bundles(bundle1, bundle2, ...)` which specifies file names for bundles in the package (see **Bundles** below). These two methods are prefixed with a `@`, meaning that they are members of the package body context. Other methods of this kind are available, such as those to define **sources** in a package. 

##### Sources

Sources represent a folder on the file system, where files can be found. One or many can exist within a package, providing it with files to compile, bundle and compress. A source can be of one of many available types : *coffeescript*, *javascript*, *css*, *less* or *stylus*. One restriction about this source type is that a package can only contain sources that are either of its own type, or that can be compiled into its own type (remember a package also have a type).

Now for a real-world example, so we don't get lost too quickly. Say we want to make a cool looking website using jQuery, Bootstrap and Chosen. Each of these libraries have their own source files, of different types and we want to manage all of that neatly. Here is the directory structure :

```
Root folder
|-- js
|-- coffee
|-- css
|-- less
|-- vendor
    |-- bootstrap
    |   |- less
    |   |- js
    |
    |-- chosen
    |-- jquery.js
```

So there are files that ends up as javascript and those that ends up as css. Let's write a Brewfile that takes this structure into account.

```coffeescript
javascript 'scripts', {build: './js'} ->
    @bundles 'home', 'products'
    
    @coffeescript './coffee'
    @js './vendor'

stylesheets 'styles', {build: './css'} ->
    @bundles 'home', 'products'

    @less './less'
    @less './vendor/bootstrap/less'
    @css './vendor'
```

So what we're looking at now is a package for javascripts that looks for coffeescript files in `./coffee`, as well as for javascript files in `./vendor`, `./vendor/chosen` and `./vendor/bootstrap/js`. Now let's look at what a bundle would look like :

```coffeescript
# in coffee/home.coffee
# import ["jquery", "chosen/chosen.jquery.js"]

$ -> $('select').chosen()
```

If we had been running `brake watch` while we wrote that script and saved it, we would have seen a file appear, named `./js/home.js`, containing an aggregate file of jquery, chosen and our little script compiled into javascript. Since we didn't provide the `output` option, a compiled javascript version of just `coffee/home.coffee` can be found in `./_cache`. If we wanted it to appear somewhere more meaningful, we could set the `output` option on a source directive. A more complete example of the above could be :

```coffeescript
javascript 'scripts', {build: './build/js'} ->
    @bundles 'home', 'products'
    
    @coffeescript './coffee', {output: './js'}
    @js './vendor'

stylesheets 'styles', {build: './build/css'} ->
    @bundles 'home', 'products'

    @less './less', {output: './css'}
    @css './vendor'
```

This dedicates a directory `./build`, to contain files that would be deployed, and all source files in separate directories. You may have noticed we used `@css` and `@js` names to mean stylesheets and javascript respectively. As we said earlier, those are drop-in replacements.

### Usage

The command-line interface for brewer provides a few methods to manage the asset project. 

* `brake init <template_name>`

    This command tells brewer to make a Brewfile in the current directory, according to the template provided, and make an initial directory structure to support the project.

* `brake [all|<package>*]`

    This command tells brewer to look for files to compile (coffeescript, less, etc.) into their javascript or css counterparts, product bundles and compress them if necessary. This intelligently selects only the tasks that needs to be done, skipping files that haven't change.
    
* `brake clean [<package>*]`

    This command tells brewer to delete files that strongly depends on source files, such as those that are completely derived from the compilation of another file, bundles and their compressed counterparts.
    
* `brake watch`

    This command tells brewer to first run `brake make` on the current directory and watch for changes (file content change, new files, moved files or deleted files).
    
* `brake install`

    This command tells Brewer.js to install all missing Node.js modules that it needs to work properly
    with the current project. For instance, had I put a few `@coffeescript` source directives in the project's 
    Brewfile, Brewer.js will make sure the coffee-script module is available, installing it under its own 
    project directory if not.

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