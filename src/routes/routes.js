angular.module('jumplink.cms.routes', [
  'ui.router',                 // AngularUI Router: https://github.com/angular-ui/ui-router
  'jumplink.cms.sails',
  'jumplink.cms.sortable',
  'jumplink.cms.utilities',
  'ngDownload'
])
.provider('jlRoutes', function jlRoutesProvider($stateProvider, $urlRouterProvider, $locationProvider) {

  this.html5Mode = $locationProvider.html5Mode;

  this.otherwise = $urlRouterProvider.otherwise;

  this.state = $stateProvider.state;

  this.when = function (url1, url2) {
    $urlRouterProvider.when(url1, url2);
  };

  this.setLayouts = function(layouts) {
    for (var stateName in layouts ) {
      this.state(stateName, layouts[stateName]);
    }
  };

  this.setRoutes = function(routes, routeOptions) {
    /**
     * Load optional addional states.
     * WARNING: Very experimental and dangerous.
     */
    for (var i = 0; i < routes.length; i++) {
      // if is Main Route
      if(routes[i].main) {
        var options = {};
        // set state main url
        if(typeof(routes[i].url) === 'string' && routes[i].url.length > 0) {
          options.url = routes[i].url;
        }
        // WARNING custom states are very experimental
        if(routes[i].customstate === true) {
          // TODO Dirty hack!
          if(angular.isDefined(routes[i].state.resolve) && typeof(routes[i].state.resolve) === 'string' && routes[i].state.resolve.length > 0) {
            eval(routes[i].state.resolve); // jshint ignore:line
            options.resolve = resolve;
          }
          // TODO Dirty hack!
          if(angular.isDefined(routes[i].state.views) && typeof(routes[i].state.views) === 'string' && routes[i].state.views.length > 0) {
            eval(routes[i].state.views); // jshint ignore:line
            options.views = view;
          }
        // states wich are defined in routeOptions
        } else {
          // set state options
          if(angular.isDefined(routes[i].objectName) && angular.isDefined(routeOptions[routes[i].objectName])) {
            // console.log(routeOptions[routes[i].objectName]);
            if(angular.isObject(routeOptions[routes[i].objectName].resolve)) {
              options.resolve = routeOptions[routes[i].objectName].resolve;
            }
            if(angular.isObject(routeOptions[routes[i].objectName].views)) {
              options.views = routeOptions[routes[i].objectName].views;
            }
            
          } else {
            console.error("objectName "+routes[i].objectName+" not found for route "+routes[i]);
          } 
        }
        // If options are set, init state
        if(angular.isDefined(options.url) && angular.isDefined(options.views)) {
          // console.log("New Route", routes[i].state.name, options);
          $stateProvider.state(routes[i].state.name, options);
        }
        //set alternative urls as redirects
        if(angular.isArray(routes[i].alternativeUrls)) {
          for (var a = 0; a < routes[i].alternativeUrls.length; a++) {
            // e.g. $urlRouterProvider.when('/referenzen', '/referenzen/uebersicht');
            console.log("New redirect: "+routes[i].alternativeUrls[a]+" -> "+routes[i].url);
            $urlRouterProvider.when(routes[i].alternativeUrls[a], routes[i].url);
          }
        }
      } else {
        // if route is not a main route
        // if(typeof(routes[i].url) === 'string' && routes[i].url.length > 0) {
        //   options.url = routes[i].url;
        //   $urlRouterProvider.when(routes[i].alternativeUrls[a], routes[i].url);
        // }
        
      }
    }
  };


  this.$get = function jlRoutesFactory() {
    // let's assume that the UnicornLauncher constructor was also changed to
    // accept and use the useTinfoilShielding argument
    return new jlRoutes();
  };
})
.filter('showOnlyMainRoutes', function() {
  // In the return function, we must pass in a single parameter which will be the data we will work on.
  // We have the ability to support multiple other parameters that can be passed into the filter optionally
  return function(routes, active) {
    if(active !== true) {
      return routes;
    }
    var result = [];
    for (var i = 0; i < routes.length; i++) {
      if(routes[i].main === true) {
        result.push(routes[i]);
      }
    }
    return result;
  };
})
.service('RoutesService', function ($rootScope, $download, JLSailsService, $log, SortableService, UtilityService) {

  var create = function(data) {
    $log.debug("[RoutesService.create] data", data);
    if(!angular.isObject(data)) {
      data = {};
    }
    if(!angular.isString(data.match)) {
      data.match = "";
    }
    if(!angular.isString(data.title)) {
      data.title = "";
    }
    if(data.main !== true && data.main !== false) {
      data.main = false;
    }
    if(!angular.isString(data.url)) {
      data.url = "";
    }
    if(!angular.isArray(data.alternativeUrls)) {
      data.alternativeUrls = [];
    }
    if(angular.isUndefined(data.state) || !angular.isObject(data.state)) {
      data.state = {};
    }
    if(!angular.isString(data.state.name)) {
      data.state.name = "";
    }
    if(data.state.customstate !== true && data.state.customstate !== false) {
      data.state.customstate = false;
    }
    if(!angular.isString(data.state.url)) {
      data.state.url = "";
    }
    if(!angular.isString(data.state.views)) {
      data.state.views = "";
    }
    if(!angular.isString(data.state.resolve)) {
      data.state.resolve = "";
    }
    if(!angular.isObject(data.fallback)) {
      data.fallback = {};
    }
    if(!angular.isString(data.fallback.url)) {
      data.fallback.url = "";
    }
    return data;
  };

  var append = function(routes, data, callback) {
    $log.debug("[RoutesService] data before", data);
    data = create(data);
    $log.debug("[RoutesService] data after", data);
    SortableService.append(routes, data, callback);
  };

  var swap = function(routes, index_1, index_2, callback) {
    return SortableService.swap(contents, index_1, index_2, callback);
  };

  var moveForward = function(index, routes, callback) {
    return SortableService.moveForward(index, routes, callback);
  };

  var moveBackward = function(index, routes, callback) {
    return SortableService.moveBackward(index, routes, callback);
  };

  var removeFromClient = function (routes, index, route, callback) {
    if(angular.isFunction(callback)) {
      return SortableService.remove(routes, index, route, callback);
    }
    return SortableService.remove(routes, index, route);
  };

  var remove = function(routes, index, route, callback) {
    if((angular.isUndefined(route) || route === null) && angular.isDefined(index)) {
      route = routes[index];
    }
    if(angular.isUndefined(index) || index === null) {
      index = routes.indexOf(route);
    }
    routes = removeFromClient(routes, index, route);
    // if route has an id it is saved on database, if not, not
    if(route.id) {
      $log.debug("[RoutesService.remove] remove from server, too", route);
      var options = {
        method: 'delete',
        resultIsArray: false
      };
      return JLSailsService.resolve('/routes/destroy/'+route.id, {id:route.id}, options, callback);
    }
  };

  var find = function(query, callback) {
    // $log.debug("[RoutesService.find]");
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/routes/find', query, options, callback);
  };

  var findOne = function(query, callback) {
    // $log.debug("[RoutesService.find]");
    var options = {
      method: 'post',
      resultIsArray: false
    };
    return JLSailsService.resolve('/routes/findOne', query, options, callback);
  };


  /**
   * For superadminsd
   */
  var findByHost = function(query, callback) {
    // $log.debug("[RoutesService.findByHost]");
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/Routes/findByHost', query, options, callback);
  };

  /**
   * For superadminsd
   */
  var exportByHost = function(host, download, callback) {
    // $log.debug("[RoutesService.findByHost]");
    var options = {
      method: 'post',
      resultIsArray: true
    };
    
    return JLSailsService.resolve('/Routes/exportByHost', {host: host}, options, function(err, data) {
      $log.debug("[RoutesService.exportByHost]", err, data);
      if(err) {
        if(download) {
          $download(JSON.stringify(data), "error.txt", "text/plain");
        }
        return callback(err);
      }
      if(download) {
        $download(JSON.stringify(data), "routes.json", "text/json");
      }
      return callback(err, data);
    });
  };

  /**
   * Update or create route (eg. position) for current host.
   */
  var updateOrCreate = function(route, callback) {
    $log.debug("[RoutesService.updateOrCreate]", route);
    var options = {
      method: 'post',
      resultIsArray: false
    };
    return JLSailsService.resolve('/Routes/updateOrCreate', {route: route}, options, callback);
  };

  /**
   * Update or create route for any passed host.
   * Only for superadmins!
   *
   * @param req.param.host Host to save route for
   */
  var updateOrCreateByHostByObjectNameAndNavbar = function(host, route, callback) {
    $log.debug("[RoutesService.updateOrCreateByHostByObjectNameAndNavbar]", host, route);
    var options = {
      method: 'post',
      resultIsArray: false
    };
    return JLSailsService.resolve('/Routes/updateOrCreateByHostByObjectNameAndNavbar', {host: host, route: route}, options, callback);
  };

  /**
   * Update or create route (eg. position) for any passed host.
   * Only for superadmins!
   *
   * @param req.param.host Host to save route for
   */
  var updateOrCreateByHost = function(host, route, callback) {
    $log.debug("[RoutesService.updateOrCreateByHost]", host, route);
    var options = {
      method: 'post',
      resultIsArray: false
    };
    return JLSailsService.resolve('/Routes/updateOrCreateByHost', {host: host, route: route}, options, callback);
  };

  /**
   * Update or create each route (eg. position) for current host.
   */
  var updateOrCreateEach = function(routes, callback) {
    $log.debug("[RoutesService.updateOrCreateEach]", routes);
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/Routes/updateOrCreateEach', {routes: routes}, options, callback);
  };

  /**
   * Update or create each route (eg. position) for any passed host.
   * Only for superadmins!
   *
   * @param req.param.host Host to save route for
   */
  var updateOrCreateEachByHost = function(host, routes, callback) {
    $log.debug("[RoutesService.updateOrCreateEachByHost]", host, routes);
    var options = {
      method: 'post',
      resultIsArray: true
    };
    return JLSailsService.resolve('/Routes/updateOrCreateEachByHost', {host: host, routes: routes}, options, callback);
  };

  var generateObjectnameFromStatename = function (statename) {
    $log.debug("[RoutesController.generateObjectnameFromStatename]", statename);
    var objectname = "";
    var keys = statename.split('.');
    for (var k = 0; k < keys.length; k++) {
      objectname += UtilityService.capitalizeFirstLetter(keys[k]);
    }
    objectname = UtilityService.lowercaseFirstLetter(objectname);
    return objectname;
  };

  var generateObjectnameFromUrl = function (url) {
    var objectname = "";
    var keys = url.split('/');
    for (var k = 0; k < keys.length; k++) {
      objectname += UtilityService.capitalizeFirstLetter(keys[k]);
    }
    objectname = UtilityService.lowercaseFirstLetter(objectname);
    $log.debug("[RoutesController.generateObjectnameFromUrl]", url, keys, objectname, objectname.length);
    return objectname;
  };

  return {
    create: create,
    append: append,
    swap: swap,
    moveForward: moveForward,
    moveBackward: moveBackward,
    removeFromClient: removeFromClient,
    remove: remove,
    destroy: remove, // Alias
    find: find,
    findOne: findOne,
    findByHost: findByHost,
    exportByHost: exportByHost,
    updateOrCreate: updateOrCreate,
    updateOrCreateByHostByObjectNameAndNavbar: updateOrCreateByHostByObjectNameAndNavbar,
    updateOrCreateByHost: updateOrCreateByHost,
    updateOrCreateEach: updateOrCreateEach,
    updateOrCreateEachByHost: updateOrCreateEachByHost,
    saveEachByHost: updateOrCreateEachByHost, // Alias
    generateObjectnameFromStatename: generateObjectnameFromStatename,
    generateObjectnameFromUrl: generateObjectnameFromUrl,
  };
});