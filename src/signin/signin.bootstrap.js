angular.module('jumplink.cms.bootstrap.signin', [
    'mgcrea.ngStrap',
    'jumplink.cms.signin'
  ])

  .service('SigninBootstrapService', function ($rootScope, SigninService, $log, $modal) {
    var siginWithModal = function(title, goBackAfterSignin, extendRoles, scope, callback) {
      $log.debug("[SigninBootstrapService.siginWithModal]", title, goBackAfterSignin, extendRoles);

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

      var signinModal = $modal({title: title, templateUrl: '/views/modern/signin.bootstrap.modal.jade', show: false});
      signinModal.$scope.aborted = false;
      signinModal.$scope.result = null;
      signinModal.$scope.user = {
        email: "",
        password: ""
      };
      // signinModal.$scope.goBackAfterSignin = goBackAfterSignin === true;

      signinModal.$scope.abort = function (user) {
        signinModal.$scope.aborted = true;
      };

      signinModal.$scope.signin = function (user) {
        $log.debug("[SigninBootstrapService.siginWithModal.signin]", user);
        SigninService.signin(user, goBackAfterSignin, extendRoles, scope, function (error, result) {
          if(error) {
            signinModal.$scope.error = error;
            return signinModal.$scope.error;
          }
          signinModal.$scope.result = result;
          // $rootScope.
          $log.debug(result);
        });
      };

      signinModal.$scope.$on('modal.hide',function(){
        $log.debug("signin modal closed");
        if(angular.isFunction(callback)) {
          callback(signinModal.$scope.error, signinModal.$scope.result, signinModal.$scope.user);
        }
      });

      signinModal.$promise.then(signinModal.show);
    };

    return {
      siginWithModal: siginWithModal
    };
  })
;