angular.module('jumplink.cms.user', [
    'sails.io',
  ])

  .service('UserService', function ($rootScope, $sailsSocket, $log) {
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

    return {
      save: save,
      subscribe: subscribe,
      remove: remove
    };
  })
;