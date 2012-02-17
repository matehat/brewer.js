# Search for 'keyword' on twitter, then callback 'cb'
# with the results found.
@tester = (cb) ->
  waiter = (cb2) ->
    setTimeout (-> cb2 'Hello!'), 20
  await waiter defer hi
  cb hi
