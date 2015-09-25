angular.module('jumplink.cms.multisite', [
  'sails.io',
  'jumplink.cms.sails'
])
.service('MultisiteService', function ($rootScope, JLSailsService, $log) {

  var resolve = function(query, callback) {
    // $log.debug("[MultisiteService.resolve]");
    var options = {
      method: 'get',
      resultIsArray: true
    };
    return JLSailsService.resolve('/multisite/find', query, options, callback);
  };

  var resolveNames = function(query, callback) {
    // $log.debug("[MultisiteService.resolveNames]");
    var options = {
      method: 'get',
      resultIsArray: true
    };
    return JLSailsService.resolve('/multisite/findnames', query, options, callback);
  };

  var resolveHosts = function(query, callback) {
    // $log.debug("[MultisiteService.resolveNames]");
    var options = {
      method: 'get',
      resultIsArray: true
    };
    return JLSailsService.resolve('/multisite/findhosts', query, options, callback);
  };

  return {
    resolve: resolve,
    resolveNames: resolveNames,
    resolveHosts: resolveHosts
  };
});