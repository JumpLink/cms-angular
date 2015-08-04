angular.module('jumplink.cms.sails', [
    'sails.io',
  ])

  .service('JLSailsService', function ($rootScope, $sailsSocket, $log) {

    var resolve = function(url, query, options, callback, next) {

      var errors = [
        "On trying to resolve "+url,
        "Request has more than one results"
      ];

      if(angular.isUndefined(options)) options = {};
      if(angular.isUndefined(options.method)) options.method = 'get';
      if(angular.isUndefined(options.resultIsArray)) options.resultIsArray = false;
      if(angular.isUndefined(query)) query = {};
      $log.debug("[ResolveService.resolve]", url, query, options);

      return $sailsSocket[options.method](url, query).then (function (data) {
        if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
          return null;
        } else {
          if (!options.resultIsArray && data.data instanceof Array) {
            data.data = data.data[0];
            $log.warn(errors[1]);
          }
          // data.data.content = html_beautify(data.data.content);
          if(next) data.data = next(data.data);

          if(callback) callback(null, data.data);
          else return data.data;
        }
      }, function error (resp){
        $log.error(errors[0], resp);
        if(callback) callback(errors[0], resp);
        else return resp;
      });

    }

    return {
      resolve: resolve
    };
  })
;