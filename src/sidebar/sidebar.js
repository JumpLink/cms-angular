angular.module('jumplink.cms.sidebar', [
    'mgcrea.ngStrap.aside',
    'mgcrea.ngStrap.navbar',
  ])

  .directive('sidebar', function ($compile, $window) {

    return {
      restrict: 'E',
      templateUrl: '/views/modern/sidebar.jade',
      scope: {routes : "="},
      link: function ($scope, $element, $attrs) {
        
      }
    };
  })

;