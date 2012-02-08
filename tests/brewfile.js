var path = require('path'),
    assert = require('assert'),
    debug = require('../lib/command').debug,
    Project = require('../lib').Project,
    OK = require('../tests').OK,
    js;

exports.tests = {
  'Parsing a Brewfile': function(next) {
    project = Project.fromBrewfile(path.resolve(__dirname, 'js/Brewfile'));
    OK('js/Brewfile parsed.');
    
    assert.ok((js = project[0]).options.type == 'javascript' && js.sources[0].options.output == './js');
    OK('js/Brewfile correctly parsed.');
    next()
  }
}