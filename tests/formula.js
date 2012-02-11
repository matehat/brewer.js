var formula = require('../lib/formula'),
    path = require('path');

exports.tests = {
  'Parsing a formula file': function(next) {
    formula.formulae(path.resolve(__dirname, '../formula/jquery.cf'));
    OK('formula/jquery.cf parsed.');
    next()
  }
}