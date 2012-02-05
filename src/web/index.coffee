path = require 'path'
express = require('express')

@run = (port) ->
  app = express.createServer()
  
  app.configure ->
    app.use express.static path.resolve __dirname, '../../web/static'
    app.use express.errorHandler dumpExceptions: true, showStack: true 
    app.use express.methodOverride()
    app.use express.bodyParser()
    app.use app.router
    
    app.set 'view engine', 'jade'
    app.set 'views', path.resolve __dirname, '../../web/templates'
  
  app.get '/', (req, res) ->
    res.render 'index', title: 'My Site'
  
  app.listen port
