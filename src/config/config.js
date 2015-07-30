angular.module('jumplink.cms.config', [
    'sails.io',
  ])

  .service('ConfigService', function ($sailsSocket, $filter, $log) {


    var resolve = function(page) {
      return $sailsSocket.get('/config/find').then (function (data) {
        return data.data;
      }, function error (resp){
        $log.error("Error on resolve "+page, resp);
      });
    };

    return {
      resolve: resolve
    };
  });

;