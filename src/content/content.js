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
    }

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
      }
      editModal.$scope.changeName = false;

      editModal.$scope.$watch('content.title', function(newValue, oldValue) {
        // $log.debug("Content in Content Modal changed!", "new", newValue, "old", oldValue);
        if(editModal.$scope.changeName && angular.isDefined(editModal.$scope.content)) editModal.$scope.content.name = generateName(newValue);
      });

      editModal.$scope.$on('modal.hide.before',function(event, editModal) {
        // $log.debug("edit closed", event, editModal);
        editModal.$scope.changeName = false;
        if(editModal.$scope.ok) {
          return validateContent(editModal.$scope.content, editModal.$scope.callback);
        } else {
          if(editModal.$scope.callback) editModal.$scope.callback("discarded", editModal.$scope.content);
        }
      });

      return getEditModal();
    }

    var getEditModal = function() {
      return editModal;
    }

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
    }

    var toogleShowHtml = function(contents, cb) {
      showHtml = !showHtml;
      if(showHtml && contents) {
        contents = beautifyEach(contents);
      }
      if(cb) cb(null, showHtml);
      else return showHtml;
    }

    var beautify = function(content, cb) {
      content.content = html_beautify(content.content);
      if(cb) cb(null, content);
      else return content;
    }

    var beautifyEach = function(contents, cb) {
      for (var i = contents.length - 1; i >= 0; i--) {
        contents[i].content = beautify(contents[i].content);
      };
      if(cb) cb(null, contents);
      else return contents;
    }

    var getByName = function (contents, name) {
      var index = UtilityService.findKeyValue(contents, 'name', name);
      if(index > -1) {
        return contents[index];
      } else {
        return null;
      }
    }

    var create = function(data) {

      if(!data || !data.content) data.content = "";
      if(!data || !data.title) data.title = "";
      if(!data || !data.name) data.name = "";
      if(!data || !data.type) data.type = "dynamic";
      if(!data || !data.page) cb("Page not set.")

      return data;
    }

    var append = function(contents, content, cb) {
      SortableService.append(contents, content, cb, true, 'name');
    }

    var createEdit = function(contents, page, cb) {
      var data = create({page:page});
      edit(data, cb, true);
    }

    var swap = function(contents, index_1, index_2, cb) {
      return SortableService.swap(contents, index_1, index_2, cb);
    }

    var moveForward = function(index, contents, cb) {
      return SortableService.moveForward(index, contents, cb);
    }

    var moveBackward = function(index, contents, cb) {
      return SortableService.moveBackward(index, contents, cb);
    }

    var validateContent = function (content, cb) {
      if(content.title) {
        return fix(content, cb)
      } else {
        if(cb) cb("Title not set", content);
        else return null;
      }
    }

    var edit = function(content, cb, changeName) {
      $log.debug("edit", content);
      editModal.$scope.content = content;
      editModal.$scope.callback = cb;
      if(changeName) editModal.$scope.changeName = changeName;
      else editModal.$scope.changeName = false;
      focus('contentedittitle');
      //- Show when some event occurs (use $promise property to ensure the template has been loaded)
      editModal.$promise.then(editModal.show);
    }

    var removeFromClient = function (contents, index, content, cb) {
      return SortableService.remove(index, contents, cb);
    }

    var remove = function(contents, index, content, page, cb) {
      var errors = [
        'Content konnte nicht gelöscht werden.'
      ]
      if(typeof(index) === 'undefined' || index === null) {
        index = contents.indexOf(content);
      }
      // remove from client
      contents = SortableService.remove(contents, index, content);
      // if content has an id it is saved on database, if not, not
      if(content.id) {
        $log.debug("remove from server, too" ,content);
        $sailsSocket.delete('/content/'+content.id+"?page="+page, {id:content.id, page: page}).success(function(data, status, headers, config) {
          if(cb) cb(null, contents)
        }).
        error(function(data, status, headers, config) {
          $log.error (errors[0], data);
          if(cb) cb(data);
        });
      } else {
        if(cb) cb(null, contents);
      }
    }

    var refresh = function(contents, cb) {
      fixEach(contents, function(err, contents) {
        if(err) {
          $log.error(err);
          if(cb) cb(err);
          else return err;
        }
        beautifyEach(contents, function(err, contents) {
          if(err) {
            $log.error(err);
            if(cb) cb(err);
            else return err;
          } else {
            if(cb) cb(null, contents);
            else return contents;
          }
        });
      });
    }

    var generateName = function (title) {
      if(title && title !== "") {
        // Set content.name to content.title but only the letters in lower case
        var name = title.toLowerCase().replace(/[^a-z1-9]+/g, '');
        $log.debug("set content.name to", name);
      } else {
        var name = "";
      }

      return name;
    }

    /*
     * Validate and fix content to make it saveable
     */
    var fix = function(content, cb) {

      if(angular.isDefined(content)) {
        if(angular.isUndefined(content.name) || content.name === '' || content.name === null)
          content.name = generateName(content.title);

        if(!content.type || content.type === "") {
          $log.warn("Fix content type not set, set it to dynamic");
          content.type = 'fix';
        }
      } else {
         if(cb) return cb("content not set");
         return null;
      }

      if(cb) return cb(null, content);
      else return content;
    }

    /*
     * Validate and fix all contents to make them saveable
     */
    var fixEach = function(contents, cb) {
      for (var i = contents.length - 1; i >= 0; i--) {
        contents[i] = fix(contents[i]);
      };
      if(cb) cb(null, contents);
      else return contents;
    }

    var saveOne = function(content, page, cb) {
      var errors = [
        'Inhalt konnte nicht gespeichert werden'
      ];
      content.page = page;
      fix(content, function(err, content) {
        if(err) {
          if(cb) cb(err);
          else return err;
        }
        $sailsSocket.put('/content/replace', content).success(function(data, status, headers, config) {
          //- $log.debug ("save response from /content/replaceall", data, status, headers, config);
          if(data != null && typeof(data) !== "undefined") {
            content = data;
            // $log.debug (content);
            if(cb) cb(null, content);
          } else {
            $log.error(errors[0]);
            if(cb) cb(errors[0]);
            else return errors[0];
          }
        }).
        error(function(data, status, headers, config) {
          $log.error (errors[0], data);
          if(cb) cb(data);
        });
      });

    }

    var save = function(contents, page, cb) {
      var errors = [
        'Seite konnte nicht gespeichert werden'
      ];
      fixEach(contents, function(err, contents) {
        if(err) {
          if(cb) cb(err);
          else return err;
        }
        $sailsSocket.put('/content/replaceall', {contents: contents, page: page}).success(function(data, status, headers, config) {
          //- $log.debug ("save response from /content/replaceall", data, status, headers, config);
          if(data != null && typeof(data) !== "undefined") {
            contents = $filter('orderBy')(data, 'position');
            // $log.debug (data);
            if(cb) cb(null, contents);
          } else {
            $log.error(errors[0]);
            if(cb) cb(errors[0]);
            else return errors[0];
          }
        }).
        error(function(data, status, headers, config) {
          $log.error (errors[0], data);
          if(cb) cb(data);
        });
      });
    }

    var findOne = function(page, name, type, cb, next) {
      var errors = [
        "Error: On trying to find one with page: "+page+", name: "+name,
        "request has more than one results"
      ];
      var query = {
        page: page,
        name: name
      };
      var url = '/content/find';
      if(type) query.type = type;
      return $sailsSocket.put(url, query).then (function (data) {
        if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
          return null;
        } else {
          if (data.data instanceof Array) {
            data.data = data.data[0];
            $log.error(errors[1]);
          }
          // data.data.content = html_beautify(data.data.content);
          if(next) data.data = next(data.data);

          if(cb) cb(null, data.data);
          else return data.data;
        }
      }, function error (resp){
        $log.error(errors[0], resp);
        if(cb) cb(errors[0], resp);
        else return resp;
      });
    };

    var findAll = function(page, type, cb, next) {
      var errors = [
        "Error: On trying to find all with page: "+page+" and type: "+type,
        "Warn: On trying to find all "+page+" contents! Not found, content is empty!"
      ];
      var query = {
        page: page,
      };
      var url = '/content/findall';
      if(type) query.type = type;
      return $sailsSocket.put(url, query).then (function (data) {
        if(angular.isUndefined(data) || angular.isUndefined(data.data)) {
          $log.warn(errors[1]);
          return null;
        }
        // data.data.content = html_beautify(data.data.content);
        data.data = $filter('orderBy')(data.data, 'position');
        // $log.debug(data);
        if(next) data.data = next(data.data);

        if(cb) {
          cb(null, data.data);
        } else {
          return data.data;
        }
      }, function error (resp){
        $log.error(errors[0], resp);
        if(cb) cb(errors[0], resp);
        else return resp;
      });
    };

    /*
     * get all contents for page including images for each content.name 
     */
    var findAllWithImage = function(page, type, cb, next) {
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
        if(next) data.data = next(data.data);

        if(cb) {
          cb(null, data.data);
        } else {
          return data.data;
        }
      }, function error (resp){
        $log.error(errors[0], resp);
        if(cb) cb(errors[0], resp);
        else return resp;
      });
    };

    /**
     * Resolve function for angular ui-router.
     * name, cb and next parameters are optional.
     * use next to transform the result before you get it back
     * use cb if you want not use promise
     */
    var find = function(page, name, type, cb, next) {
      //- get soecial content (one)
      if(angular.isDefined(name)) {
        return findOne(page, name, type, next);
      // get all for page
      } else {
        return findAll(page, type, cb, next);
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