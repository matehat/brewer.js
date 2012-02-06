var path = require('path'),
    assert = require('assert'),
    debug = require('../lib/command').debug,
    brewfile = require('../lib/brewfile'),
    OK = require('../tests').OK,
    js;

exports.tests = {
  'Parsing a Brewfile': function() {
    packages = brewfile.configs(path.resolve(__dirname, 'js/Brewfile'));
    OK('js/Brewfile parsed.');
    
    assert.ok((js = packages[0]).opts.type == 'javascript' && js.srcs[0].opts.output == './js');
    OK('js/Brewfile correctly parsed.');
  }
}