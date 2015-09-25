angular.module('ngHistory', [
])
.service('HistoryService', function ($window, $location, $anchorScroll, $timeout, $log) {
  var back = function () {
    $window.history.back();
  };

  var goToHashPosition = function (hash) {
    // $log.debug("go to hash", hash);
    $location.hash(hash);
    $anchorScroll.yOffset = 60;
    $anchorScroll();
  };

  var autoScroll = function () {
    var hash = $location.hash();
    // $log.debug("hash", hash);
    if(hash) {
      // WORKAROUND
      $timeout(function(){ goToHashPosition(hash); }, 1000); // TODO smooth?
    } else {
      $anchorScroll();
    }    
  };

  return {
    back: back,
    goToHashPosition: goToHashPosition,
    autoScroll: autoScroll
  };
});