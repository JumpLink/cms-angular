angular.module('jumplink.cms.browser', [])
.directive('jlBrowser', function ($compile, $window) {

  return {
    restrict: 'E',
    templateUrl: '/views/modern/browser.bootstrap.jade',
    scope: {
      force: "="
    },
    link: function ($scope, $element, $attrs) {
      
    }
  };
});