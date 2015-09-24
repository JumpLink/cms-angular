angular.module('jumplink.cms.toolbar', [
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
      },
      link: function ($scope, $element, $attrs) {
        
      }
    };
  })
;