angular.module('jumplink.cms.session', [
    'sails.io',
    'jumplink.cms.sails'
  ])

  .service('SessionService', function ($rootScope, JLSailsService, $sailsSocket, $q, $log) {

    var create = function(user, callback) {
      $log.debug("[SessionService.create]", user);
      var options = {
        method: 'post',
        resultIsArray: false
      };
      return JLSailsService.resolve('/session/create', user, options, callback);
    };

    var destroy = function(user, callback) {
      $log.debug("[SessionService.destroy]", user);
      var options = {
        method: 'post',
        resultIsArray: false
      };
      return JLSailsService.resolve('/session/destroy', user, options, callback);
    };

    // Used for routes you can only visit if you are signed in, throws an error message if your are not authenticated
    var authenticated = function () {
      $log.log("[SessionService.authenticated] authenticated");
      var deferred = $q.defer();
      $sailsSocket.get('/session/authenticated').then (function (data) {
        if (data.data) {
          $log.log("is authenticated", data);
          return deferred.resolve(data.data);
        } else {
          $log.log("is not authenticated", data);
          return deferred.reject('Not logged in');
        }
      });
      return deferred.promise;
    };

    // Used if you need authentication conditions
    var isAuthenticated = function () {
      $log.log("[SessionService.isauthenticated] authenticated");
      var deferred = $q.defer();
      return $sailsSocket.get('/session/authenticated').then (function (data) {
        return data.data;
      });
    };

    return {
      create: create,
      destroy: destroy,
      authenticated: authenticated,
      isAuthenticated: isAuthenticated
    };
  })
;