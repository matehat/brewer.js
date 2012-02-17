brewer = require '../..'
fs = require 'fs'
path = require 'path'
sys = require 'util'
assert = require 'assert'
_ = require 'underscore'
cssom = require 'cssom'
color = require('ansi-color').set
{Project} = brewer
{OK} = require '..'

project = csspackage = stylpackage = null

select = (css, sel) -> 
  _.find css, (item, key) -> item.selectorText is sel

exports.tests =
  setup: ->
    process.chdir(path.resolve(__dirname))
    project = new Project(path.resolve(__dirname, './Brewfile'))
    project.clean()
    csspackage = project[0]
    stylpackage = project[1]
  
  clean: -> project.clean()
  
  'Requirements': (next) ->
    assert.ok(project.requiredModules().length is 3)
    OK('The project has 3 requirements')
    assert.ok(project.missingModules().length is 0)
    OK('The project doesn\'t have missing required modules')
    next()
  
  'Packaging LESS stylesheets': (next) ->
    csspackage.actualize ->
      css = cssom.parse(fs.readFileSync('./css/build-less/testless1.css', 'utf-8')).cssRules
      bodyp = select(css,'body p')
      assert.ok(bodyp isnt undefined && bodyp.style.color is 'white')
      OK("body p -> color: white")
      
      bodydiv = select(css,'body div')
      assert.ok(bodydiv isnt undefined && bodydiv.style.color is 'black')
      OK("body div -> color: black")
      
      data = select(css,'#data')
      assert.ok(data isnt undefined && data.style.float is 'left' && data.style['margin-left'] is '10px')
      OK("#data -> float: left margin-left: 10px")
      
      border = select(css,".border")
      assert.ok(border isnt undefined && border.style.margin is '8px' && border.style['border-color'] is '#3bbfce')
      OK("#data -> margin: 8px border-color: #3bbfce")
      
      css = cssom.parse(fs.readFileSync('./css/build-less/testless1.min.css', 'utf-8')).cssRules
      bodyp = select(css,'body p')
      assert.ok(bodyp isnt undefined && bodyp.style.color is 'white')
      OK("body p -> color: white")
      
      bodydiv = select(css,'body div')
      assert.ok(bodydiv isnt undefined && bodydiv.style.color is 'black')
      OK("body div -> color: black")
      
      data = select(css,'#data')
      assert.ok(data isnt undefined && data.style.float is 'left' && data.style['margin-left'] is '10px')
      OK("#data -> float: left margin-left: 10px")
      
      border = select(css,".border")
      assert.ok(border isnt undefined && border.style.margin is '8px' && border.style['border-color'] is '#3bbfce')
      OK("#data -> margin: 8px border-color: #3bbfce")
      
      next()
    
  'Packaging Stylus stylesheets': (next) ->
    stylpackage.actualize ->
      css = cssom.parse(fs.readFileSync('./css/build-stylus/test1.css', 'utf-8')).cssRules
      
      bodylogo = select(css, "body #logo")
      assert.ok(bodylogo isnt undefined && bodylogo.style["-webkit-border-radius"] is '5px')
      OK("body #logo -> -webkit-border-radius: 5px")
      
      bodycont = select(css, "body .container")
      assert.ok(bodycont isnt undefined && bodycont.style.margin is '0 auto')
      OK("body .container -> margin: 0 auto")
      
      css = cssom.parse(fs.readFileSync('./css/build-stylus/test2.css', 'utf-8')).cssRules
      body = select(css, "body")
      assert.ok(body isnt undefined && body.style.position is 'fixed')
      assert.ok(body isnt undefined && body.style.right is '0')
      OK("body -> position: fixed right: 0")
      
      css = cssom.parse(fs.readFileSync('./css/build-stylus/test1.min.css', 'utf-8')).cssRules
      
      bodylogo = select(css, "body #logo")
      assert.ok(bodylogo isnt undefined && bodylogo.style["-webkit-border-radius"] is '5px')
      OK("body #logo -> -webkit-border-radius: 5px")
      
      bodycont = select(css, "body .container")
      assert.ok(bodycont isnt undefined && bodycont.style.margin is '0 auto')
      OK("body .container -> margin: 0 auto")
      
      css = cssom.parse(fs.readFileSync('./css/build-stylus/test2.min.css', 'utf-8')).cssRules
      body = select(css, "body")
      assert.ok(body isnt undefined && body.style.position is 'fixed')
      assert.ok(body isnt undefined && body.style.right is '0')
      OK("body -> position: fixed right: 0")
      next()
