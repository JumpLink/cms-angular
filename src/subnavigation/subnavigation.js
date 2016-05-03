angular.module('jumplink.cms.subnavigation', [
  'mgcrea.ngStrap',
  'sails.io',
  'jumplink.cms.sortable',
  'ngFocus',
  'jumplink.cms.utilities'
])

.service('SubnavigationService', function ($rootScope, $window, $log, $sailsSocket, $filter, $modal, SortableService, UtilityService, focus) {

  var editModal = null;

  var setEditModal = function($scope) {
    editModal = $modal({scope: $scope, title: 'Navigation bearbeiten', templateUrl: '/views/modern/editsubnavigationmodal.jade', show: false});
    return getEditModal();
  };

  var getEditModal = function() {
    return editModal;
  };

  var subscribe = function() {
    // called on content changes
    $sailsSocket.subscribe('navigation', function(msg){
      $log.debug("[SubnavigationService] Navigation event!", msg);
      switch(msg.verb) {
        case 'updated':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Navigation wurde aktualisiert', msg.id);
          }
        break;
      }
    });
  };

  // WORKAROUND wait until image is loaded to fix bs-sidebar
  var resizeOnImagesLoaded = function () {
    angular.element($window).imagesLoaded(function() {
      angular.element($window).triggerHandler('resize');
    });
  };

  var create = function(data) {
    if(!data || !data.target) {
      data.target = "";
    }
    if(!data || !data.name) {
      data.name = "";
    }
    if(!data || !data.page) {
      cb("Page not set.");
    }
    return data;
  };

  var append = function(navs, data, cb) {

    data = create(data);

    // $log.debug("[SubnavigationService] data", data);

    SortableService.append(navs, data, cb);
  };

  var swap = function(navs, index_1, index_2, cb) {
    return SortableService.swap(contents, index_1, index_2, cb);
  };

  var moveForward = function(index, navs, cb) {
    return SortableService.moveForward(index, navs, cb);
  };

  var moveBackward = function(index, navs, cb) {
    return SortableService.moveBackward(index, navs, cb);
  };

  var edit = function(navs, cb) {
    // $log.debug("[SubnavigationService] edit subnavigations", navs);
    editModal.$scope.navs = navs;
    //- Show when some event occurs (use $promise property to ensure the template has been loaded)
    editModal.$promise.then(editModal.show);

    if(angular.isDefined(editModal.$scope.navs) && editModal.$scope.navs.length > 0) {
      var index = Number(editModal.$scope.navs.length-1);
      // $log.debug("[SubnavigationService] focus last subnavigationeditname", index);
      focus('subnavigationeditname'+index);
    }

    editModal.$scope.$on('modal.hide',function(){
      // $log.debug("[SubnavigationService] edit navigation modal closed");
      cb(null, editModal.$scope.navs);
    });
  };

  var removeFromClient = function (navs, index, nav, cb) {
    if(angular.isFunction(cb)) {
      return SortableService.remove(navs, index, nav, cb);
    }
    return SortableService.remove(navs, index, nav);
  };

  var remove = function(navs, index, nav, page, cb) {

    if((angular.isUndefined(nav) || nav === null) && angular.isDefined(index)) {
      nav = navs[index];
    }

    if(angular.isUndefined(index) || index === null) {
      index = navs.indexOf(nav);
    }

    navs = removeFromClient(navs, index, nav);
    // if nav has an id it is saved on database, if not, not
    if(nav.id) {
      $log.debug("[SubnavigationService] remove from server, too" ,nav);
      $sailsSocket.delete('/navigation/'+nav.id+"?page="+page, {id:nav.id, page: page}).success(function(data, status, headers, config) {
        if(angular.isFunction(cb)) {
          return cb(null, navs);
        }
      }).
      error(function(data, status, headers, config) {
        //$log.error (errors[0], data);
        if(angular.isFunction(cb)) {
          return cb(data);
        }
      });
    }
  };

  var removeByTarget = function (navs, target, page, cb) {
    $log.debug("[SubnavigationService] remove subnavigation by target "+target);
    var index = UtilityService.findKeyValue(navs, 'target', target);
    if(index > -1) {
      $log.debug("[SubnavigationService] subnavigation found "+index);
      remove(navs, index, null, page, cb);
    } else {
      if(angular.isFunction(cb)) {
        cb("Subnavigation not found");
      }
    }
  };

  var fix = function(fixed, object, index, cb) {
    if(angular.isDefined(object.name) && angular.isString(object.name) && object.name !== "") {
      fixed.push(object);
    } else {
      $log.warn("Name not set, remove Subnavigation");
    }
    if(angular.isFunction(cb)) {
      return cb(null, fixed);
    }
    return fixed;
  };

  var fixEach = function(objects, cb) {
    var fixed = [];
    for (var i = objects.length - 1; i >= 0; i--) {
      fixed = fix(fixed, objects[i], i);
    }
    if(angular.isFunction(cb)) {
      return cb(null, fixed);
    }
    return fixed;
  };

  var save = function(navs, page, cb) {
    fixEach(navs, function(err, navs) {
      $sailsSocket.put('/navigation/replaceall', {navs: navs, page: page}).success(function(data, status, headers, config) {
        if(data !== null && typeof(data) !== "undefined") {
          // WORKAROUND until socket event works
          navs = $filter('orderBy')(data, 'position');
          if(angular.isFunction(cb)) {
            cb(null, navs);
          }
        } else {
          var err = 'Navigation konnte nicht gespeichert werden';
          $rootScope.pop('error', err, "");
          if(angular.isFunction(cb)) {
            cb(err, navs);
          } 
        }
      });
    });
  };

  var resolve = function(page) {
    var statename = 'layout.gallery';
    return $sailsSocket.get('/navigation?page='+page, {page: page}).then (function (data) {
      if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
        $log.warn("Warn: On trying to resolve "+page+" navs!", "Not found, navigation is empty!");
        return null;
      }
      data.data = $filter('orderBy')(data.data, 'position');
      $log.debug("[SubnavigationService]", data);
      return data.data;
    }, function error (resp){
      $log.error("[SubnavigationService] Error: On trying to resolve "+page+" navs!", resp);
    });
  };

  return {
    resizeOnImagesLoaded: resizeOnImagesLoaded,
    subscribe: subscribe,
    setEditModal: setEditModal,
    getEditModal: getEditModal,
    create: create,
    append: append,
    add: append,
    swap: swap,
    moveForward: moveForward,
    moveBackward: moveBackward,
    edit: edit,
    removeFromClient: removeFromClient,
    remove: remove,
    removeByTarget: removeByTarget,
    save: save,
    resolve: resolve
  };
})

