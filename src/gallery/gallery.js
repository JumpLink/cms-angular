angular.module('jumplink.cms.gallery', [
    'mgcrea.ngStrap',
    'ngAsync',
    'angular-medium-editor',
    'FBAngular',
    'sails.io',
    'angularFileUpload',
    'jumplink.cms.sortable',
    'jumplink.cms.content',
  ])

  .service('GalleryService', function ($rootScope, $sailsSocket, $async, $filter, Fullscreen, SortableService, ContentService, FileUploader, $modal, $log) {

    var editModal = null, uploadModal = null, fullscreenImage = null;

    var dropdown = [
      {
        "text": "<i class=\"fa fa-eye\"></i>&nbsp;Anzeigen",
        "click": "goToImage(image)"
      },
      {
        "text": "<i class=\"fa fa-edit\"></i>&nbsp;Bearbeiten",
        "click": "editImage(image)"
      },
      {
        "text": "<i class=\"fa fa-trash\"></i>&nbsp;Löschen",
        "click": "$dropdown.hide();$dropdown.destroy();removeImage(image);" // TODO delay
      },
      {
        "text": "<i class=\"fa fa-floppy-o\"></i>&nbsp;Speichern",
        "click": "saveImage(image)"
      }
    ];

    var getDropdown = function () {
      return dropdown;
    };

    var setEditModal = function($scope) {
      editModal = $modal({scope: $scope, title: 'Bild bearbeiten', templateUrl: 'gallery/editimagemodal', show: false});
      return getEditModal();
    };

    var getEditModal = function() {
      return editModal;
    };

    var prepairUploadModal = function (uploadModal, imageBlocks, contentBlocks) {
      
      uploadModal.$scope.imageBlocks = imageBlocks;
      uploadModal.$scope.selects = getSelects(imageBlocks, contentBlocks);
      if(uploadModal.$scope.selects.length > 0)
        uploadModal.$scope.selected = uploadModal.$scope.selects[0].value;

      return uploadModal;
    }

    var setUploadModal = function($scope, imageBlocks, contentBlocks, cb) {

      $scope.uploader = new FileUploader({url: 'gallery/upload', removeAfterUpload: true});
      $scope.uploader.filters.push({
        name: 'imageFilter',
        fn: function(item /*{File|FileLikeObject}*/, options) {
          var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
          return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
      });

      $scope.uploader.onCompleteItem = function(fileItem, response, status, headers) {
        //fileItem.member.image = response.files[0].uploadedAs;
        // $log.debug(fileItem, response, status, headers);
        // WORKAROUND until the socket method works
        response.files.forEach(function (file, index, files) {

          var selected = uploadModal.$scope.selected;
          var imageBlocks = uploadModal.$scope.imageBlocks;
          var currentImages = imageBlocks[selected];

          // $log.debug("selected", selected, "imageBlocks", imageBlocks, "currentImages", currentImages);

          var last_position = 0;
          if(currentImages.length > 0) last_position = currentImages[currentImages.length-1].position;
          if($rootScope.authenticated) $rootScope.pop('success', 'Ein Bild wurde hochgeladen', file.original.name);
          if(typeof file.position === 'undefined') {
            last_position++;
            file.position = last_position;
            file.content = selected;
          }
          
          currentImages.push(file);
        });
      };

      $scope.upload = function(fileItem, image) {
        fileItem.image = image;
        fileItem.upload();
      }

      uploadModal = $modal({scope: $scope, title: 'Bilder hinzufügen', uploader: $scope.uploader, templateUrl: 'gallery/uploadimagesmodal', show: false});
      uploadModal = prepairUploadModal(uploadModal, imageBlocks, contentBlocks);

      return getUploadModal();
    };

    var getSelects = function (imageBlocks, contentBlocks) {
      var blockNames = Object.keys(imageBlocks);
      var result = [];
      // console.log("contentBlocks", contentBlocks);
      blockNames.forEach(function (blockName, index, array) {
        var label = ContentService.getByName(contentBlocks, blockName).title || blockName; // TODO WARNING slow!
        result.push({
          label: label,
          value: blockName
        });
      });
      return result;
    }

    var getUploadModal = function() {
      return uploadModal;
    };

    var fix = function(image, page, contentname, cb) {
      if(!image.page || image.page === "") {
        image.page = page;
      }

      if(!image.content || image.content === "") {
        image.content = contentname;
      }

      if(cb) cb(null, image);
      else return image;
    };

    // var setFullScreen = function(image) {
    //   // http://stackoverflow.com/questions/21702375/angularjs-ng-click-over-ng-click
    //   fullscreenImage = image;
    // }

    // var closeFullScreen = function(image) {
    //   Fullscreen.cancel();
    // }

    // Fullscreen.$on('FBFullscreen.change', function(evt, isFullscreenEnabled){
    //   if(!isFullscreenEnabled) {
    //     delete fullscreenImage;
    //   }
    //   $scope.$apply();
    // });

    // var isFullScreen = function(image) {
    //   if(angular.isDefined($scope.fullscreenImage) && angular.isDefined($scope.fullscreenImage.original) && angular.isDefined($scope.fullscreenImage.original.name) && $scope.fullscreenImage.original.name == image.original.name) {
    //     return true;
    //   } else {
    //     return false;
    //   }
    // }

    var saveOne = function(image, page, contentname, cb) {

      image = fix(image, page, contentname);

      var errors = [
        'Bild konnte nicht gespeichert werden'
      ];

      $sailsSocket.put('/gallery/'+image.id, image).success(function(data, status, headers, config) {
        if(angular.isArray(data)) data = data[0];
        // $log.debug (data);
        if(cb) cb(null, data);
      }).
      error(function(data, status, headers, config) {
        $log.error (errors[0], data);
        if(cb) cb(errors[0], data);
      });
    };

    var saveAllBlocks = function(imageBlocks, page, cb) {
      var blockNames = Object.keys(imageBlocks);
      // $log.debug("saveAllBlocks","blockNames" , blockNames);

      $async.map(blockNames,
      function iterator(contentname, cb) {
        saveAll(imageBlocks[contentname], page, contentname, cb);
      }, cb);

      // $async.map(images,
      // function iterator(image, cb) {
      //   saveOne(image, page, contentname, cb);
      // }, cb);
    };

    var saveAll = function(images, page, contentname, cb) {
      $async.map(images,
      function iterator(image, cb) {
        saveOne(image, page, contentname, cb);
      }, cb);
    };

    var remove = function(images, index, image, page, cb) {
      if(typeof(index) === 'undefined' || index === null) {
        index = images.indexOf(image);
      }
      images = SortableService.remove(images, index, image);
      // if image has an id it is saved on database, if not, not
      if(image.id) {
        // $log.debug("remove from server, too" ,image);
        $sailsSocket.delete('/gallery/'+image.id+"?filename="+image.original.name+"&page="+page, {id:image.id, filename:image.original.name, page: page}).success(function(data, status, headers, config) {
          if(cb) cb(null, images)
        }).
        error(function(data, status, headers, config) {
          $log.error (errors[0], data);
          if(cb) cb(data);
        });;
      } else {
        if(cb) cb(null, images);
      }
    };

    var add = function(imageBlocks, contentBlocks, cb) {
      // $log.debug("add");
      uploadModal.$promise.then(uploadModal.show);

      uploadModal = prepairUploadModal(uploadModal, imageBlocks, contentBlocks);

      uploadModal.$scope.$on('modal.hide',function(){
        $log.debug("upload modal closed");
        if(cb) cb();
      });
    };

    // Images for Content
    var addBlock = function(imageBlocks, content, cb) {
      imageBlocks[content.name] = [];
      if(cb) cb(null, imageBlocks[content.name]);
      else return imageBlocks[content.name];
    }

    var edit = function(image, cb) {
      $log.debug("edit", image);
      editModal.$scope.image = image;
      //- Show when some event occurs (use $promise property to ensure the template has been loaded)
      editModal.$promise.then(editModal.show);

      editModal.$scope.$on('modal.hide',function(){
        $log.debug("edit closed");
        if(cb) cb(null, editModal.$scope.image);
      });
    };

    var aspect = function (image, width)  {
      var height, scale, aspectRatio, win, paddingTopBottom = 0, paddingLeftRight = 0;
      if($scope.isFullScreen(image)) {
        // customised jQuery Method of http://css-tricks.com/perfect-full-page-background-image/
        aspectRatio = image.original.width / image.original.height;
        win = $rootScope.getWindowDimensions();
        if(win.width / win.height < aspectRatio) {
          width = win.width; // width 100%
          scale = image.original.width / width;
          height = image.original.height / scale;
          paddingTopBottom = (win.height - height) / 2;
          height = win.height;
        } else {
          height = win.height;  // height 100%
          scale = image.original.height / height;
          width = image.original.width / scale;
          paddingLeftRight = (win.width - width) / 2;
          width = win.width;
        }
        return {width: width+'px', height: height+'px', 'padding-right': paddingLeftRight+"px", 'padding-left': paddingLeftRight+"px", 'padding-top': paddingTopBottom+"px", 'padding-bottom': paddingTopBottom+"px" };
      } else {
        scale = image.original.width / width;
        height =  image.original.height / scale;
        return {width: width+'px', height: height+'px'};
      }
    };

    var subscribe = function () {
      $sailsSocket.subscribe('gallery', function(msg) {
        $log.debug(msg);

        switch(msg.verb) {
          case 'updated':
            if($rootScope.authenticated)
              $log.debug('success', 'Ein Bild wurde aktualisiert', msg.data.original.name);
              // $rootScope.pop('success', 'Ein Bild wurde aktualisiert', msg.data.original.name);
          break;
          case 'created':
            // TODO not broadcast / fired why?!
            if($rootScope.authenticated)
              $rootScope.pop('success', 'Ein Bild wurde hochgeladen', msg.data.original.name);
            $scope.images.push(msg.data);
          break;
          case 'removedFrom':
            if($rootScope.authenticated)
              $rootScope.pop('success', 'Ein Bild wurde entfernt', "");
            $log.debug(msg.data);
          break;
          case 'destroyed':
            if($rootScope.authenticated) {
              // $rootScope.pop('success', 'Ein Bild wurde gelöscht', "");
            }
            $log.debug(msg.data);
          break;
          case 'addedTo':
            if($rootScope.authenticated)
              $rootScope.pop('success', 'Ein Bild wurde hinzugefügt', "");
            $log.debug(msg.data);
          break;
        }
      });
    };

    var resolve = function(page, content) {
      var url = '/gallery?limit=0&page='+page;
      if(content) url = url+'&content='+content;
      return $sailsSocket.get(url).then (function (data) {
        return $filter('orderBy')(data.data, 'position');
      }, function error (resp) {
        $log.error(resp);
      });
    };

    return {
      getDropdown: getDropdown,
      setEditModal: setEditModal,
      getEditModal: getEditModal,
      setUploadModal: setUploadModal,
      getUploadModal: getUploadModal,
      saveOne: saveOne,
      saveAll: saveAll,
      saveAllBlocks: saveAllBlocks,
      remove: remove,
      add: add,
      addBlock: addBlock,
      edit: edit,
      aspect: aspect,
      subscribe: subscribe,
      resolve: resolve
    };
  });

;