angular.module('jumplink.cms.routes', [
    'sails.io',
    'jumplink.cms.sails',
    'mgcrea.ngStrap',
    'jumplink.cms.sortable',
    'ngFocus',
    'jumplink.cms.utilities'
  ])

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
  .service('RoutesService', function ($rootScope, JLSailsService, $log, SortableService) {
    var create = function(data) {
      if(!data || !data.match) {
        data.match = "";
      }
      if(!data || !data.title) {
        data.title = "";
      }
      if(!data.main) {
        data.main = false;
      }
      if(!data || !data.state) {
        data.state = {};
      }
      if(!data || !data.url) {
        data.url = "";
      }
      if(!data || !data.alternativeUrls) {
        data.alternativeUrls = [];
      }
      if(!data.state.name) {
        data.state.name = "";
      }
      if(!data.state.customstate) {
        data.state.customstate = false;
      }
      if(!data.state.url) {
        data.state.url = "";
      }
      if(!data.state.views) {
        data.state.views = "";
      }
      if(!data.state.resolve) {
        data.state.resolve = "";
      }
      if(!data || !data.fallback) {
        data.fallback = {};
      }
      if(!data.fallback.url) {
        data.fallback.url = "";
      }
      return data;
    };

    var append = function(routes, data, callback) {
      data = create(data);
      $log.debug("[RoutesService] data", data);
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

    var findByHost = function(query, callback) {
      // $log.debug("[RoutesService.findByHost]");
      var options = {
        method: 'post',
        resultIsArray: true
      };
      return JLSailsService.resolve('/Routes/findByHost', query, options, callback);
    };

    var updateOrCreate = function(route, callback) {
      $log.debug("[RoutesService.updateOrCreate]", route);
      var options = {
        method: 'post',
        resultIsArray: false
      };
      return JLSailsService.resolve('/Routes/updateOrCreate', {route: route}, options, callback);
    };

    var updateOrCreateByHost = function(host, route, callback) {
      $log.debug("[RoutesService.updateOrCreateByHost]", host, route);
      var options = {
        method: 'post',
        resultIsArray: false
      };
      return JLSailsService.resolve('/Routes/updateOrCreateByHost', {host: host, route: route}, options, callback);
    };

    var updateOrCreateEach = function(routes, callback) {
      $log.debug("[RoutesService.updateOrCreateEach]", routes);
      var options = {
        method: 'post',
        resultIsArray: true
      };
      return JLSailsService.resolve('/Routes/updateOrCreateEach', {routes: routes}, options, callback);
    };

    var updateOrCreateEachByHost = function(host, routes, callback) {
      $log.debug("[RoutesService.updateOrCreateEachByHost]", host, routes);
      var options = {
        method: 'post',
        resultIsArray: true
      };
      return JLSailsService.resolve('/Routes/updateOrCreateEachByHost', {host: host, routes: routes}, options, callback);
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
      findByHost: findByHost,
      updateOrCreate: updateOrCreate,
      updateOrCreateByHost: updateOrCreateByHost,
      updateOrCreateEach: updateOrCreateEach,
      updateOrCreateEachByHost: updateOrCreateEachByHost,
      saveEachByHost: updateOrCreateEachByHost, // Alias
    };
  })
;