angular.module('jumplink.cms.history', [
  'ui.router',
])
/**
 * @see: https://github.com/angular-ui/ui-router/issues/92
 */
.service('HistoryService', function ($window, $location, $state, $anchorScroll, $timeout, $log) {
  var history = [];
  var push = function(state, params) {
    history.push({ state: state, params: params });
  };

  var all = function() {
    return history;
  };

  var go = function(step) {
    $log.debug('[jumplink.cms.history.HistoryService], history.length', history.length, 'step', step, 'history.length + step =', history.length + step);
    // If the past has not been saved as far as the steps that we want to go back, then go to the beginning of time
    if(history.length + step <= 0) {
     return $location.path('/');
    }
    // TODOlocation    // (1) Determine # of states in stack with URLs, attempt to
    //    shell out to $window.history when possible
    // (2) Attempt to figure out some algorthim for reversing that,
    //     so you can also go forward
    var prev = this.previous(step || -1);
    return $state.go(prev.state, prev.params);
  };

  var previous = function(step) {
    return history[history.length - Math.abs(step || 1)];
  };

  var back = function() {
    return this.go(-1);
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
    push: push,
    all: all,
    go: go,
    previous: previous,
    back: back,
    goToHashPosition: goToHashPosition,
    autoScroll: autoScroll
  };

})
.run(function(HistoryService, $state, $rootScope) {

  $rootScope.$on("$stateChangeSuccess", function(event, to, toParams, from, fromParams) {
    if (!from.abstract) {
      HistoryService.push(from, fromParams);
    }
  });
  console.log(HistoryService);
  HistoryService.push($state.current, $state.params);

});