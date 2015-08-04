angular.module('jumplink.cms.session', [
    'sails.io',
    'jumplink.cms.sails'
  ])

  .service('SessionService', function ($rootScope, JLSailsService, $log) {

    var create = function(user, callback) {
      $log.debug("[SessionService.create]", user);

      var options = {
        method: 'post',
        resultIsArray: false
      }

      return JLSailsService.resolve('/session/create', user, options, callback);

    }

    return {
      create: create
    };
  })
;