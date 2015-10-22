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
})
.directive('jlContentBlocks', function ($compile, $window, mediumOptions, ContentMediumService) {

  return {
    restrict: 'E',
    templateUrl: '/views/modern/contentBlocks.jade',
    scope: {
      authenticated : "=",
      html: "=",
      contents: "=",
      afterRefresh: "=?",
      afterSave: "=?",
      afterRemove: "=?",
      afterEdit: "=?",
      afterAdd: "=?",
      logger: "=",
      page: "=?",
      mediumOptions: "=?",
      mediumBindOptions: "=?",

    },
    link: function ($scope, $element, $attrs) {
    },
    controller: function ($rootScope, $scope, ContentService, $log, $state) {

      ContentService.setEditModal($scope);

      if(angular.isUndefined($scope.page)) {
        $scope.page = $state.current.name;
      }

      if(angular.isUndefined($scope.afterRefresh)) {
        $scope.afterRefresh = function (err, result) {
          if(err) {
            return $scope.logger('error', "Inhaltsblöcke konnten nicht erneuert werden!", err);
          }
          $scope.logger('success', "Inhaltsblöcke erneuert!", "");
        };
      }

      if(angular.isUndefined($scope.afterSave)) {
        $scope.afterSave = function (err, result) {
          if(err) {
            return $scope.logger('error', "Inhaltsblock konnte nicht gespeichert werden!", err);
          }
          $scope.logger('success', "Inhaltsblock gespeichert!", result.title);
        };
      }

      if(angular.isUndefined($scope.afterRemove)) {
        $scope.afterRemove = function (err, result) {
          if(err) {
            return $scope.logger('error', "Inhaltsblock konnte nicht entfernt werden!", err);
          }
          $scope.logger('success', "Inhaltsblock entfernt!", result.title);
        };
      }

      if(angular.isUndefined($scope.afterEdit)) {
        $scope.afterEdit = function (err, result) {
          if(err) {
            return $scope.logger('error', "Inhaltsblock konnte nicht bearbeitet werden!", err);
          }
          $scope.logger('success', "Inhaltsblock bearbeitet!", result.title);
        };
      }

      if(angular.isUndefined($scope.afterAdd)) {
        $scope.afterAdd = function (err, result) {
          if(err) {
            return $scope.logger('error', "Inhaltsblock konnte nicht hinzugefügt werden!", err);
          }
          $scope.logger('success', "Inhaltsblock hinzugefügt!", result.title);
        };
      }

      $scope.add = function() {
        var errors = [
          "Error: Konnte Inhaltsblock nicht erzeugen",
          "Error: Konnte Inhaltsblock nicht hinzufügen",
        ];

        var successes = [
          "Neuen Inhaltsblock erfolgreich hinzugefügt",
          "Neue Subnavigation erfolgreich hinzugefügt",
          "Neuen Block erfolgreich hinzugefügt",
        ];

        if(!$scope.authenticated) {
          return false;
        }
        // generates new content and opens the modal
        ContentService.createEdit($scope.contents, $scope.page, function(err, content) {
          if(err) {
            return $scope.afterAdd(err);
          }
          ContentService.append($scope.contents, content, $scope.afterAdd);  
        });
      };

      $scope.moveForward = function(index, content) {
        if(!$scope.authenticated) {
          return false;
        }       
        SortableService.moveForward(index, $scope.contents, function(err, contents) {
          if(err) {
            $log.error("Error: On move content forward!", err);
            return err;
          }
          $scope.contents = contents;
        });
      };

      $scope.moveBackward = function(index, content) {
        if(!$scope.authenticated) {
          return false;
        }
        SortableService.moveBackward(index, $scope.contents, function(err, contents) {
          if(err) {
            $log.error("Error: On move content backward!", err);
            return err;
          }
          $scope.contents = contents;
        });
      };

      $scope.edit = function(index, content) {
        if(!$scope.authenticated) {
          return false;
        }
        ContentService.edit(content, $scope.afterEdit);
      };

      $scope.remove = function(index, content) {
        if(!$scope.authenticated) {
          return false;
        }
        ContentService.remove($scope.contents, index, content, $scope.page, $scope.afterRemove);
      };

      $scope.refresh = function() {
        ContentService.refresh($scope.contents, $scope.afterRefresh);
      };

      $scope.toggleHtml = function(index, content) {
        content.html = content.html !== true;
      };

      $scope.save = function() {
        if(!$scope.authenticated) {
          return false;
        }
        ContentService.save($scope.contents, $scope.page, $scope.afterSave);
      };

    }
  };
});