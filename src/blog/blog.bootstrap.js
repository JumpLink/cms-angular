angular.module('jumplink.cms.bootstrap.blog', [
  'jumplink.cms.blog',
  'mgcrea.ngStrap',
  'angular-medium-editor',
  'angularFileUpload',
  'ngFocus',
])

.service('BlogBootstrapService', function ($log, focus, BlogService, $modal, FileUploader) {

  var editModal = null;
  var typeModal = null;
  var page = null;

  var openTypeChooserModal = function(blogPost) {
    typeModal.$scope.blogPost = blogPost;
    //- Show when some blogPost occurs (use $promise property to ensure the template has been loaded)
    typeModal.$promise.then(typeModal.show);
  };

  var setModals = function($scope, fileOptions, pageString) {

    page = pageString;

    editModal = $modal({title: 'Blogpost bearbeiten', templateUrl: '/views/modern/blog/editmodal.bootstrap.jade', show: false});
    editModal.$scope.ok = false;
    editModal.$scope.accept = function (hide) {
      editModal.$scope.ok = true;
      hide();
    };
    editModal.$scope.abort = function (hide) {
      editModal.$scope.ok = false;
      hide();
    };

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
      };
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
      $log.debug("[BlogBootstrapService.onCompleteItem] fileItem", fileItem, "response", response);
      if(!angular.isArray(fileItem.blogPost.attachments)) {
        fileItem.blogPost.attachments = [];
      }
      for (var i = 0; i < response.files.length; i++) {
        fileItem.blogPost.attachments.push(response.files[i]);
      }
    };

    editModal.$scope.uploader.onProgressItem = function(fileItem, progress) {
      $log.debug('[BlogBootstrapService.onProgressItem]', fileItem, progress);
    };

    editModal.$scope.upload = function(fileItem, blogPost) {
      fileItem.blogPost = blogPost;
      fileItem.upload();
    };

    typeModal = $modal({title: 'Typ wählen', templateUrl: '/views/modern/blog/typechoosermodal.bootstrap.jade', show: false});
    typeModal.$scope.chooseType = BlogService.chooseType;

    editModal.$scope.$on('modal.hide.before',function(modalEvent, editModal) {
      $log.debug("edit closed", editModal.$scope.blogPost, editModal);
      if(editModal.$scope.ok) {
        // BlogService.saveOne(null, editModal.$scope.blogPost, null, page, function (err, result) {
        //   editModal.$scope.blogPost = result
        //   return BlogService.validate(editModal.$scope.blogPost, null, editModal.$scope.callback);
        // });
        return BlogService.validate(editModal.$scope.blogPost, null, editModal.$scope.callback);
      } else {
        if(editModal.$scope.callback) {
          editModal.$scope.callback("discarded", editModal.$scope.blogPost);
        }
      }
    });

    return getModals();
  };

  var getEditModal = function() {
    return editModal;
  };

  var getTypeModal = function() {
    return typeModal;
  };

  var getModals = function() {
    return {
      editModal: getTypeModal(),
      typeModal: getTypeModal()
    };
  };

  var edit = function(blogPost, cb) {
    $log.debug("[BlogService.edit]", blogPost);
    editModal.$scope.blogPost = blogPost;
    editModal.$scope.callback = cb;
    editModal.$scope.ok = false;

    focus('blogposttitle');
    //- Show when some blogPost occurs (use $promise property to ensure the template has been loaded)
    editModal.$promise.then(editModal.show);
  };

  var createEdit = function(blogPosts, blogPost, cb) {
    blogPost = BlogService.create(blogPost); 
    edit(blogPost, cb);
  };

  return {
    edit: edit,
    update: edit, // alias
    createEdit: createEdit,
    setModals: setModals,
    openTypeChooserModal: openTypeChooserModal,
  };
});