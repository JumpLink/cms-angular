// https://github.com/rndme/download
angular.module('ngDownload', [])
.service('$download', function ($log) { 
  if(angular.isDefined(download)) {
    return download;
  } else {
    $log.error("[ngDownload] download is not defined, please install it from https://github.com/rndme/download");
    return null;
  }
  
});