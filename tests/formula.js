var formula = require('../lib/formula'),
    formulae = formula.formulae,
    Installer = formula.Installer,
    path = require('path'),
    Project = require('../lib').Project,
    OK = require('../tests').OK,
    assert = require('assert');

exports.tests = {
  'Parsing a formula file': function(next) {
    var formula = formulae(path.resolve(__dirname, '../formula/jquery.cf'));
    OK('formula/jquery parsed.');
    assert.ok(formula.jquery.valid() && formula['jquery-dev'].valid());
    OK('formula/jquery valid.');
    
    process.chdir(path.resolve(__dirname, 'js'));
    project = Project.fromBrewfile(path.resolve(__dirname, 'js/Brewfile'));
    inst = new Installer(formula['jquery-dev'], project, '1.3.2');
    
    assert.ok(inst._getUrl() == 'https://github.com/jquery/jquery/tarball/1.3.2');
    OK("installer._getUrl() == 'https://github.com/jquery/jquery/tarball/1.3.2'");
    
    next();
  }
}