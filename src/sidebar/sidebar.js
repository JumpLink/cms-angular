angular.module('jumplink.cms.sidebar', [
    'mgcrea.ngStrap.aside',
  ])

  .directive('jlsidebar', function ($compile, $window) {

    return {
      restrict: 'E',
      templateUrl: '/views/modern/sidebar.jade',
      scope: {
        routes: "=",
        title: "=" 
      },
      link: function ($scope, $element, $attrs) {
        
      }
    };
  })

;