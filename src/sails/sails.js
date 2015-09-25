angular.module('jumplink.cms.sails', [
    'sails.io',
  ])

  .service('JLSailsService', function ($rootScope, $sailsSocket, $q, $log) {

    var resolve = function(url, query, options, callback, next) {
      var deferred = $q.defer();
      var errors = [
        "On trying to resolve "+url,
        "Request has more than one results",
        "No result"
      ];
      if(angular.isUndefined(options)) {
        options = {};
      }
      if(angular.isUndefined(options.method)) {
        options.method = 'get';
      }
      if(angular.isUndefined(options.resultIsArray)) {
        options.resultIsArray = false;
      }
      if(angular.isUndefined(query)) {
        query = {};
      }
      // $log.debug("[JLSailsService.resolve]", url, query, options);
      $sailsSocket[options.method](url, query).then (function (data) {
        if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
          if(angular.isFunction(callback)) {
            return callback(null, null);
          }
          return deferred.resolve(null);
        }
        if (!options.resultIsArray && data.data instanceof Array) {
          data.data = data.data[0];
          $log.warn(errors[1]);
        }
        // data.data.content = html_beautify(data.data.content);
        if(next) {
          data.data = next(data.data);
        }
        if(angular.isFunction(callback)) {
          callback(null, data.data);
        }
        return deferred.resolve(data.data);
      }, function error (resp){
        $log.error(errors[0], resp);
        if(angular.isFunction(callback)) {
          return callback(errors[0], resp);
        }
        return deferred.reject(errors[0]);
      });
      return deferred.promise;
    };
    return {
      resolve: resolve
    };
  })
;