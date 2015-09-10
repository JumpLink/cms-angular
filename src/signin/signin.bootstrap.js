angular.module('jumplink.cms.bootstrap.sigin', [
    'mgcrea.ngStrap',
    'jumplink.cms.session'
  ])

  .service('SigninBootstrapService', function ($rootScope, SessionService, $log, $modal) {


    var siginWithModal = function(title, callback) {
      var signinModal = $modal({title: title, templateUrl: '/views/modern/signin.bootstrap.modal.jade', show: false});;
      signinModal.$scope.aborted = false;
      signinModal.$scope.result = null;
      signinModal.$scope.user = {
        email: "",
        password: ""
      };

      signinModal.$scope.abort = function (user) {
        signinModal.$scope.aborted = true;
      }

      signinModal.$scope.signin = function (user) {
        $log.debug("[SigninBootstrapService.siginWithModal.signin]", user);
        SessionService.create(user, function (error, result) {
          if(error) return signinModal.$scope.error = error;
          signinModal.$scope.result = result;
          // $rootScope.
          $log.debug(result);
        });
      }

      signinModal.$scope.$on('modal.hide',function(){
        $log.debug("signin modal closed");
        if(callback) callback(signinModal.$scope.error, signinModal.$scope.result, signinModal.$scope.user);
      });

      signinModal.$promise.then(signinModal.show);
    };

    return {
      siginWithModal: siginWithModal
    };
  })
;