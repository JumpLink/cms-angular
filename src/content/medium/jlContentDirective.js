angular.module('jumplink.cms.content.medium').directive('jlContent', function ($compile, $window, mediumOptions, ContentMediumService) {

  return {
    restrict: 'E',
    templateUrl: '/views/modern/content.jade',
    scope: {
      authenticated : "=",
      html: "=",
      content: "=?",
      mediumOptions: "=?",
      mediumBindOptions: "=?",
    },
    link: function ($scope, $element, $attrs) {
      if(angular.isUndefined($scope.mediumOptions)) {
        $scope.mediumOptions = mediumOptions;
      }
      if(angular.isUndefined($scope.mediumBindOptions)) {
        $scope.mediumBindOptions = {
          extensions: {
            'image': new ContentMediumService.Imager()
          }
        };
      }
    }
  };
});