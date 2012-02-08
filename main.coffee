http = require 'http'
url = require 'url'
querystring = require 'querystring'
u_ = require 'underscore'


exports.connect = (options={}) ->
  return unless 'apikey' of options

  api = {}
  api.options = u_.extend {}, options

  api.options.allowPostRequests ||= true
  api.options.host ||= 'localhost'
  api.options.port ||= 9001


  api.call = (functionName, functionArgs, callback) ->
    rootPath = '/api/1/'
    apiOptions = u_.extend { 'apikey': @options.apikey }, functionArgs

    httpOptions =
      host: @options.host
      port: @options.port
      path: rootPath + functionName

    data = querystring.stringify apiOptions

    # If we have a "text" field, we POST.
    if (typeof(apiOptions['text']) != undefined && @options.allowPostRequests)
      httpOptions['method'] = 'POST'
      httpOptions['headers'] =
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data.length
    else
      httpOptions['method'] = 'GET'
      httpOptions['path'] += '?' + data

    chunks = []
    req = http.request httpOptions, (res) ->
      res.on 'data', (data) ->
        chunks.push(data)
      res.on 'end', () ->
        try
          console.log(chunks.join(''))
          response = JSON.parse chunks.join('')
        catch error
          callback { code: -1, message: 'cannot parse the API response' }, null
          return

        if response.code is 0 and response.message is 'ok'
          callback null, response.data
        else
          callback { code: response.code, message: response.message}, null

    req.on 'error', (error) ->
      callback { code: -1, message: (error.message or error) }, null
    if httpOptions['method'] == 'POST'
      req.write(data);

    req.end()

  apiFunctions = [
    'createGroup',
    'createGroupIfNotExistsFor',
    'deleteGroup',
    'listPads',
    'createGroupPad',
    'createAuthor',
    'createAuthorIfNotExistsFor',
    'createSession',
    'deleteSession',
    'getSessionInfo',
    'listSessionsOfGroup',
    'listSessionsOfAuthor',
    'getText',
    'setText',
    'getHTML',
    'createPad',
    'getRevisionsCount',
    'deletePad',
    'getReadOnlyID',
    'setPublicStatus',
    'getPublicStatus',
    'setPassword',
    'isPasswordProtected',
  ]
  for functionName in apiFunctions
    do (functionName) ->
      api[functionName] = (args, callback) ->
        if arguments.length is 1 and u_.isFunction(args)
          callback = args
          args = {}

        callback ||= () ->
          # pass

        api.call(functionName, args, callback)
        return null


  return api
