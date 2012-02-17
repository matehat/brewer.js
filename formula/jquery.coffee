formula 'jquery', ->
  @homepage "http://jquery.com/"
  @doc      "http://api.jquery.com/"
  @urls (v) ->
    "https://ajax.googleapis.com/ajax/libs/jquery/#{v}/jquery.js"
  
  @latest '1.7.1'
  @versions
    '1.2.6': '85116248cddf1082f23de12e4c43a693'
    '1.3.2': 'e4af2b4805203f1ac490ad67531b848b'
    '1.4.4': 'ede38e8db778584feacf86ef6767948a'
    '1.5.2': '8c40d7e0c38ccbca24b7ba29a1db07e7'
    '1.6.4': 'be5cda8fa534e4db49425efbbf36c565'
    '1.7.1': '273e017fd0bef143258516bdee173a1e'
  
  @exports 'js', main: 'jquery.js'

formula 'jquery-dev', ->
  @homepage "http://jquery.com/"
  @doc      "http://api.jquery.com/"
  
  @versions
    '1.2.6': 'd8225e9b56a0a5a991ead40a008fc699'
    '1.3.2': 'e98e6242e23b7c460f710cf1663a9f62'
    '1.4.4': 'b2f137cd64b2e52862425c6870ca2bbc'
    '1.5.2': 'dc47aea87d7a18ab28020ebe61e5ba98'
    '1.6.4': '3345e808e6a26494d481fbcabf5d48d1'
    '1.7.1': 'cb305ab20a573660951b1e967b3050c4'
  
  @urls
    "latest": "https://github.com/jquery/jquery/tarball/master"
    "1.X.X": (v) ->
      v = if v.patch is '0' then "#{v.major}.#{v.minor}" else v
      "https://github.com/jquery/jquery/tarball/#{v}"
    
  @exports ->
    @js './jquery', main: './core.js'
  
  @install (path, next) ->
    @deflate path, 'tar.gz', (dirpath) ->
      @stage "#{dirpath}/src", "jquery"
  
