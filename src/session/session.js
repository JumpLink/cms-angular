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

  /**
   * Check if user is authentication in current cms session
   * Used if you need authentication conditions
   */
  var isAuthenticated = function (callback) {
    $log.log("[SessionService.isauthenticated]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/authenticated').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Used for routes you can only visit if you are signed in, throws an error message if your are not authenticated
   */
  var needToBeAuthenticated = function () {
    $log.log("[SessionService.needToBeAuthenticated] authenticated");
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

  /**
   * Check if authentifcated user is blogger or better
   */
  var bloggerOrBetter = function (callback) {
    $log.log("[SessionService.bloggerOrBetter]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/bloggerOrBetter').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Check if cms is in developer mode or session user is better than that
   */
  var developerOrBetter = function (callback) {
    $log.log("[SessionService.developerOrBetter]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/developerOrBetter').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Check if authentifcated user is siteadmin or better
   */
  var siteadminOrBetter = function (callback) {
    $log.log("[SessionService.siteadminOrBetter]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/siteadminOrBetter').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Check if authentifcated user is superadmin
   */
  var superadmin = function (callback) {
    $log.log("[SessionService.superadmin]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/superadmin').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Check if authentifcated user is an employee
   */
  var employee = function (callback) {
    $log.log("[SessionService.employee]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/employee').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Check if authentifcated user is an employee or better
   */
  var employeeOrBetter = function (callback) {
    $log.log("[SessionService.employee]");
    var deferred = $q.defer();
    return $sailsSocket.get('/session/employeeOrBetter').then (function (data) {
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    });
  };

  /**
   * Used for routes you can only visit if you are signed in and user employee or better, throws an error message if your are not employee or better
   */
  var needToBeEmployeeOrBetter = function () {
    $log.log("[SessionService.authenticated] authenticated");
    var deferred = $q.defer();
    $sailsSocket.get('/session/employeeOrBetter').then (function (data) {
      if (data.data) {
        $log.log("is employeeOrBetter", data);
        return deferred.resolve(data.data);
      } else {
        $log.log("is not employeeOrBetter", data);
        return deferred.reject('Not logged in');
      }
    });
    return deferred.promise;
  };

  return {
    create: create,
    destroy: destroy,
    authenticated: needToBeAuthenticated, //alias TODO remove
    needToBeAuthenticated: needToBeAuthenticated,
    isAuthenticated: isAuthenticated, // TODO rename to authenticated
    bloggerOrBetter: bloggerOrBetter,
    developerOrBetter: developerOrBetter,
    siteadminOrBetter: siteadminOrBetter,
    superadmin: superadmin,
    employee: employee,
    employeeOrBetter: employeeOrBetter,
    needToBeEmployeeOrBetter: needToBeEmployeeOrBetter,
  };
});