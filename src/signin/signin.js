angular.module('jumplink.cms.signin', [
  'jumplink.cms.session',
  'jumplink.cms.history'
])
.service('SigninService', function (SessionService, $log, HistoryService) {
  var signin = function (user, goBackAfterSignin, callback) {
    $log.debug("[SigninService.signin]", user);
    // $scope.user.role = 'superadmin';
    SessionService.create(user, function (err, result) {
      if(err) {
        return callback(err);
      }
      if(goBackAfterSignin) {
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