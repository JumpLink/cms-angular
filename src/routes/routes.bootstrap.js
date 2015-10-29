angular.module('jumplink.cms.bootstrap.routes', [
  'jumplink.cms.routes',
  'jumplink.cms.bootstrap.importexport',
])
.service('RoutesBootstrapService', function ($log, $async, ImportExportBootstrapService, UtilityService, RoutesService, SortableService) {
  var modals = null;
  var host = null;

  var setHost = function (newHost) {
    host = newHost;
  };

  var setupImportModal = function ($scope, onImportFinsih) {
    var fileOptions = {};

    var onCompleteFile = function (err, files) {
      $log.debug("[RoutesBootstrapService.onCompleteFile]", files);
      var data = [];
      for (var i = 0; i < files.length; i++) {
        data = data.concat(files[i].data);
      }
      ImportExportBootstrapService.setImports(data, {identifierKey: 'objectName', descriptionKey: 'title'});
    };

    var onImportStart = function (imports, next) {
      $log.debug("[RoutesBootstrapService.onImportStart]", host);
      $async.map(imports, function (item, callback) {
        if(item.importOptions.doImport === true) {
          RoutesService.updateOrCreateByHostByObjectNameAndNavbar(host, item, callback);
        } else {
          callback();
        }
        
      }, function(err, results) {
        $log.debug("[RoutesBootstrapService.onImportStart] done", err, results);
        results = SortableService.sort(results);
        next(err, results);
      });
      
    };

    var onAbort = function (imports, next) {
      $log.debug("[RoutesBootstrapService.onAbort]");
      next();
    };

    modals = ImportExportBootstrapService.setModals($scope, fileOptions, onCompleteFile, onImportStart, onAbort, onImportFinsih);
  };

  return {
    setHost: setHost,
    setupImportModal: setupImportModal,
    showImportModal: ImportExportBootstrapService.show,
  };

});