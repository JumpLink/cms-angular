angular.module('jumplink.cms.content.medium').directive('jlContentBlocks', function ($compile, $window, mediumOptions, ContentMediumService, SubnavigationService, HistoryService) {

  return {
    restrict: 'E',
    templateUrl: '/views/modern/contentBlocks.jade',
    scope: {
      authenticated : "=",
      html: "=",
      contents: "=",
      navs: "=?",
      afterRefresh: "=?",
      afterSave: "=?",
      afterRemove: "=?",
      afterEdit: "=?",
      afterAdd: "=?",
      subnavigation: "=?",
      afterSaveNav: "=?",
      afterRemoveNav: "=?",
      afterEditNav: "=?",
      afterAddNav: "=?",
      logger: "=",
      page: "=?",
      mediumOptions: "=?",
      mediumBindOptions: "=?",

    },
    link: function ($scope, $element, $attrs) {
    },
    controller: function ($rootScope, $scope, ContentService, $log, $state) {

      ContentService.setEditModal($scope);
      SubnavigationService.setEditModal($scope);
      $scope.goTo = HistoryService.goToHashPosition;
      ContentService.subscribe();
      SubnavigationService.subscribe();
      // SubnavigationService.resizeOnImagesLoaded();

      if(angular.isUndefined($scope.page)) {
        $scope.page = $state.current.name;
      }

      if(angular.isUndefined($scope.subnavigation)) {
        $scope.subnavigation = false;
      }

      if(angular.isUndefined($scope.afterRefresh)) {
        $scope.afterRefresh = function (err, result) {
          if(err) {
            return $scope.logger('error', "Inhaltsblock wurde nicht erneuert!", err);
          }
          $scope.logger('success', "Inhaltsblock erneuert!", "");
        };
      }

      if(angular.isUndefined($scope.afterSave)) {
        $scope.afterSave = function (err, result) {
          if(err) {
            return $scope.logger('error', "Inhaltsblock wurde nicht gespeichert!", err);
          }
          $scope.logger('success', "Inhaltsblock gespeichert!", result.title);
        };
      }

      if(angular.isUndefined($scope.afterRemove)) {
        $scope.afterRemove = function (err, result) {
          if(err) {
            return $scope.logger('error', "Inhaltsblock wurde nicht entfernt!", err);
          }
          $scope.logger('success', "Inhaltsblock entfernt!", result.title);
        };
      }

      if(angular.isUndefined($scope.afterEdit)) {
        $scope.afterEdit = function (err, result) {
          if(err) {
            return $scope.logger('error', "Inhaltsblock wurde nicht bearbeitet!", err);
          }
          $scope.logger('success', "Inhaltsblock bearbeitet!", result.title);
        };
      }

      if(angular.isUndefined($scope.afterAdd)) {
        $scope.afterAdd = function (err, result) {
          if(err) {
            return $scope.logger('error', "Inhaltsblock wurde nicht hinzugefügt!", err);
          }
          $scope.logger('success', "Inhaltsblock hinzugefügt!", result.title);
        };
      }

      if(angular.isUndefined($scope.afterSaveNav)) {
        $scope.afterSaveNav = function (err, result) {
          if(err) {
            return $scope.logger('error', "Navigation wurde nicht gespeichert!", err);
          }
          $scope.logger('success', "Navigation gespeichert!", result.title);
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
        if($scope.subnavigation) {
          SubnavigationService.save($scope.navs, $scope.page, $scope.afterSaveNav);
        }
      };
    }
  };
});