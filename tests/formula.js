var formulae = require('../lib/formula').formulae,
    path = require('path'),
    OK = require('../tests').OK,
    assert = require('assert');

exports.tests = {
  'Parsing a formula file': function(next) {
    var formula = formulae(path.resolve(__dirname, '../formula/jquery.cf'));
    OK('formula/jquery parsed.');
    assert.ok(formula[0].valid() && formula[1].valid());
    OK('formula/jquery valid.')
    next()
  }
}