angular.module('jumplink.cms.content', [
    'mgcrea.ngStrap',
    'angular-medium-editor',
    'ui.ace',
    'sails.io',
    'jumplink.cms.sortable',
    'ngFocus'
  ])
  .service('ContentService', function ($rootScope, $log, $sailsSocket, $filter, $modal, SortableService, UtilityService, focus) {

    var showHtml = false;
    var editModal = null;

    var getShowHtml = function() {
      return showHtml;
    };

    var setEditModal = function($scope) {
      editModal = $modal({title: 'Inhaltsblock bearbeiten', templateUrl: '/views/modern/contentmodal.jade', show: false});
      editModal.$scope.ok = false;
      editModal.$scope.accept = function (hide) {
        editModal.$scope.ok = true;
        hide();
      };
      editModal.$scope.abort = function (hide) {
        editModal.$scope.ok = false;
        hide();
      };
      editModal.$scope.changeName = false;

      editModal.$scope.$watch('content.title', function(newValue, oldValue) {
        // $log.debug("Content in Content Modal changed!", "new", newValue, "old", oldValue);
        if(editModal.$scope.changeName && angular.isDefined(editModal.$scope.content)) {
          editModal.$scope.content.name = generateName(newValue);
        }
      });

      editModal.$scope.$on('modal.hide.before',function(event, editModal) {
        // $log.debug("edit closed", event, editModal);
        editModal.$scope.changeName = false;
        if(editModal.$scope.ok) {
          return validateContent(editModal.$scope.content, editModal.$scope.callback);
        }
        if(angular.isFunction(editModal.$scope.callback)) {
          return editModal.$scope.callback("discarded", editModal.$scope.content);
        }
      });
      return getEditModal();
    };

    var getEditModal = function() {
      return editModal;
    };

    var subscribe = function() {
      // called on content changes
      $sailsSocket.subscribe('content', function(msg){
        $log.debug("Content event!", msg);
        switch(msg.verb) {
          case 'updated':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Seite wurde aktualisiert', msg.id);
            }
          break;
        }
      });
    };

    var toogleShowHtml = function(contents, callback) {
      showHtml = !showHtml;
      if(showHtml && contents) {
        contents = beautifyEach(contents);
      }
      if(angular.isFunction(callback)) {
        return callback(null, showHtml);
      }
      return showHtml;
    };

    var beautify = function(content, callback) {
      content.content = html_beautify(content.content);
      if(angular.isFunction(callback)) {
        return callback(null, content);
      }
      return content;
    };

    var beautifyEach = function(contents, callback) {
      for (var i = contents.length - 1; i >= 0; i--) {
        contents[i].content = beautify(contents[i].content);
      }
      if(angular.isFunction(callback)) {
        return callback(null, contents);
      }
      return contents;
    };

    var getByName = function (contents, name) {
      var index = UtilityService.findKeyValue(contents, 'name', name);
      if(index > -1) {
        return contents[index];
      }
      return null;
    };

    var create = function(data) {
      if(!data || !data.content) {
        data.content = "";
      }
      if(!data || !data.title) {
        data.title = "";
      }
      if(!data || !data.name) {
        data.name = "";
      }
      if(!data || !data.type) {
        data.type = "dynamic";
      }
      if(!data || !data.page) {
        callback("Page not set.");
      }
      return data;
    };

    var append = function(contents, content, callback) {
      SortableService.append(contents, content, callback, true, 'name');
    };

    var createEdit = function(contents, page, callback) {
      var data = create({page:page});
      edit(data, callback, true);
    };

    var swap = function(contents, index_1, index_2, callback) {
      return SortableService.swap(contents, index_1, index_2, callback);
    };

    var moveForward = function(index, contents, callback) {
      return SortableService.moveForward(index, contents, callback);
    };

    var moveBackward = function(index, contents, callback) {
      return SortableService.moveBackward(index, contents, callback);
    };

    var validateContent = function (content, callback) {
      if(content.title) {
        return fix(content, callback);
      }
      if(angular.isFunction(callback)) {
        return callback("Title not set", content);
      }
      return null;
    };

    var edit = function(content, callback, changeName) {
      $log.debug("edit", content);
      editModal.$scope.content = content;
      editModal.$scope.callback = callback;
      if(changeName) {
        editModal.$scope.changeName = changeName;
      }
      else {
        editModal.$scope.changeName = false;
      }
      focus('contentedittitle');
      //- Show when some event occurs (use $promise property to ensure the template has been loaded)
      editModal.$promise.then(editModal.show);
    };

    var removeFromClient = function (contents, index, content, callback) {
      return SortableService.remove(index, contents, callback);
    };

    var remove = function(contents, index, content, page, callback) {
      var errors = [
        'Content konnte nicht gelöscht werden.'
      ];
      if(typeof(index) === 'undefined' || index === null) {
        index = contents.indexOf(content);
      }
      // remove from client
      contents = SortableService.remove(contents, index, content);
      // if content has an id it is saved on database, if not, not
      if(content.id) {
        $log.debug("remove from server, too" ,content);
        $sailsSocket.delete('/content/'+content.id+"?page="+page, {id:content.id, page: page}).success(function(data, status, headers, config) {
          if(angular.isFunction(callback)) {
            return callback(null, contents);
          }
          return contents;
        }).
        error(function(data, status, headers, config) {
          $log.error (errors[0], data);
          if(angular.isFunction(callback)) {
            return callback(data);
          }
          return data;
        });
      } else {
        if(angular.isFunction(callback)) {
          return callback(null, contents);
        }
        return contents;
      }
    };

    var refresh = function(contents, callback) {
      fixEach(contents, function(err, contents) {
        if(err) {
          $log.error(err);
          if(angular.isFunction(callback)) {
            return callback(err);
          }
          return err;
        }
        beautifyEach(contents, function(err, contents) {
          if(err) {
            $log.error(err);
            if(angular.isFunction(callback)) {
              return callback(err);
            }
            return err;
          }
          if(angular.isFunction(callback)) {
            return callback(null, contents);
          }
          return contents;
        });
      });
    };

    var generateName = function (title) {
      var name = "";
      if(title && title !== "") {
        // Set content.name to content.title but only the letters in lower case
        name = title.toLowerCase().replace(/[^a-z1-9]+/g, '');
        $log.debug("set content.name to", name);
      }
      return name;
    };

    /*
     * Validate and fix content to make it saveable
     */
    var fix = function(content, callback) {

      if(angular.isDefined(content)) {
        if(angular.isUndefined(content.name) || content.name === '' || content.name === null) {
          content.name = generateName(content.title);
        }

        if(!content.type || content.type === "") {
          $log.warn("Fix content type not set, set it to dynamic");
          content.type = 'fix';
        }
      } else {
        if(angular.isFunction(callback)) {
          return callback("content not set");
        }
        return null;
      }

      if(angular.isFunction(callback)) {
        return callback(null, content);
      }
      return content;
    };

    /*
     * Validate and fix all contents to make them saveable
     */
    var fixEach = function(contents, callback) {
      for (var i = contents.length - 1; i >= 0; i--) {
        contents[i] = fix(contents[i]);
      }
      if(angular.isFunction(callback)) {
        return callback(null, contents);
      }
      return contents;
    };

    var saveOne = function(content, page, callback) {
      var errors = [
        'Inhalt konnte nicht gespeichert werden'
      ];
      content.page = page;
      fix(content, function(err, content) {
        if(err) {
          if(angular.isFunction(callback)) {
            return callback(err);
          }
          return err;
        }
        $sailsSocket.put('/content/replace', content).success(function(data, status, headers, config) {
          //- $log.debug ("save response from /content/replaceall", data, status, headers, config);
          if(data !== null && typeof(data) !== "undefined") {
            content = data;
            // $log.debug (content);
            if(angular.isFunction(callback)) {
              return callback(null, content);
            }
            return content;
          } else {
            $log.error(errors[0]);
            if(angular.isFunction(callback)) {
              return callback(errors[0]);
            }
            return errors[0];
          }
        }).
        error(function(data, status, headers, config) {
          $log.error (errors[0], data);
          if(angular.isFunction(callback)) {
            return callback(data);
          }
          return data;
        });
      });
    };

    var save = function(contents, page, callback) {
      var errors = [
        'Seite konnte nicht gespeichert werden'
      ];
      fixEach(contents, function(err, contents) {
        if(err) {
          if(angular.isFunction(callback)) {
            return callback(err);
          }
          return err;
        }
        return $sailsSocket.put('/content/replaceall', {contents: contents, page: page}).success(function(data, status, headers, config) {
          //- $log.debug ("save response from /content/replaceall", data, status, headers, config);
          if(data !== null && typeof(data) !== "undefined") {
            contents = $filter('orderBy')(data, 'position');
            // $log.debug (data);
            if(angular.isFunction(callback)) {
              return callback(null, contents);
            }
            return contents;
          }
          $log.error(errors[0]);
          if(angular.isFunction(callback)) {
            return callback(errors[0]);
          }
          return errors[0];
        }).
        error(function(data, status, headers, config) {
          $log.error (errors[0], data);
          if(angular.isFunction(callback)) {
            callback(data);
          }
        });
      });
    };

    var findOne = function(page, name, type, callback, next) {
      var errors = [
        "Error: On trying to find one with page: "+page+", name: "+name,
        "request has more than one results"
      ];
      var query = {
        page: page,
        name: name
      };
      var url = '/content/find';
      if(type) {
        query.type = type;
      }
      return $sailsSocket.put(url, query).then (function (data) {
        if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
          return null;
        }
        if(data.data instanceof Array) {
          data.data = data.data[0];
          $log.error(errors[1]);
        }
        // data.data.content = html_beautify(data.data.content);
        if(next) {
          data.data = next(data.data);
        }
        if(angular.isFunction(callback)) {
          return callback(null, data.data);
        }
        return data.data;
      }, function error (resp){
        $log.error(errors[0], resp);
        if(angular.isFunction(callback)) {
          return callback(errors[0], resp);
        }
        return resp;
      });
    };

    var findAll = function(page, type, callback, next) {
      var errors = [
        "Error: On trying to find all with page: "+page+" and type: "+type,
        "Warn: On trying to find all "+page+" contents! Not found, content is empty!"
      ];
      var query = {
        page: page,
      };
      var url = '/content/findall';
      if(type) {
        query.type = type;
      }
      return $sailsSocket.put(url, query).then (function (data) {
        if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
          $log.warn(errors[1]);
          return null;
        }
        // data.data.content = html_beautify(data.data.content);
        data.data = $filter('orderBy')(data.data, 'position');
        // $log.debug(data);
        if(next) {
          data.data = next(data.data);
        }

        if(angular.isFunction(callback)) {
          callback(null, data.data);
        } else {
          return data.data;
        }
      }, function error (resp){
        $log.error(errors[0], resp);
        if(angular.isFunction(callback)) {
          return callback(errors[0], resp);
        }
        return resp;
      });
    };

    /*
     * get all contents for page including images for each content.name 
     */
    var findAllWithImage = function(page, type, callback, next) {
      // $log.debug("findAllWithImage");
      var errors = [
        "Error: On trying to find all with page: "+page+" and type: "+type,
        "Warn: On trying to find all "+page+" contents! Not found, content is empty!"
      ];
      var query = {
        page: page
      };
      var url = '/content/findAllWithImage?page='+page;
      if(type) {
        query.type = type;
        url = url+'&type='+type;
      }
      return $sailsSocket.get(url, query).then (function (data) {
        if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
          $log.warn(errors[1]);
          return null;
        }
        // data.data.content = html_beautify(data.data.content);
        data.data.contents = $filter('orderBy')(data.data.contents, 'position');
        data.data.images = $filter('orderBy')(data.data.images, 'position');
        // $log.debug(data);
        if(next) {
          data.data = next(data.data);
        }
        if(angular.isFunction(callback)) {
          return callback(null, data.data);
        }
        return data.data;
      }, function error (resp){
        $log.error(errors[0], resp);
        if(angular.isFunction(callback)) {
          return callback(errors[0], resp);
        }
        return resp;
      });
    };

    /**
     * Resolve function for angular ui-router.
     * name, callback and next parameters are optional.
     * use next to transform the result before you get it back
     * use callback if you want not use promise
     */
    var find = function(page, name, type, callback, next) {
      //- get soecial content (one)
      if(angular.isDefined(name)) {
        return findOne(page, name, type, next);
      // get all for page
      } else {
        return findAll(page, type, callback, next);
      }
    };

    return {
      subscribe: subscribe,
      setEditModal: setEditModal,
      getShowHtml: getShowHtml,
      toogleShowHtml: toogleShowHtml,
      beautify: beautify,
      beautifyEach: beautifyEach,
      create: create,
      createEdit: createEdit,
      append: append,
      swap: swap,
      moveForward: moveForward,
      moveBackward: moveBackward,
      edit: edit,
      removeFromClient: removeFromClient,
      remove: remove,
      refresh: refresh,
      fix: fix,
      fixEach: fixEach,
      save: save,
      saveOne: saveOne,
      find: find,
      resolve: find, // alias
      findOne: findOne,
      resolveOne: findOne, // alias
      findAll: findAll, 
      resolveAll: findAll, //alias
      findAllWithImage: findAllWithImage,
      resolveAllWithImage: findAllWithImage,  //alias
      getByName: getByName
    };
  })
;