angular.module('jumplink.cms.blog', [
    'mgcrea.ngStrap',
    'angular-medium-editor',
    'angularFileUpload',
    'angularMoment',
    'ngFocus',
    'ngAsync',
    'sails.io',
    'jumplink.cms.utilities',
  ])

  .service('BlogService', function (moment, UtilityService, $sailsSocket, $async, $log, focus, $modal, FileUploader) {

    var editModal = null;
    var typeModal = null;
    var types = ['news', 'other'];

    var validate = function (blogPost, cb) {
      if(blogPost.title) {
        return fix(blogPost, cb)
      } else {
        if(cb) cb("Title not set", blogPost);
        else return null;
      }
    }

    var chooseType = function(blogPost, type, hide) {
      blogPost.type = type;
      hide();
    };

    var openTypeChooserModal = function(blogPost) {
      typeModal.$scope.blogPost = blogPost;
      //- Show when some blogPost occurs (use $promise property to ensure the template has been loaded)
      typeModal.$promise.then(typeModal.show);
    };

    var setModals = function($scope, fileOptions) {

      editModal = $modal({title: 'Blogpost bearbeiten', templateUrl: '/views/modern/blog/editmodal.bootstrap.jade', show: false});
      editModal.$scope.ok = false;
      editModal.$scope.accept = function (hide) {
        editModal.$scope.ok = true;
        hide();
      };
      editModal.$scope.abort = function (hide) {
        editModal.$scope.ok = false;
        hide();
      }

      // set default fileOptions
      if(angular.isUndefined(fileOptions)) {
        fileOptions = {
          path: 'assets/files/blog',
          thumbnail: {
            width: 300,
            path: 'assets/files/blog'
          },
          rescrop: {
            width: 1200,
            cropwidth: 1200,
            cropheight: 1200,
          }
        }
      }

      var uploadOptions = {
        url: 'blog/upload',
        removeAfterUpload: true,
        // WARN: headers HTML5 only
        headers: {
          options: JSON.stringify(fileOptions)
        }
      };

      editModal.$scope.uploader = new FileUploader(uploadOptions);
      editModal.$scope.openTypeChooserModal = openTypeChooserModal;

      editModal.$scope.uploader.onCompleteItem = function(fileItem, response, status, headers) {
        $log.debug("fileItem", fileItem);
        if(!angular.isArray(fileItem.blogPost.attachments)) fileItem.blogPost.attachments = [];
        for (var i = 0; i < response.files.length; i++) {
          fileItem.blogPost.attachments.push(response.files[i]);
        };
      };

      editModal.$scope.uploader.onProgressItem = function(fileItem, progress) {
        console.info('onProgressItem', fileItem, progress);
      };

      editModal.$scope.upload = function(fileItem, blogPost) {
        fileItem.blogPost = blogPost;
        fileItem.upload();
      };

      typeModal = $modal({title: 'Typ wählen', templateUrl: '/views/modern/blog/typechoosermodal.bootstrap.jade', show: false});
      typeModal.$scope.chooseType = chooseType;

      editModal.$scope.$on('modal.hide.before',function(blogPost, editModal) {
        $log.debug("edit closed", blogPost, editModal);
        if(editModal.$scope.ok) {
          return validate(editModal.$scope.blogPost, editModal.$scope.callback);
        } else {
          if(editModal.$scope.callback) editModal.$scope.callback("discarded", editModal.$scope.blogPost);
        }
      });

      return getModals();
    }

    var getEditModal = function() {
      return editModal;
    }

    var getTypeModal = function() {
      return typeModal;
    }

    var getModals = function() {
      return {
        editModal: getTypeModal(),
        typeModal: getTypeModal()
      }
    }

    var edit = function(blogPost, cb) {
      $log.debug("[BlogService.edit]", blogPost);
      editModal.$scope.blogPost = blogPost;
      editModal.$scope.callback = cb;
      editModal.$scope.ok = false;

      focus('blogposttitle');
      //- Show when some blogPost occurs (use $promise property to ensure the template has been loaded)
      editModal.$promise.then(editModal.show);
    };

    var removeFromClient = function (blogPosts, blogPost, cb) {
      // $log.debug("removeFromClient", blogPost);
      var index = blogPosts.indexOf(blogPost);
      if (index > -1) {
        blogPosts.splice(index, 1);
        if(cb) cb(null, blogPosts);
      } else {
        if(cb) cb("no blogPost on client site found to remove", blogPosts);
      }
    };

    var destroy = function(blogPosts, blogPost, cb) {
      // $log.debug("remove blogPost", blogPost);
      if(blogPost.id) {
        $log.debug(blogPost);
        $sailsSocket.delete('/blog/'+blogPost.id).success(function(users, status, headers, config) {
          removeFromClient(blogPosts, blogPost, cb);
        });
      } else {
        removeFromClient(blogPosts, blogPost, cb);
      }
    };

    var sort = function(blogPosts) {
      console.log("TODO");
      blogPosts = blogPosts;
      return blogPosts;
    }

    var transform = function(blogPosts) {
      blogPosts = sort(blogPosts);
      // for (var i = 0; i < blogPosts.length; i++) {
      //   if(angular.isDefined(blogPosts[i].createdAt)) blogPosts[i].createdAt = moment(blogPosts[i].createdAt);
      //   if(angular.isDefined(blogPosts[i].updatedAt)) blogPosts[i].updatedAt = moment(blogPosts[i].updatedAt);
      // };
      return blogPosts;
    }

    var append = function(blogPosts, blogPost, cb) {
      blogPosts.push(blogPost);
      blogPosts = transform(blogPosts);
      if(cb) return cb(null, blogPosts);
      return blogPosts;
    }

    var create = function(data) {

      if(!data || !data.createdAt) data.createdAt = moment();
      // if(!data || !data.updatedAt) data.createdAt = moment();
      if(!data || !data.title) data.title = "";
      if(!data || !data.content) data.content = "";
      if(!data || !data.author) data.author = "";
      if(!data || !data.page) cb("Page not set.");
      if(!data || !data.type) data.type = types[0]; // news

      $log.debug("[BlogService,create]", data);

      return data;
    }

    var createEdit = function(blogPosts, blogPost, cb) {
      var blogPost = create(blogPost); 
      edit(blogPost, cb);
    };

    var fix = function(object, cb) {
      if(!object.name || object.name === "") {
        // Set object.name to object.title but only the letters in lower case
        object.name = object.title.toLowerCase().replace(/[^a-z]+/g, '');
        // $log.debug("set object.name to", object.name);
      }
      if(cb) cb(null, object);
      else return object;
    }

    var fixEach = function(objects, cb) {
      for (var i = objects.length - 1; i >= 0; i--) {
        objects[i] = fix(objects[i]);
      };
      if(cb) cb(null, objects);
      else return objects;
    }

    var refresh = function(blogPosts) {
      blogPosts = transform(blogPosts);
      return blogPosts;
    };

    var saveOne = function (blogPosts, blogPost, cb) {
      var errors = [
        "BlogService: Can't save blogPost.",
        "BlogService: Can't save blogPost, blogPost to update not found.",
        "BlogService: Can't save blogPost, parameters undefind.",
      ]
      if(angular.isDefined(blogPost) && angular.isDefined(cb)) {
        blogPost = fix(blogPost);
        if(angular.isUndefined(blogPost.id)) {
          // create because id is undefined
          $sailsSocket.post('/blog', blogPost).success(function(data, status, headers, config) {
            if(angular.isArray(data)) data = data[0];
            // $log.debug("blogPost created", blogPost, data);
            var index = blogPosts.indexOf(blogPost);
            if (index > -1) {
              blogPosts[index] = data;
              // $log.debug(blogPosts[index]);
              cb(null, blogPosts[index]);
            } else {
              cb(errors[1]);
            }
          }).error(function (data, status, headers, config) {
            if(angular.isArray(data)) data = data[0];
            $log.error(data, status, headers, config);
            cb(errors[0]);
          });
        } else {
          // update because id is defined
          $sailsSocket.put('/blog/'+blogPost.id, blogPost).success(function(data, status, headers, config) {
            if(angular.isArray(data)) data = data[0];
            // $log.debug("blogPost updated", blogPost, data);
            blogPost = data;
            cb(null, blogPost);
          }).error(function (data, status, headers, config) {
            $log.error(data, status, headers, config);
            cb(errors[0]);
          });
        }
      } else {
        cb(errors[2]);
      }
    };

    var saveBlocks = function(blogPosts, cb) {
      var errors = [
        "[BlogService.saveBlocks] Can't save blogPosts, parameters undefind."
      ]
      // save just this blogPost if defined
      if(angular.isDefined(blogPosts) && angular.isDefined(cb)) {
        $async.map(blogPosts, function (blogPost, cb) {
          saveOne(blogPosts, blogPost, cb);
        }, function(err, blogPostsArray) {
          if(err) return cb(err);
          blogPosts = transform(blogPosts);
          cb(null, blogPosts);
        });
      } else {
        if(cb) cb(errors[0]);
        else $log.error(errors[0]);
      }
    };

    var resolve = function(page) {
      return $sailsSocket.get('/blog').then (function (data) {
        // $log.debug(data);
        return transform(data.data);
      }, function error (resp){
        $log.error("Error on resolve "+page, resp);
        return null;
      });
    };

    var subscribe = function () {
      $sailsSocket.subscribe('blog', function(msg){
        $log.debug(msg);

        switch(msg.verb) {
          case 'updated':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Ein Blogpost wurde aktualisiert', msg.data.title);
            }
            findEvent(msg.id, function(error, blogPost, blogPostBlock, index) {
              if(error) $log.debug(error);
              else blogPost = msg.data;
              $scope.refresh();
            });
          break;
          case 'created':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Ein Blogpost wurde erstellt', msg.data.title);
            }
            $scope.blogPosts['before'].push(msg.data);
            $scope.refresh();
          break;
          case 'removedFrom':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Ein Blogpost wurde entfernt', msg.data.title);
            }
            findEvent(msg.id, function(error, blogPost, blogPostBlock, index) {
              if(error) $log.debug(error);
              else BlogService.removeFromClient($scope.blogPosts, blogPost, blogPostBlock);
            });
          break;
          case 'destroyed':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Ein Blogpost wurde gelöscht', msg.data.title);
            }
            findEvent(msg.id, function(error, blogPost, blogPostBlock, index) {
              if(error) $log.debug(error);
              else BlogService.removeFromClient($scope.blogPosts, blogPost, blogPostBlock);
            });
          break;
          case 'addedTo':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Ein Blogpost wurde hinzugefügt', msg.data.title);
            }
          break;
        }
      });
    }

    return {
      subscribe: subscribe,
      append: append,
      sort: sort,
      transform: transform,
      saveOne: saveOne,
      saveBlocks: saveBlocks,
      edit: edit,
      update: edit, // alias
      createEdit: createEdit,
      fixEach: fixEach,
      resolve: resolve,
      setModals: setModals,
      refresh: refresh,
      openTypeChooserModal: openTypeChooserModal,
      chooseType: chooseType,
      removeFromClient: removeFromClient,
      remove: destroy, // alias
      destroy: destroy,
    };
  });

;