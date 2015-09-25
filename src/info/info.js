angular.module('jumplink.cms.info', [
  'sails.io',
])

.service('CmsService', function ($log, $sailsSocket) {

  var info = function(url, callback) {
    var errors = [
      "[CmsService] Error: On trying to get cms info, url: "+url,
      "[CmsService] Error: Result is null, url: "+url
    ];
    var warns = [
      "[CmsService] Warn: Request has more than one results, url: "+url
    ];
    return $sailsSocket.get(url).then (function (data) {
      if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
        if(angular.isFunction(callback)) {
          return callback(errors[1]);
        }
        return null;
      }
      if (data.data instanceof Array) {
        data.data = data.data[0];
        $log.warn(warns[0]);
      }
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    }, function error (resp){
      $log.error(errors[0], resp);
      if(angular.isFunction(callback)) {
        return callback(errors[0], resp);
      }
      return resp;
    });
  };

  // CMS Info for Users
  var infoUser = function(callback) {
    return info('/cms/infouser', callback);
  };

  var infoAdmin = function(callback) {
    return info('/cms/infoadmin', callback);
  };

  return {
    infoUser: infoUser,
    infoAdmin: infoAdmin
  };
});