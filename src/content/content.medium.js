angular.module('jumplink.cms.content.medium', [
  'jumplink.cms.content',
  'angular-medium-editor',
])
.value('mediumOptions', {
  buttonLabels: "fontawesome",
  toolbar: {
    buttons: ["bold", "italic", "underline", "anchor", "h2", "h3", "h4", "quote", "orderedlist", "unorderedlist"]
  }
})
.service('ContentMediumService', function ($rootScope, $log, $sailsSocket, $filter, $modal, SortableService, UtilityService, focus) {
  // TODO
  var Imager = function () {
    this.button = document.createElement('button');
    this.button.className = 'medium-editor-action';
    this.button.innerText = 'Image';
    this.button.innerHTML = '<i class="fa fa-picture-o"></i>';
    this.button.onclick = this.onClick.bind(this);
    // this.classApplier = rangy.createCssClassApplier('highlight', {
    //   elementTagName: 'mark',
    //   normalize: true
    // });
  };
  Imager.prototype.onClick = function() {
    this.classApplier.toggleSelection();
  };
  Imager.prototype.getButton = function() {
    return this.button;
  };
  Imager.prototype.checkState = function(node) {
    if (node.tagName === 'MARK') {
      this.button.classList.add('medium-editor-button-active');
    }
  };

  return {
    Imager: Imager
  };
})
.directive('jlContent', function ($compile, $window, mediumOptions, ContentMediumService) {

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