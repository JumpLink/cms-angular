angular.module('jumplink.cms.bootstrap.uploader', [
  'angularFileUpload',
])
.directive('jlUploader', function () {

  return {
    restrict: 'E',
    templateUrl: '/views/modern/uploader.bootstrap.jade',
    scope: {
      label : "@",
      labelFiles : "@",
      uploadOptions: "=",
      fileOptions: "=",
      onCompleteAll: "=",
      onCompleteItem: "=",
    },
    link: function ($scope, $element, $attrs) {
    },
    controller: function ($rootScope, $scope, $log, FileUploader) {
      $scope.files = [];
      if(angular.isUndefined($scope.fileOptions)) {
        $scope.fileOptions = {};
      }
      $scope.uploader = new FileUploader($scope.uploadOptions);
      $log.debug("[jlUploader] uploadOptions", $scope.uploadOptions);
      $log.debug("[jlUploader] uploader", $scope.uploader);
      $log.debug("[jlUploader] onCompleteAll", $scope.onCompleteAll);
      $log.debug("[jlUploader] onCompleteItem", $scope.onCompleteItem);

      $scope.uploader.onCompleteItem = function(fileItem, response, status, headers) {
        $log.debug("[jlUploader.onCompleteItem] status", status);
        for (var i = 0; i < response.files.length; i++) {
          $log.debug("[jlUploader.onCompleteItem] response.files[i]", response.files[i]);
        }
        $scope.files = $scope.files.concat(response.files);
        if(angular.isFunction($scope.onCompleteItem)) {
          $scope.onCompleteItem(null, $scope.files); // TODO detect error
        }
      };
      
      $scope.uploader.onCompleteAll = function() {
        $log.debug("[jlUploader.onCompleteAll]");
        if(angular.isFunction($scope.onCompleteAll)) {
          $scope.onCompleteAll(null, $scope.files);
        }
      };

      $scope.upload = function(fileItem) {
        fileItem.upload();
      };

      $scope.uploader.onProgressItem = function(fileItem, progress) {
        $log.debug('[jlUploader.onProgressItem]', fileItem, progress);
      };
      

    }
  };
});