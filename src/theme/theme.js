angular.module('jumplink.cms.theme', [
    'sails.io',
    'ngAsync',
    'jumplink.cms.sails'
  ])

  .service('ThemeService', function ($rootScope, $sailsSocket, $log, $async, JLSailsService) {
    var isSubscribed = false;

    var resolve = function(query, callback) {
      $log.debug("[ThemeService.resolve]", query);
      var options = {
        method: 'get',
        resultIsArray: true
      }
      return JLSailsService.resolve('/theme/find', query, options, callback);
    }

    return {
      create: create
    };

    var save = function (themes, callback) {
      updateOrCreateEach(themes, function (err, result) {
        if(angular.isDefined(callback)) callback(err, result);
      });
    }
    
    var updateOrCreateEach = function(themes, callback) {
      $log.debug(themes);
      // $sailsSocket.put('/Theme/updateOrCreateEach', themes).success(function(data, status, headers, config) {
      //   $log.debug(data, status, headers, config);
      //   if(angular.isDefined(callback)) callback(data, status, headers, config)
      // });
      var iterator = function (theme, cb) {
        $sailsSocket.put('/Theme/updateOrCreate', theme).success(function(data, status, headers, config) {
          $log.debug(data, status, headers, config);
          // TODO set error
          
        });
      }
      $async.each(themes, iterator, callback)
      $sailsSocket.put('/Theme/updateOrCreateEach', themes).success(function(data, status, headers, config) {
        $log.debug(data, status, headers, config);
        callback(data, status, headers, config)
      });
    }

    // TODO
    var subscribe = function () {
      if(!isSubscribed) {
        $sailsSocket.subscribe('theme', function(msg){
          if($rootScope.authenticated)
            $log.debug(msg);
          switch(msg.verb) {
            case 'updated':
              if($rootScope.authenticated)
                $rootScope.pop('success', 'Themeeinstellungen wurdne aktualisiert', msg.data);
            break;
            case 'created':
              if($rootScope.authenticated)
                $rootScope.pop('success', 'Themeeinstellungen wurden erstellt', msg.data);
            break;
            case 'removedFrom':
              if($rootScope.authenticated)
                $rootScope.pop('success', 'Themeeinstellungen wurden entfernt', "");
            break;
            case 'destroyed':
              if($rootScope.authenticated)
                $rootScope.pop('success', 'Themeeinstellungen wurden gelöscht', "");
            break;
            case 'addedTo':
              if($rootScope.authenticated)
                $rootScope.pop('success', 'Themeeinstellungen wurden hinzugefügt', "");
            break;
          }
        });
        isSubscribed = true;
      }
    }

    return {
      save: save
      , updateOrCreateEach: updateOrCreateEach
     ,  subscribe: subscribe
    };
  });


;