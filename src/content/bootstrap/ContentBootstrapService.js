angular.module('jumplink.cms.bootstrap.content', [
  'jumplink.cms.content',
])
/**
 * TODO move other bootstrap stuff from  ContentService to this ContentBootstrapService
 */
.service('ContentBootstrapService', function ($log, $async, ImportExportBootstrapService, UtilityService, ContentService, SortableService) {
  var modals = null;
  var host = null;

  var setHost = function (newHost) {
    host = newHost;
  };

  var setupImportModal = function ($scope, onImportFinsih) {
    var fileOptions = {};

    var onCompleteFile = function (err, files) {
      $log.debug("[ContentBootstrapService.onCompleteFile]", files);
      var data = [];
      for (var i = 0; i < files.length; i++) {
        data = data.concat(files[i].data);
      }
      ImportExportBootstrapService.setImports(data, {identifierKey: 'name', descriptionKey: 'title'});
    };

    var onImportStart = function (imports, next) {
      $log.debug("[ContentBootstrapService.onImportStart]", host);
      $async.map(imports, function (item, callback) {
        if(item.importOptions.doImport === true) {
          ContentService.updateOrCreateByHostByTitleAndPage(host, item, callback);
        } else {
          callback();
        }
        
      }, function(err, results) {
        $log.debug("[ContentBootstrapService.onImportStart] done", err, results);
        results = SortableService.sort(results);
        next(err, results);
      });
      
    };

    var onAbort = function (imports, next) {
      $log.debug("[ContentBootstrapService.onAbort]");
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