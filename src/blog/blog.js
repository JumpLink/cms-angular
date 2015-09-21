angular.module('jumplink.cms.blog', [
  'jumplink.cms.blog',
  'angularMoment',
  'ngAsync',
  'sails.io',
])

.service('BlogService', function (moment, $sailsSocket, $async, $log) {

  var types = ['news', 'other'];

  /**
   * delete attachment on local / client / browser
   */
  var deleteAttachmentLocally = function (blogPosts, postIndex, attachmentIndex, cb) {
    if(blogPosts[postIndex].attachments.length > 0) return blogPosts[postIndex].attachments.splice(attachmentIndex, 1);
  };

  /**
   * delete attachment extern / server
   */
  var deleteAttachmentExternally = function (blogPosts, postIndex, attachmentIndex, cb) {
    $sailsSocket.post('/blog/deleteAttachment/', {blogPostID: blogPosts[postIndex].id, attachmentUploadedAs: blogPosts[postIndex].attachments[attachmentIndex].uploadedAs})
    .success(function (data, status, headers, config) {
      $log.debug(null, data, status, headers, config);
      cb();
    })
    .error(function (data, status, headers, config) {
      $log.error(data, status, headers, config);
      cb("error", data, status, headers, config);
    });
  };

  var deleteAttachment = function (blogPosts, post, attachmentIndex, cb) {
    var postIndex = blogPosts.indexOf(post);
    $log.debug("[NewsController.deleteAttachment]", blogPosts[postIndex], attachmentIndex);
    return deleteAttachmentExternally(blogPosts, postIndex, attachmentIndex, function (error, data) {
      return deleteAttachmentLocally(blogPosts, postIndex, attachmentIndex, cb);
    });
  };

  var validate = function (blogPost, page, cb) {
    if(blogPost.title) {
      return fix(blogPost, page, cb)
    } else {
      if(cb) cb("Title not set", blogPost);
      else return null;
    }
  }

  var chooseType = function(blogPost, type) {
    blogPost.type = type;
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

  var fix = function(object, page, cb) {
    if(angular.isUndefined(object.page) && page !== null) object.page = page;
    if(!object.name || object.name === "") {
      // Set object.name to object.title but only the letters in lower case
      object.name = object.title.toLowerCase().replace(/[^a-z]+/g, '');
      // $log.debug("set object.name to", object.name);
    }
    if(cb) cb(null, object);
    else return object;
  }

  var fixEach = function(objects, page, cb) {
    for (var i = objects.length - 1; i >= 0; i--) {
      objects[i] = fix(objects[i], page);
    };
    if(cb) cb(null, objects);
    else return objects;
  }

  var refresh = function(blogPosts) {
    blogPosts = transform(blogPosts);
    return blogPosts;
  };

  var saveOne = function (blogPosts, blogPost, index, page, cb) {
    var errors = [
      "BlogService: Can't save blogPost.",
      "BlogService: Can't save blogPost, blogPost to update not found.",
      "BlogService: Can't save blogPost, parameters undefind.",
    ]
    $log.debug("[BlogService.saveOne]", blogPost)
    if(angular.isDefined(blogPost) && angular.isDefined(cb)) {
      blogPost = fix(blogPost, page);
      if(angular.isUndefined(blogPost.id)) {
        // create because id is undefined
        $sailsSocket.post('/blog', blogPost).success(function(data, status, headers, config) {
          if(angular.isArray(data)) data = data[0];
          cb(null, data);
        }).error(function (data, status, headers, config) {
          if(angular.isArray(data)) data = data[0];
          $log.error(data, status, headers, config);
          cb(errors[0]);
        });
      } else {
        // update because id is defined
        $sailsSocket.put('/blog/'+blogPost.id, blogPost).success(function(data, status, headers, config) {
          if(angular.isArray(data)) data = data[0];
          cb(null, data);
        }).error(function (data, status, headers, config) {
          $log.error(data, status, headers, config);
          cb(errors[0]);
        });
      }
    } else {
      cb(errors[2]);
    }
  };

  var saveBlocks = function(blogPosts, page, cb) {
    var errors = [
      "[BlogService.saveBlocks] Can't save blogPosts, parameters undefind."
    ]
    // save just this blogPost if defined
    if(angular.isDefined(blogPosts) && angular.isDefined(cb)) {
      $async.map(blogPosts, function (blogPost, cb) {
        saveOne(blogPosts, blogPost, null, page, cb);
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

  var save = function(blogPosts, blogPost, index, page, callback) {
    // save just this blogPost if defined
    if(angular.isDefined(blogPost)) {
      saveOne(blogPosts, blogPost, index, page, callback);
    } else { // save all blogPostBlocks
      saveBlocks(blogPosts, page, callback);
    }
  };

  var resolve = function(page) {
    return $sailsSocket.get('/blog', {page:page}).then (function (data) {
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
          $scope.blogPosts.push(msg.data);
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
  };

  return {
    validate: validate,
    subscribe: subscribe,
    append: append,
    sort: sort,
    transform: transform,
    saveOne: saveOne,
    saveBlocks: saveBlocks,
    save: save,
    fixEach: fixEach,
    resolve: resolve,
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