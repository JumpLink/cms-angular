angular.module('jumplink.cms.toolbar', [
  'FBAngular'
])
.directive('jlToolbar', function ($compile, $window) {

  return {
    restrict: 'E',
    templateUrl: '/views/modern/toolbar.jade',
    scope: {
      routes: "=",
      title: "=",
      shorttitle: "=",
      fluid: "=",
      position: "=",
      filter: "=", 
    },
    link: function ($scope, $element, $attrs) {

    },
    controller: function ($scope, $log, Fullscreen) {
      $scope.fullscreenIsSupported = Fullscreen.isSupported();
      $scope.isFullscreen = false;
      $log.debug("[jumplink.cms.toolbar.jlToolbar.controller]", $scope);
      Fullscreen.$on('FBFullscreen.change', function(evt, isFullscreenEnabled){
        $scope.isFullscreen = isFullscreenEnabled === true;
        // $scope.$apply();
      });

      $scope.toggleFullscreen = function () {
        if (Fullscreen.isEnabled()) {
          Fullscreen.cancel();
        } else {
          Fullscreen.all();
        }
      };
    }
  };
});