(function() {
  var http, querystring, u_, url;

  http = require('http');

  url = require('url');

  querystring = require('querystring');

  u_ = require('underscore');

  exports.connect = function(options) {
    var api, apiFunctions, functionName, _base, _base2, _base3, _fn, _i, _len;
    if (options == null) options = {};
    if (!('apikey' in options)) return;
    api = {};
    api.options = u_.extend({}, options);
    (_base = api.options).allowPostRequests || (_base.allowPostRequests = true);
    (_base2 = api.options).host || (_base2.host = 'localhost');
    (_base3 = api.options).port || (_base3.port = 9001);
    api.call = function(functionName, functionArgs, callback) {
      var apiOptions, chunks, data, httpOptions, req, rootPath;
      rootPath = '/api/1/';
      apiOptions = u_.extend({
        'apikey': this.options.apikey
      }, functionArgs);
      httpOptions = {
        host: this.options.host,
        port: this.options.port,
        path: rootPath + functionName
      };
      data = querystring.stringify(apiOptions);
      if (typeof apiOptions['text'] !== void 0 && this.options.allowPostRequests) {
        httpOptions['method'] = 'POST';
        httpOptions['headers'] = {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.length
        };
      } else {
        httpOptions['method'] = 'GET';
        httpOptions['path'] += '?' + data;
      }
      chunks = [];
      req = http.request(httpOptions, function(res) {
        res.on('data', function(data) {
          return chunks.push(data);
        });
        return res.on('end', function() {
          var response;
          try {
            response = JSON.parse(chunks.join(''));
          } catch (error) {
            callback({
              code: -1,
              message: 'cannot parse the API response'
            }, null);
            return;
          }
          if (response.code === 0 && response.message === 'ok') {
            return callback(null, response.data);
          } else {
            return callback({
              code: response.code,
              message: response.message
            }, null);
          }
        });
      });
      req.on('error', function(error) {
        return callback({
          code: -1,
          message: error.message || error
        }, null);
      });
      if (httpOptions['method'] === 'POST') req.write(data);
      return req.end();
    };
    apiFunctions = ['createGroup', 'createGroupIfNotExistsFor', 'deleteGroup', 'listPads', 'createGroupPad', 'createAuthor', 'createAuthorIfNotExistsFor', 'createSession', 'deleteSession', 'getSessionInfo', 'listSessionsOfGroup', 'listSessionsOfAuthor', 'getText', 'setText', 'getHTML', 'createPad', 'getRevisionsCount', 'deletePad', 'getReadOnlyID', 'setPublicStatus', 'getPublicStatus', 'setPassword', 'isPasswordProtected'];
    _fn = function(functionName) {
      return api[functionName] = function(args, callback) {
        if (arguments.length === 1 && u_.isFunction(args)) {
          callback = args;
          args = {};
        }
        callback || (callback = function() {});
        api.call(functionName, args, callback);
        return null;
      };
    };
    for (_i = 0, _len = apiFunctions.length; _i < _len; _i++) {
      functionName = apiFunctions[_i];
      _fn(functionName);
    }
    return api;
  };

}).call(this);
