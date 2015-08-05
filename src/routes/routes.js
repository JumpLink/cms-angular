angular.module('jumplink.cms.routes', [
    'sails.io',
    'jumplink.cms.sails',
    'mgcrea.ngStrap',
    'jumplink.cms.sortable',
    'ngFocus',
    'jumplink.cms.utilities'
  ])

  .service('RoutesService', function ($rootScope, JLSailsService, $log) {

    var create = function(data) {
      if(!data || !data.match) data.match = "";
      if(!data || !data.title) data.title = "";
      if(!data || !data.state) data.state = {};
      if(!data.state.name) data.state.name = "";
      if(!data.state.url) data.state.url = "";
      if(!data || !data.fallback) data.fallback = {};
      if(!data.fallback.url) data.fallback.url = "";
      return data;
    }

    var append = function(routes, data, cb) {
      data = create(data);
      $log.debug("[RoutesService] data", data);
      SortableService.append(routes, data, cb);
    };

    var swap = function(routes, index_1, index_2, cb) {
      return SortableService.swap(contents, index_1, index_2, cb);
    };

    var moveForward = function(index, routes, cb) {
      return SortableService.moveForward(index, routes, cb);
    };

    var moveBackward = function(index, routes, cb) {
      return SortableService.moveBackward(index, routes, cb);
    };

    var removeFromClient = function (routes, index, route, cb) {
      if(cb) return SortableService.remove(routes, index, route, cb);
      else return SortableService.remove(routes, index, route);
    };

    var remove = function(routes, index, route, cb) {

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
        }
        return JLSailsService.resolve('/routes/destroy/'+route.id, {id:route.id}, options, cb);
      }
    };

    var find = function(query, callback) {
      $log.debug("[RoutesService.find]");
      var options = {
        method: 'get',
        resultIsArray: true
      }
      return JLSailsService.resolve('/routes/find', query, options, callback);
    }

    return {
      create: create,
      append: append,
      swap: swap,
      moveForward: moveForward,
      moveBackward: moveBackward,
      removeFromClient: removeFromClient,
      remove: remove,
      find: find
    };
  })
;