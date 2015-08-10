angular.module('jumplink.cms.toolbar', [
  ])

  .directive('jltoolbar', function ($compile, $window) {

    return {
      restrict: 'E',
      templateUrl: '/views/modern/toolbar.jade',
      scope: {
        routes: "=",
        title: "=",
        shorttitle: "="
      },
      link: function ($scope, $element, $attrs) {
        
      }
    };
  })

;