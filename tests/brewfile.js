var path = require('path'),
    assert = require('assert'),
    debug = require('../lib/command').debug,
    Project = require('../lib').Project,
    OK = require('../tests').OK,
    js;

exports.tests = {
  'Parsing a Brewfile': function(next) {
    process.chdir(path.resolve(__dirname, 'js'));
    project = new Project(path.resolve(__dirname, 'js/Brewfile'));
    OK('js/Brewfile parsed.');
    
    assert.ok((js = project[0]).options.type == 'javascript' && js.sources.coffeescript[0].options.output == './js');
    OK('js/Brewfile correctly parsed.');
    next()
  }
}