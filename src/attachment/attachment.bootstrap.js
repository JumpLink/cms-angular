angular.module('jumplink.cms.bootstrap.attachment', [
  'jumplink.cms.attachment',
])
.directive('jlAttachmentBootstrap', function ($compile, $window, mediumOptions, AttachmentService) {

  return {
    restrict: 'E',
    templateUrl: '/views/modern/attachment.bootstrap.jade',
    scope: {
      attachment: "=",
      attachmentIndex: "=",
      parent: "=",
      path: "=",
      authenticated: "=",
      destroy: "=",
      centerImage: "="
    },
    link: function ($scope, $element, $attrs) {
      console.log("[jlAttachmentBootstrap.link]", $scope);
    }
  };
});