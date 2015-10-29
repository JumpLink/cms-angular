angular.module('jumplink.cms.blog', [
  'jumplink.cms.attachment',
  'angularMoment',
  'ngAsync',
  'sails.io',
])

.service('BlogService', function (moment, $sailsSocket, $async, $log, $filter, AttachmentService) {

  var types = ['news', 'other'];

  /**
   * delete attachment on local / client / browser
   */
  var deleteAttachmentLocally = AttachmentService.destroyLocally;

  /**
   * delete attachment extern / server
   */
  var deleteAttachmentExternally = AttachmentService.destroyExternally;

  var deleteAttachment = AttachmentService.destroy;

  var validate = function (blogPost, page, callback) {
    if(blogPost.title) {
      return fix(blogPost, page, callback);
    }
    if(angular.isFunction(callback)) {
      return callback("Title not set", blogPost);
    }
    return null;
  };

  var chooseType = function(blogPost, type) {
    blogPost.type = type;
  };

  var removeFromClient = function (blogPosts, blogPost, callback) {
    // $log.debug("removeFromClient", blogPost);
    var index = blogPosts.indexOf(blogPost);
    if (index > -1) {
      blogPosts.splice(index, 1);
      if(angular.isFunction(callback)) {
        callback(null, blogPosts);
      }
    } else {
      if(angular.isFunction(callback)) {
        callback("no blogPost on client site found to remove", blogPosts);
      }
    }
  };

  var destroy = function(blogPosts, blogPost, callback) {
    // $log.debug("remove blogPost", blogPost);
    if(blogPost.id) {
      $log.debug("[jumplink.cms.blog.BlogService.destroy]", blogPost);
      $sailsSocket.delete('/blog/'+blogPost.id).success(function(users, status, headers, config) {
        removeFromClient(blogPosts, blogPost, callback);
      });
    } else {
      removeFromClient(blogPosts, blogPost, callback);
    }
  };

  var sort = function(blogPosts) {
    var reverse = true;
    return $filter('orderBy')(blogPosts, 'createdAt', reverse);
  };

  var transform = function(blogPosts) {
    blogPosts = sort(blogPosts);
    return blogPosts;
  };

  var append = function(blogPosts, moreBlogPosts, callback) {
    blogPosts.push.apply(blogPosts, moreBlogPosts);
    blogPosts = transform(blogPosts);
    if(angular.isFunction(callback)) {
      return callback(null, blogPosts);
    }
    return blogPosts;
  };

  var prepent = function(blogPosts, blogPost, callback) {
    blogPosts.unshift(blogPost);
    blogPosts = transform(blogPosts);
    if(angular.isFunction(callback)) {
      return callback(null, blogPosts);
    }
    return blogPosts;
  };

  var create = function(data) {
    if(!data || !data.createdAt) {
      data.createdAt = moment();
    }
    // if(!data || !data.updatedAt) data.createdAt = moment();
    if(!data || !data.title) {
      data.title = "";
    }
    if(!data || !data.content) {
      data.content = "";
    }
    if(!data || !data.author) {
      data.author = "";
    }
    if(!data || !data.page) {
      callback("Page not set.");
    }
    if(!data || !data.type) {
      data.type = types[0]; // news
    }
    $log.debug("[BlogService,create]", data);
    return data;
  };

  var createEdit = function(blogPosts, blogPost, callback) {
    blogPost = create(blogPost); 
    edit(blogPost, callback);
  };

  var fix = function(object, page, callback) {
    if(angular.isUndefined(object.page) && page !== null) {
      object.page = page;
    }
    if(!object.name || object.name === "") {
      // Set object.name to object.title but only the letters in lower case
      object.name = object.title.toLowerCase().replace(/[^a-z]+/g, '');
      // $log.debug("set object.name to", object.name);
    }
    if(angular.isFunction(callback)) {
      return callback(null, object);
    }
    return object;
  };

  var fixEach = function(objects, page, callback) {
    for (var i = objects.length - 1; i >= 0; i--) {
      objects[i] = fix(objects[i], page);
    }
    if(angular.isFunction(callback)) {
      return callback(null, objects);
    }
    return objects;
  };

  var refresh = function(blogPosts, callback) {
    $log.debug("[jumplink.cms.blog.BlogService.refresh]");
    blogPosts = transform(blogPosts);
    if(angular.isFunction(callback)) {
      return callback(null, blogPosts);
    }
    return blogPosts;
  };

  var saveOne = function (blogPosts, blogPost, index, page, callback) {
    var errors = [
      "BlogService: Can't save blogPost.",
      "BlogService: Can't save blogPost, blogPost to update not found.",
      "BlogService: Can't save blogPost, parameters undefind.",
    ];
    $log.debug("[BlogService.saveOne]", blogPost);
    if(angular.isDefined(blogPost) && angular.isDefined(callback)) {
      blogPost = fix(blogPost, page);
      if(angular.isUndefined(blogPost.id)) {
        // create because id is undefined
        $sailsSocket.post('/blog', blogPost).success(function(data, status, headers, config) {
          if(angular.isArray(data)) {
            data = data[0];
          }
          callback(null, data);
        }).error(function (data, status, headers, config) {
          if(angular.isArray(data)) {
            data = data[0];
          }
          $log.error(data, status, headers, config);
          return callback(errors[0]);
        });
      } else {
        // update because id is defined
        $sailsSocket.put('/blog/'+blogPost.id, blogPost).success(function(data, status, headers, config) {
          if(angular.isArray(data)) {
            data = data[0];
          }
          return callback(null, data);
        }).error(function (data, status, headers, config) {
          $log.error(data, status, headers, config);
          return callback(errors[0]);
        });
      }
    } else {
      return callback(errors[2]);
    }
  };

  var saveBlocks = function(blogPosts, page, callback) {
    var errors = [
      "[BlogService.saveBlocks] Can't save blogPosts, parameters undefind."
    ];
    // save just this blogPost if defined
    if(angular.isDefined(blogPosts) && angular.isDefined(callback)) {
      $async.map(blogPosts, function (blogPost, callback) {
        saveOne(blogPosts, blogPost, null, page, callback);
      }, function(err, blogPostsArray) {
        if(err) {
          return callback(err);
        }
        blogPosts = transform(blogPosts);
        return callback(null, blogPosts);
      });
    } else {
      $log.error(errors[0]);
      if(angular.isFunction(callback)) {
        return callback(errors[0]);
      }
    }
  };

  var save = function(blogPosts, blogPost, index, page, callback) {
    // save just this blogPost if defined
    if(angular.isDefined(blogPost)) {
      saveOne(blogPosts, blogPost, index, page, callback);
    } else { // save all blogPostBlocks
      saveBlocks(blogPosts, page, callback);
    }
  };

  var find = function(page, limit, skip, callback) {
    return $sailsSocket.put('/blog/find', {page:page, limit:limit, skip:skip}).then (function (data) {
      data.data = transform(data.data);
      if(angular.isFunction(callback)) {
        return callback(null, data.data);
      }
      return data.data;
    }, function error (resp){
      $log.error("Error on find "+page, resp);
      if(angular.isFunction(callback)) {
        return callback(resp);
      }
      return null;
    });
  };

  var count = function(page, limit, skip, callback) {
    return $sailsSocket.put('/blog/count', {page:page}).then (function (data) {
      // $log.debug(data);
      if(angular.isFunction(callback)) {
        return callback(null, data.data.count);
      }
      return data.data.count;
    }, function error (resp){
      $log.error("Error on resolve "+page, resp);
      if(angular.isFunction(callback)) {
        return callback(resp);
      }
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
            if(error) {
              $log.debug(error);
            }
            else {
              blogPost = msg.data;
            }
            $scope.refresh();
          });
        break;
        case 'created':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Blogpost wurde erstellt', msg.data.title);
          }
          $scope.blogPosts.push(msg.data);
          $scope.refresh();
        break;
        case 'removedFrom':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Blogpost wurde entfernt', msg.data.title);
          }
          findEvent(msg.id, function(error, blogPost, blogPostBlock, index) {
            if(error) {
              $log.debug(error);
            }
            else {
              BlogService.removeFromClient($scope.blogPosts, blogPost, blogPostBlock);
            }
          });
        break;
        case 'destroyed':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Blogpost wurde gelöscht', msg.data.title);
          }
          findEvent(msg.id, function(error, blogPost, blogPostBlock, index) {
            if(error) {
              $log.debug(error);
              return error;
            }
            else {
              BlogService.removeFromClient($scope.blogPosts, blogPost, blogPostBlock);
            }
          });
        break;
        case 'addedTo':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Blogpost wurde hinzugefügt', msg.data.title);
          }
        break;
      }
    });
  };

  return {
    validate: validate,
    subscribe: subscribe,
    append: append,
    prepent: prepent,
    sort: sort,
    transform: transform,
    saveOne: saveOne,
    saveBlocks: saveBlocks,
    save: save,
    fixEach: fixEach,
    find: find,
    resolve: find, // alias
    count: count,
    refresh: refresh,
    chooseType: chooseType,
    removeFromClient: removeFromClient,
    remove: destroy, // alias
    destroy: destroy,
    deleteAttachment: deleteAttachment,
    destroyAttachment: deleteAttachment, // alias
    create: create
  };
});