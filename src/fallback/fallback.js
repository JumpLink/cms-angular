angular.module('jumplink.cms.fallback', [
])
.service('FallbackService', function ($window, $location, $log) {

  var go = function(path) {
    var protocol = $location.protocol();
    var host = $location.host();
    if(!angular.isString(path)) {
      path = "/fallback";
    } else {
      if(path.charAt(0) !== '/') {
        path = '/'+path;
      }
    }
    var url = protocol+"://"+host+path+"?force=fallback";
    $log.debug("Go to fallback url: "+url);
    // $window.location.href = url;
  };

  return {
    go: go
  };
});