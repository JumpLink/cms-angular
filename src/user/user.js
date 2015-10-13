angular.module('jumplink.cms.user', [
    'sails.io',
    'jumplink.cms.sails',
  ])

  .service('UserService', function ($rootScope, $sailsSocket, $log, JLSailsService) {
    var isSubscribed = false;

    var save = function(user, callback) {
      if(!angular.isString(user.role)) {
        user.role = "siteadmin";
      }
      
      // update user
      if(angular.isDefined(user.id)) {
        $log.debug("update user: sailsSocket.put('/user/"+user.id+"..'");
        $sailsSocket.put('/user/'+user.id, user).success(function(data, status, headers, config) {
          $log.debug(data, status, headers, config);
          if(angular.isDefined(data) && angular.isDefined(data.password)) {
            delete data.password;
          }
          callback(null, data, status, headers, config);
        });
      } else {
        // create user
        $log.debug("create user: sailsSocket.post('/user..");
        $sailsSocket.post('/user', user).success(function(data, status, headers, config) {
          // TODO FIXME data ist not the request result ?!
          $log.debug("data", data, "status", status, "headers", headers, "config", config);
          if(angular.isDefined(data) && angular.isDefined(data.password)) {
            delete data.password;
          }
          callback(null, data, status, headers, config);
        });
      }
    };

    var subscribe = function () {
      if(!isSubscribed) {
        $sailsSocket.subscribe('user', function(msg){
          if($rootScope.authenticated) {
            $log.debug(msg);
          }
          switch(msg.verb) {
            case 'updated':
              if($rootScope.authenticated) {
                $rootScope.pop('success', 'Ein Benutzer wurde aktualisiert', msg.data.name);
              }
            break;
            case 'created':
              if($rootScope.authenticated) {
                $rootScope.pop('success', 'Ein Benutzer wurde erstellt', msg.data.name);
              }
            break;
            case 'removedFrom':
              if($rootScope.authenticated) {
                $rootScope.pop('success', 'Ein Benutzer wurde entfernt', "");
              }
            break;
            case 'destroyed':
              if($rootScope.authenticated) {
                $rootScope.pop('success', 'Ein Benutzer wurde gelöscht', "");
              }
            break;
            case 'addedTo':
              if($rootScope.authenticated) {
                $rootScope.pop('success', 'Ein Benutzer wurde hinzugefügt', "");
              }
            break;
          }
        });
        isSubscribed = true;
      }
    };

    var removeFromClient = function (users, user) {
      var index = users.indexOf(user);
      $log.debug("removeFromClient", user, index);
      if (index > -1) {
        users.splice(index, 1);
      }
    };

    var remove = function(users, user) {
      $log.debug("$scope.remove", user);
      if($rootScope.authenticated) {
        if(users.length <= 1) {
          $log.error('Der letzte Benutzer kann nicht gelöscht werden.');
        } else {
          removeFromClient(users, user);
          if(user.id) {
            $sailsSocket.delete('/user/'+user.id, {id:user.id}).success(function(data, status, headers, config) {
              $log.debug("user delete request", data, status, headers, config);
            });
          }
        }
      }
    };

    /**
     * find users for any host from database and isert priority from database (or from local.json if no priority is set).
     * Only for superadmins!
     */
    var findByHost = function(host, callback) {
      // $log.debug("[ThemeService.findByHost]", host);
      var options = {
        method: 'post',
        resultIsArray: true
      };
      return JLSailsService.resolve('/user/findbyhost', {host: host}, options, callback);
    };

    var updateOrCreateByHost = function(host, user, callback) {
      $log.debug("[UserService.updateOrCreateByHost]", host, routes);
      var options = {
        method: 'post',
        resultIsArray: false
      };
      return JLSailsService.resolve('/user/updateOrCreateByHost', {host: host, user: user}, options, callback);
    };

    return {
      save: save,
      subscribe: subscribe,
      remove: remove,
      findByHost: findByHost,
      updateOrCreateByHost: updateOrCreateByHost
    };
  })
;