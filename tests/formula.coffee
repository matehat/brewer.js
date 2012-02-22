path = require 'path'
assert = require 'assert'
{catalog, Installer} = require '../lib/formula'
{Project} = require '../lib'
{OK} = require '../tests'

exports.tests = 
  'Parsing a formula file': (next) ->
    assert.ok(catalog.formulae.jquery.versions['1.7.1'] == '273e017fd0bef143258516bdee173a1e')
    OK('formula/jquery parsed.')
    assert.ok(catalog.get('jquery').valid())
    OK('formula/jquery valid.')
    
    process.chdir(path.resolve(__dirname, 'js'))
    project = new Project(path.resolve(__dirname, 'js/Brewfile'))
    
    assert.ok(catalog.get('jquery-dev').url('1.3.2') == 'https://github.com/jquery/jquery/tarball/1.3.2')
    OK("catalog.get('jquery').url('1.3.2') == 'https://github.com/jquery/jquery/tarball/1.3.2'")
    
    next()
  
