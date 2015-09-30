angular.module('jumplink.cms.signin', [
  'jumplink.cms.session',
  'jumplink.cms.history',
  'ngAsync'
])
.service('SigninService', function (SessionService, $log, HistoryService, $async) {


  var getRoles = function (scope, callback) {
    $async.parallel({
      authenticated: function(callback) {
        SessionService.isAuthenticated(callback);
      },
      bloggerOrBetter: function(callback) {
        SessionService.bloggerOrBetter(callback);
      },
      siteadminOrBetter: function(callback) {
        SessionService.siteadminOrBetter(callback);
      },
      employeeOrBetter: function(callback) {
        SessionService.employeeOrBetter(callback);
      }
    },
    callback);
  };

  var signin = function (user, goBackAfterSignin, extendRoles, scope, callback) {
    if(angular.isFunction(goBackAfterSignin) && !angular.isFunction(callback)) {
      callback = goBackAfterSignin;
      goBackAfterSignin = false;
    }

    if(angular.isFunction(extendRoles) && !angular.isFunction(callback)) {
      callback = extendRoles;
      extendRoles = false;
    }

    if(angular.isFunction(scope) && !angular.isFunction(callback)) {
      callback = scope;
      scope = null;
    }

    $log.debug("[SigninService.signin]", user);
    // $scope.user.role = 'superadmin';
    SessionService.create(user, function (err, result) {
      if(err) {
        return callback(err);
      }
      if(!result.authenticated) {
        return null;
      }
      if(extendRoles === true) {
        SessionService.getAllPolicies(function (err, results) {
          if(err) {
            return callback(err);
          }
          $log.debug("scope before extend", scope);
          angular.extend(scope, results);
          $log.debug("scope after extend", scope);
          if(goBackAfterSignin === true) {
            HistoryService.back();
          }
        });
      }
      if(goBackAfterSignin === true) {
        HistoryService.back();
      }

      $log.debug("[SigninService.signin]", user);
      $log.debug("[SigninService.signin] err result", err, result);
      return callback(null, result);
    });
  };
  return {
    signin: signin
  };
});