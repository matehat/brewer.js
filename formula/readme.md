## Brewer.js Formulae

Brewer.js Formulae are a easy way, for users of Brewer.js, to install vendor libraries 
into their project. Formulae can easily be added to this directory and immediately
available to Brewer.js users, by forking the project, adding a formula and making a pull
request to merge in your new-born formula.

### Structure of a formula

A formula file can include one or more formulae, tightly related to each other. For example,
the `jquery.coffee` formula file contains a `jquery` formula and a `jquery-dev` formula.This is the directive that starts off the definition of a formula

```coffeescript
formula '<formula_name>', ->
```

Within the body of this formula definition, the following methods can be used :
  
#### @urls 

  **Required**. This tells Brewer.js at what URL it can download the library. This can be in one of three 
  forms. The first is through the use of a function that takes a single argument, a version. This version 
  is an object that can be coerced to its string representation. It also contain its `major`, `minor`, 
  `patch` and `tag` components (assuming `[major].[minor].[patch]-[tag]`)

```coffeescript
  @urls (v) ->
    "https://ajax.googleapis.com/ajax/libs/jquery/#{v}/jquery.js"
```

  The second form is through an object, with keys being either versions, version ranges or the 'latest'
  keyword. The values can be a URL string or a function, like above :
  
```coffeescript
  @urls
    "latest": "https://github.com/jquery/jquery/tarball/master"
    "1.X.X": (v) ->
      v = if v.patch is '0' then "#{v.major}.#{v.minor}" else v
      "https://github.com/jquery/jquery/tarball/#{v}"
```

  The last, and the simplest, is a single URL string in an anonymous function:
  
```coffeescript
  @urls -> 'https://raw.github.com/douglascrockford/JSON-js/master/json2.js'
```

  In fact, this is the same form as the first. We just simply didn't take the version into account.

#### @exports

  **Required**. This tells Brewer.js how it should interact with a *staged* vendor library. A vendor
  library could contain, like in the case of [bootstrap][2], a mix of javascript and less files. For that case,
  a formula for bootstrap could contain the following snippet :

```coffeescript
  @exports ->
    @dir  'less',       './less', {prefix: 'styles'}
    @main 'less',       './less/bootstrap.less'
    @dir  'javascript', './js'
```
          
  This shows a few characteristics of a an `@export` directive. First, `@export` is followed by an anonymous
  function, whose body will specify the individual directories to include, using the `@dir` directive. This
  function receives a single argument : the installed version. This allows the function body to vary its
  the structure of the vendor library according to the version installed.
  The `@main` directive is used to specify a main source file (for a particular type) for the vendor library. It
  has the form `@main(<type>, <relative path>)`. For the case above, it adds a shorter access path of simply    
  `bootstrap`, pointing to the file located at `./less/bootstrap.less`.
  `@dir` has the form of `@dir(<source type>, <relative path>, [<options>])`. Each of those directories
  will be added as *sources* in the project packages, thus the `<source type>` argument. The trailing `options`
  object can provide the following values:
  
  * `prefix`
  
    This value will be prepended when calculating the access path of files contained in the directory. For 
    example, using the snippet above, assuming the `@exports` directive is contain in a `bootstrap` formula, the  
    file `alerts.less` found in the `./less` directory would have an access path of `bootstrap/styles/alerts`.
  
  * `main`
  
    This value is simply a path pointing to a file (relative to the path of the directory, not to that of the 
    vendor library). If `prefix` was provided, like in the case above it, it specifies what file should be
    pointed to by the access path of `<project name>/<prefix>`. Otherwise, it specifies the file pointed by
    `<project name>`. Without the `prefix` option, this is equivalent to the `@main` directive.
  
  For some really simple formulae, the `@exports` directive can be of another form, which is :
  
```coffeescript
  @exports <type>, <option>
  # equivalent to
  @exports ->
    @dir <type>, '.', <option>
```

  This implies that the whole vendor library is added as a single *source*, of the type provided, with the given 
  options.

#### @install

  This is the directive that specify how to install the vendor library. It takes a single argument: an anonymous
  function called when installing the library. This function receives the installed version as its only argument.
  In the function body, a couple of methods are made available : 
  
  * `@stage(<path>, [<new name>])`
    
    This method takes the path provided as the first argument and puts it in the staged vendor library, under a 
    new name if `<new name>` is provided.
      
  * `@deflate(<path>, <compression>, <callback>)`
    
    This method takes a path and decompresses it using the compression provided (can be either `zip`, `tar`,
    `tar.gz` or `tar.bz2`). When it finishes, it invokes the callback with the list of files extracted as  
    argument.
    
  *More methods will be made available to the installer body as the needs emerge.*

#### @versions

  What versions are available, if applicable. This can be in the form of an object, mapping versions to md5 
  checksums, for better reliability. The versions must comply to [semantic versioning][1] :
  
```coffeescript
  @versions '1.6.4', '1.7.1'
  @versions
    '1.6.4': 'be5cda8fa534e4db49425efbbf36c565'
    '1.7.1': '273e017fd0bef143258516bdee173a1e'
```

#### @homepage

  This helps keep track of homepages for the installed vendor libraries.

#### @doc

  This function can be in either of the forms allowed by `@urls`. It is used to keep
  track of where to find proper documentation for the installed vendor libraries.

[1]: http://semver.org/
[2]: http://twitter.github.com/bootstrap/