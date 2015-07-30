angular.module('jumplink.cms.info', [
    'sails.io',
  ])

  .service('CmsService', function ($log, $sailsSocket) {

    var info = function(url, cb) {
      var errors = [
        "[CmsService] Error: On trying to get cms info, url: "+url,
        "[CmsService] Error: Result is null, url: "+url
      ];
      var warns = [
        "[CmsService] Warn: Request has more than one results, url: "+url
      ]

      return $sailsSocket.get(url).then (function (data) {
        if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
          if(cb) return cb(errors[1]);
          else return null;
        } else {
          if (data.data instanceof Array) {
            data.data = data.data[0];
            $log.warn(warns[0]);
          }
          
          if(cb) return cb(null, data.data);
          else return data.data;
        }
      }, function error (resp){
        $log.error(errors[0], resp);
        if(cb) return cb(errors[0], resp);
        else return resp;
      });
    };

    // CMS Info for Users
    var infoUser = function(cb) {
      return info('/cms/infouser', cb);
    };

    var infoAdmin = function(cb) {
      return info('/cms/infoadmin', cb);
    }

    return {
      infoUser: infoUser,
      infoAdmin: infoAdmin
    };
  })

;