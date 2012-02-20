
### 0.3.5 / 2012-02-20 

  * Changed `brewer` for `brake`
  * Added tracking of file watchers to address #6
  * Changed 'showError' for 'error'
  * Graceful handling of parsing error of Brewfile
  * Removed LICENSE file, since its in the readme

### 0.3.4 / 2012-02-17

* Removed obsolete dependency
* Added a history file
* Graceful handling of double attachments
* Updated readme to make the source tree more readable
* Added a section to explain how to install from git, as well as a `build` cake task to build coffee sources to javascript
* Changed all tests from js to coffee
* Fixed a bug where `make clean` wouldn't work
* Added the coffeescript source tree to npm ignore
* Added lib/ directory to ignored list
* Removed the javascript files lib/ from the index
* Added icedcoffeescript to the built documentation
* Added IcedCoffeeScript support
* Moved docs/ to documentation/
* Updated NPM dependencies to exclude those that are specific to project needs (less, stylus, etc.)
* Added the `brewer install` command description to the readme file
* Updated docs with proper index.html
* Merge branch 'master' of github.com:matehat/brewer.js

### 0.3.3 / 2012-02-16

* Fixed a bug that would make sources ignore the configured output directory
* Added a test case for project requirements
* Added the `brew install` CLI command
* Updated docs to latest

### 0.3.2 / 2012-02-16

* Changed the css processor to https://github.com/rhiokim/node-css-compressor
* Fixed a typo in project readme
* Updated the bundling process to use streams rather than sync IO
* Made the project documentation managed by brewer.js
* Updated included docs
* Added content to the readme file
* Updated dependencies from package.json to include all relevant third-party modules

### 0.3.0-0.3.1 / 2012-02-15

* Updated .gitignore and package.json so it can be installed properly with npm
* Moved all documentation to a separate branch (gh-pages) as a submodule
* Added inline documentation for all remaining modules
* Removed the 'registry' class properties from 'Source' and 'Package' classes, putting the subclasses directly as class properties.
* Updated docs to include 'coffee-script' extension
* Added a LICENSE file
* Changed src/plugins for src/extensions
* Updated docs to include 'project' and 'source' modules
* Fixed a few bugs
* Set `source.output` to './_cache' by default
* Moved `Package.registerFile` to a `newfile` event handler and added docs for 'package' module
* Added the `clean` command to the CLI
* Updated docs for 'file' module, and fixed a problem with unintentional heredocs
* Refactored package behavior from subclass to main class
* Added inline documentation for the 'util' module and rearranged it for the 'file' module
* Added inline doc for the 'file' module and fixed a sentence in 'index'
* Added inline doc for 'brewfile', 'command' and 'index' modules
* Added a `docs` cake task to build inline documentation using docco, as well as a initial build of it
* Made `brewer make` more reliable
* Added proper error catching in Stylus compilation
* Added proper error catching in LESS compilation
* Fixed a bug in coffeescript plugin
* Catching and displaying error for coffee-script compilation
* Improved the `brewer watch` CLI command
* First implementation of a `watch` CLI command
* Added the `make <package>*` command to the cli
* Added a 'templates' directory, where project templates are kept

### 0.2.2 / 2012-02-13

* Fixed package.json
* Fixed a bug where the bundle file would get printed twice in its output file

### 0.2.1 / 2012-02-10

* Added a command on `Project` and `Package` to clean impermanent (builds, compiled, etc) files

### 0.2.0 / 2012-02-10

* Another bulk of bug fixes, tests pass again.
* Added a previously missing included Less file, in tests
* Added the ability for vendor libs to specify requirements
* Changed `Package.types` and `Source.types` in favor of a single type and a set of aliases that map to the type
* Fixed a bug
* Made the "make sure it's ready" implicit in the call to "actualize"
* A big set of fixes aimed at making the branch work, in view of v0.2.0
* Removed test js build files from the index
* Major refactor of code related to file management