.directive('jlSubnavigation', function ($compile, $window, SubnavigationService, HistoryService) {

  return {
    restrict: 'E',
    templateUrl: '/views/modern/subnavigation.bootstrap.jade',
    scope: {
      authenticated : "=",
      navs: "=",
      afterSave: "=?",
      afterRemove: "=?",
      afterEdit: "=?",
      afterAdd: "=?",
      logger: "=",
      page: "=?"

    },
    link: function ($scope, $element, $attrs) {
    },
    controller: function ($rootScope, $scope, ContentService, $log, $state) {

      SubnavigationService.setEditModal($scope);
      $scope.goTo = HistoryService.goToHashPosition;
      SubnavigationService.subscribe();
      // SubnavigationService.resizeOnImagesLoaded();

      if(angular.isUndefined($scope.page)) {
        $scope.page = $state.current.name;
      }

      if(angular.isUndefined($scope.afterSave)) {
        $scope.afterSave = function (err, result) {
          if(err) {
            return $scope.logger('error', "Navigation wurde nicht gespeichert!", err);
          }
          $scope.logger('success', "Navigation gespeichert!", result.title);
        };
      }

      if(angular.isUndefined($scope.afterRemove)) {
        $scope.afterRemove = function (err, result) {
          if(err) {
            return $scope.logger('error', "Navigation wurde nicht entfernt!", err);
          }
          $scope.logger('success', "Navigation entfernt!", result.title);
        };
      }

      if(angular.isUndefined($scope.afterEdit)) {
        $scope.afterEdit = function (err, result) {
          if(err) {
            return $scope.logger('error', "Navigation wurde nicht bearbeitet!", err);
          }
          $scope.logger('success', "Navigation bearbeitet!", result.title);
        };
      }

      if(angular.isUndefined($scope.afterAdd)) {
        $scope.afterAdd = function (err, result) {
          if(err) {
            return $scope.logger('error', "Navigation wurde nicht hinzugefügt!", err);
          }
          $scope.logger('success', "Navigation hinzugefügt!", result.title);
        };
      }

      $scope.add = function() {
        if(!$scope.authenticated) {
          return false;
        }
        SubnavigationService.add($scope.navs, {page:page}, $scope.afterAdd);
      };
      $scope.addNav = $scope.add; // alias

      $scope.moveForward = function(index, nav) {
        SortableService.moveForward(index, $scope.navs, function(err, navs) {
          if(err) {
            $log.error("Error: On move subnavigation forward!", err);
            return err;
          }
          $scope.navs = navs;
        });
      };
      $scope.moveForwardNav = $scope.moveForward; // alias

      $scope.moveBackward = function(index, nav) {
        SortableService.moveBackward(index, $scope.navs, function(err, navs) {
          if(err) {
            $log.error("Error: On move content backward!", err);
            return err;
          }
          $scope.navs = navs;
        });
      };
      $scope.moveBackwardNav = $scope.moveBackward; // alias

      $scope.edit = function(navs) {
        if(!$scope.authenticated) {
          return false;
        }
        SubnavigationService.edit(navs, $scope.afterEdit);
      };
      $scope.editNavs = $scope.edit; // alias

      $scope.remove = function(index, nav) {
        if(!$scope.authenticated) {
          return false;
        }
        SubnavigationService.remove($scope.navs, index, nav, page, $scope.afterRemove);
      };
      $scope.removeNav = remove; // alias

      $scope.save = function () {
        SubnavigationService.save($scope.navs, page, $scope.afterSave);
      };


      // TODO move to own drag and drops sortable navigation directive 
      $scope.onDragOnComplete = function(index, nav, evt) {
        if(nav === null) {
          $log.debug("*click*", index);
        }
        $log.debug("onDragOnComplete, nav:", nav, "index", index);
      };
      $scope.onDragOnNavComplete = $scope.onDragOnComplete; // alias

      $scope.onDropOnComplete = function(dropnavindex, dragnav, event) {
        SortableService.dropMove($scope.navs, dropnavindex, dragnav, event, function(err, navs) {
          $scope.navs = navs;
        });
      };
      $scope.onDropOnNavComplete = $scope.onDropOnComplete; // alias

      $scope.onDropOnAreaComplete = function(nav, evt) {
        var index = $scope.navs.indexOf(nav);
      };

    }
  };
});
