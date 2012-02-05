(function() {
  var express, path;

  path = require('path');

  express = require('express');

  this.run = function(port) {
    var app;
    app = express.createServer();
    app.configure(function() {
      app.use(express.static(path.resolve(__dirname, '../../web/static')));
      app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
      }));
      app.use(express.methodOverride());
      app.use(express.bodyParser());
      app.use(app.router);
      app.set('view engine', 'jade');
      return app.set('views', path.resolve(__dirname, '../../web/templates'));
    });
    app.get('/', function(req, res) {
      return res.render('index', {
        title: 'My Site'
      });
    });
    return app.listen(port);
  };

}).call(this);
