angular.module('jumplink.cms.theme', [
  'sails.io',
  'ngAsync',
  'jumplink.cms.sails',
])

.service('ThemeService', function ($rootScope, $sailsSocket, $log, $async, JLSailsService) {
  var isSubscribed = false;

  /**
   * find themes for current host from database and isert priority from database (or from local.json if no priority is set).
   * @see CMS.ThemesController.find
   */
  var find = function(query, callback) {
    $log.debug("[ThemeService.find]", query);
    var options = {
      method: 'get',
      resultIsArray: true
    };
    return JLSailsService.resolve('/theme/find', query, options, callback);
  };

  /**
   * find themes for any host from database and isert priority from database (or from local.json if no priority is set).
   * Only for superadmins!
   */
  var findByHost = function(host, callback) {
    // $log.debug("[ThemeService.findByHost]", host);
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/theme/findbyhost', {host: host}, options, callback);
  };

  var save = function (themes, callback) {
    updateOrCreateEach(themes, function (err, result) {
      if(angular.isDefined(callback)) {
        callback(err, result);
      }
    });
  };
  
  var updateOrCreateEach = function(themes, callback) {
    $log.debug("[ThemeService.updateOrCreateEach]", themes);
    // $sailsSocket.put('/Theme/updateOrCreateEach', {themes: themes}).success(function(data, status, headers, config) {
    //   $log.debug(data, status, headers, config);
    //   callback(data, status, headers, config)
    // });
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/Theme/updateOrCreateEach', {themes: themes}, options, callback);
  };

  var updateOrCreateEachByHost = function(host, themes, callback) {
    // $log.debug("[ThemeService.updateOrCreateEachByHost]", host, themes);
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/Theme/updateOrCreateEachByHost', {host: host, themes: themes}, options, callback);
  };

  // TODO
  var subscribe = function () {
    if(!isSubscribed) {
      $sailsSocket.subscribe('theme', function(msg){
        if($rootScope.authenticated) {
          $log.debug(msg);
        }
        switch(msg.verb) {
          case 'updated':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Themeeinstellungen wurdne aktualisiert', msg.data);
            }
          break;
          case 'created':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Themeeinstellungen wurden erstellt', msg.data);
            }
          break;
          case 'removedFrom':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Themeeinstellungen wurden entfernt', "");
            }
          break;
          case 'destroyed':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Themeeinstellungen wurden gelöscht', "");
            }
          break;
          case 'addedTo':
            if($rootScope.authenticated) {
              $rootScope.pop('success', 'Themeeinstellungen wurden hinzugefügt', "");
            }
          break;
        }
      });
      isSubscribed = true;
    }
  };

  return {
    find: find,
    findByHost: findByHost,
    save: save,
    updateOrCreateEach: updateOrCreateEach,
    updateOrCreateEachByHost: updateOrCreateEachByHost,
    subscribe: subscribe
  };
});