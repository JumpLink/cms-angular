angular.module('jumplink.cms.sidebar', [
    'mgcrea.ngStrap.aside',
  ])

  .directive('jlSidebar', function ($compile, $window) {

    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      templateUrl: '/views/modern/sidebar.jade',
      scope: {
        routes: "=",
        title: "=" 
      },
      link: function ($scope, $element, $attrs) {
        
      }
    };
  });