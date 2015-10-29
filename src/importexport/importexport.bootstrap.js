angular.module('jumplink.cms.bootstrap.importexport', [
  'jumplink.cms.importexport',
  'jumplink.cms.bootstrap.uploader',
  'mgcrea.ngStrap',
  'ngFocus',
])

.service('ImportExportBootstrapService', function ($log, focus, $modal, FileUploader) {

  var uploadModal = null;
  

  /**
   * Setup the upload modal
   */
  var setModals = function($scope, fileOptions, onCompleteItemCallback, onImportStart, onAbort, onImportFinsih) {

    uploadModal = $modal({title: 'JSON importieren', templateUrl: '/views/modern/uploadmodal.bootstrap.jade', show: false});
    uploadModal.$scope.fileOptions = fileOptions;
    uploadModal.$scope.imports = [];

    uploadModal.$scope.ok = false;
    uploadModal.$scope.import = function (hide) {
      uploadModal.$scope.ok = true;

      if(angular.isFunction(onImportStart)) {
        onImportStart(uploadModal.$scope.imports, function (err, results) {
          if(angular.isFunction(onImportFinsih)) {
            onImportFinsih(err, results);
          }
          uploadModal.$scope.imports = [];
          hide();
        });
      } else {
        $log.warn("[ImportExportBootstrapService.abort] onImportStart is not defined!");
        uploadModal.$scope.imports = [];
        hide();
      }

    };
    uploadModal.$scope.abort = function (hide) {
      uploadModal.$scope.ok = false;
      uploadModal.$scope.imports = [];

      if(angular.isFunction(onAbort)) {
        onAbort(uploadModal.$scope.imports, function (err) {
          hide();
        });
      } else {
        $log.warn("[ImportExportBootstrapService.abort] onAbort is not defined!");
        hide();
      }

    };

    // set default fileOptions
    if(angular.isUndefined(uploadModal.$scope.fileOptions)) {
      uploadModal.$scope.fileOptions = {};
    }

    uploadModal.$scope.uploadOptions = {
      url: 'importexport/upload',
      removeAfterUpload: true,
      alias: 'import',

      // WARN: headers HTML5 only
      headers: {
        options: JSON.stringify(uploadModal.$scope.fileOptions)
      }
    };

    uploadModal.$scope.onCompleteItem = function (err, files) {
      $log.debug("[ImportExportBootstrapService.onCompleteItem]");
      if(angular.isFunction(onCompleteItemCallback)) {
        onCompleteItemCallback(err, files);
      }
    };
    uploadModal.$scope.onCompleteAll = function (err, result) {
      $log.debug("[ImportExportBootstrapService.onCompleteAll]");
    };

    // uploadModal.$scope.uploader = new FileUploader($scope.uploadOptions);


    uploadModal.$scope.upload = function(fileItem) {
      fileItem.upload();
    };

    uploadModal.$scope.$on('modal.hide.before',function(modalEvent, uploadModal) {
      $log.debug("edit closed", uploadModal.$scope, uploadModal);
      if(uploadModal.$scope.ok) {

        uploadModal.$scope.callback(null, uploadModal.$scope);
      } else {
        if(uploadModal.$scope.callback) {
          uploadModal.$scope.callback("discarded", uploadModal.$scope);
        }
      }
    });

    return getModals();
  };

  var getUploadModal = function() {
    return uploadModal;
  };

  var getModals = function() {
    return {
      uploadModal: getUploadModal(),
    };
  };

  /**
   * Show the upload modal to upload files
   */
  var show = function(callback) {
    $log.debug("[BlogService.show]");
    uploadModal.$scope.callback = callback;
    uploadModal.$scope.ok = false;
    focus('blogposttitle');
    //- Show when some blogPost occurs (use $promise property to ensure the template has been loaded)
    uploadModal.$promise.then(uploadModal.show);
  };

  var setImports = function (data, options) {
    uploadModal.$scope.imports = uploadModal.$scope.imports.concat(data);
    for (var i = uploadModal.$scope.imports.length - 1; i >= 0; i--) {
      uploadModal.$scope.imports[i].importOptions = {
        doImport: true,
        identifier: uploadModal.$scope.imports[i][options.identifierKey],
        description: uploadModal.$scope.imports[i][options.descriptionKey],
      };
    }  
  };

  return {
    show: show,
    setModals: setModals,
    setImports: setImports,
  };
});