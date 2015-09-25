angular.module('jumplink.cms.sortable', [
    'jumplink.cms.utilities'
  ])
  .service('SortableService', function (UtilityService, $log) {
    var resetPosition = function (array) {
      for (var i = array.length - 1; i >= 0; i--) {
        array[i].position = i+1;
      }
      return array;
    };

    /*
     * Swap two elements within the object array (called objects) and adjust the position
     */
    var swap = function(objects, index_1, index_2, cb) {

      var object_1 = objects[index_1];
      var object_2 = objects[index_2];

      // swap position too
      var position_tmp = object_1.position;
      object_1.position = object_2.position;
      object_2.position = position_tmp;

      // IMPORTANT: swap Indexes, too
      objects[index_1] = object_2;
      objects[index_2] = object_1;

      if(angular.isFunction(cb)) {
        return cb(null, objects);
      }
      return objects;
    };

    /*
     * Insert new object to position and move the underlying objects one index back
     * http://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
     */
    var move = function (array, old_index, new_index, cb) {
      $log.debug("[SortableService] move");

      if (new_index >= array.length) {
          var k = new_index - array.length;
          while ((k--) + 1) {
              array.push(undefined);
          }
      }
      array.splice(new_index, 0, array.splice(old_index, 1)[0]);

      array = resetPosition(array);

      if(angular.isFunction(cb)) {
        cb(null, array);
      }
      return array;
    };

    /*
     * Append a new object to array, check unique key value if set
     */
    var append = function(objects, data, cb, unique, uniqueKey) {
      var errors = [
        "Unique key '"+uniqueKey+"' already exist"
      ];
      var new_index = objects.length;
      var new_position = 1;
      var new_object;
      var uniqueIndex = -1;

      var okay = function (new_object, objects, new_index, cb) {
        // $log.debug("old objects", objects);
        objects.push(new_object);
        // $log.debug("new objects", objects);
        if(angular.isFunction(cb)) {
          return cb(null, objects, new_index);
        }
        return objects;
      };

      var error = function (error, objects, uniqueIndex, cb) {
        if(angular.isFunction(cb)) {
          return cb(error, objects, uniqueIndex);
        }
        return error;
      };

      if(new_index >= 1) {
        new_position = objects[new_index-1].position+1;
      }

      new_object = {
        position: new_position,
      };
      angular.extend(new_object, data);
      // $log.debug("new_object", new_object);

      if(unique && new_object[uniqueKey]) {
        uniqueIndex = UtilityService.findKeyValue(objects, uniqueKey, new_object[uniqueKey]);
        if(uniqueIndex > -1) {
          return error(errors[0], objects, uniqueIndex, cb);
        } else {
          return okay(new_object, objects, new_index, cb);
        }
      } else {
        return okay(new_object, objects, new_index, cb);
      }
    };

    /*
     * removed object from an array and adds it in another
     */
    var moveObjectToAnotherArray = function(object, index_from, array_from, array_to, cb, replaceData) {
      var errors = [
        "[SortableService] Error: Function parameters not correctly set"
      ];

      var errorParamsNotSet = function () {
        $log.error(errors[0], object, index_from, array_from, array_to);
        return cb(errors[0]);
      };

      if(object === null) {
        object = array_from[index_from];
      } else if (index_from === null) {
        index_from = array_from.indexOf(object);
      } else {
        errorParamsNotSet();
      }

      if(!angular.isArray(array_from) || !angular.isArray(array_to)) {
        errorParamsNotSet();
      }

      append(array_to, object, function (err, array_to, index_to) {
        if(err) {
          return cb(err);
        }
        remove(array_from, index_from, object, function (err, array_from) {
          if(err) {
            return cb(err);
          }
          return cb(null, {index_from: index_from, array_from: array_from, index_to:index_to, array_to: array_to });
        });
      }, false );
    };

    var moveForward = function(index, objects, cb) {
      if(index + 1 < objects.length ) {
        return swap(objects, index, index+1, cb);
      }
      if(angular.isFunction(cb)) {
        return cb("Can't move forward, index is the last element.", objects);
      }
      return objects;
    };

    var moveBackward = function(index, objects, cb) {
      if(index - 1 >= 0) {
        return swap(objects, index, index-1, cb);
      }
      if(angular.isFunction(cb)) {
        return cb("Can't move backward, index is the first element.", objects);
      }
      return objects;
    };

    var remove = function (objects, index, object, cb) {
      if(typeof(index) === 'undefined' || index === null) {
        index = objects.indexOf(object);
      }
      // $log.debug("remove from client", index, object);
      if (index > -1) {
        objects.splice(index, 1);
      }
      if(angular.isFunction(cb)) {
        return cb(null, objects);
      }
      return objects;
    };

    /*
     * find value by key in array
     */
    var findKeyValue = function (objects, key, value) {
      // $log.debug("findKeyValue", key, value);
      var index = -1;
      for (var i = objects.length - 1; i >= 0 && index <= -1; i--) {
        if(objects[i][key] === value) {
          index = i;
        } 
      }
      return index;
    };

    /*
     * Function for Drag and Drop functionality.
     * Moves an moveable element with the moveFunction (e.g. to swap or insert the obkect).
     * Usually called when the mouse button is released over an existing moveable element.
     */
    var dropMove = function(objects, dropObjectIndex, dragObject, event, cb, moveFunction) {
      if(!moveFunction) {
        moveFunction = move; // swap | move
      }
      var dragObjectIndex = objects.indexOf(dragObject);
      var dropObject = objects[dropObjectIndex];
      $log.debug("[SortableService] dropMove, dragObject:", dragObject, "dragObjectIndex", dragObjectIndex, "dropObject", dropObject, "dropObjectIndex", dropObjectIndex);
      return moveFunction(objects, dragObjectIndex, dropObjectIndex, cb);
    };

    return {
      resetPosition: resetPosition,
      swap: swap,
      moveObjectToAnotherArray: moveObjectToAnotherArray,
      move: move,
      moveForward: moveForward,
      moveBackward: moveBackward,
      remove: remove,
      append: append,
      dropMove: dropMove,
    };
  })

;