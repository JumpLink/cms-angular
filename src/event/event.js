angular.module('jumplink.cms.event', [
  'mgcrea.ngStrap',
  'angular-medium-editor',
  'angularFileUpload',
  'angularMoment',
  'ngFocus',
  'ngAsync',
  'sails.io',
  'jumplink.cms.utilities',
])
.service('EventService', function (moment, UtilityService, $sailsSocket, $async, $log, focus, $modal, FileUploader) {
  var editModal = null;
  var typeModal = null;
  var types = ['lecture', 'panel discussion', 'travel', 'info', 'food', 'other'];
  var page = null;

  var validate = function (event, callback) {
    if(event.title) {
      return fix(event, callback);
    }
    if(angular.isFunction(callback)) {
      return callback("Title not set", event);
    }
    return null;
  };

  var chooseType = function(event, type, hide) {
    event.type = type;
    hide();
  };

  var openTypeChooserModal = function(event) {
    typeModal.$scope.event = event;
    //- Show when some event occurs (use $promise property to ensure the template has been loaded)
    typeModal.$promise.then(typeModal.show);
  };

  var setModals = function($scope, fileOptions, pageString) {

    if(!angular.isString(page)) {
      page = pageString;
    }
    
    editModal = $modal({title: 'Ereignis bearbeiten', templateUrl: '/views/modern/events/editmodal.jade', show: false});
    editModal.$scope.ok = false;
    editModal.$scope.accept = function (hide) {
      editModal.$scope.ok = true;
      hide();
    };
    editModal.$scope.abort = function (hide) {
      editModal.$scope.ok = false;
      hide();
    };

    // set default fileOptions
    if(angular.isUndefined(fileOptions)) {
      fileOptions = {};
    }

    var uploadOptions = {
      url: 'timeline/upload',
      removeAfterUpload: true,
      // WARN: headers HTML5 only
      headers: {
        options: JSON.stringify(fileOptions)
      }
    };

    editModal.$scope.uploader = new FileUploader(uploadOptions);
    editModal.$scope.openTypeChooserModal = openTypeChooserModal;

    editModal.$scope.uploader.onCompleteItem = function(fileItem, response, status, headers) {
      fileItem.event.download = response.files[0].uploadedAs;
    };
    editModal.$scope.uploader.onProgressItem = function(fileItem, progress) {
      console.info('onProgressItem', fileItem, progress);
    };
    editModal.$scope.upload = function(fileItem, event) {
      fileItem.event = event;
      fileItem.upload();
    };
    typeModal = $modal({title: 'Typ wählen', templateUrl: '/views/modern/events/typechoosermodal.jade', show: false});
    typeModal.$scope.chooseType = chooseType;
    editModal.$scope.$on('modal.hide.before',function(event, editModal) {
      $log.debug("edit closed", event, editModal);
      if(editModal.$scope.ok) {
        return validate(editModal.$scope.event, editModal.$scope.callback);
      }
      if(angular.isFunction(editModal.$scope.callback)) {
        return editModal.$scope.callback("discarded", editModal.$scope.event);
      }
    });
    return getModals();
  };

  var getEditModal = function() {
    return editModal;
  };

  var getTypeModal = function() {
    return typeModal;
  };

  var getModals = function() {
    return {
      editModal: getTypeModal(),
      typeModal: getTypeModal()
    };
  };

  var edit = function(event, eventBlockName, callback) {
    // $log.debug("edit", event);
    editModal.$scope.event = event;
    // editModal.$scope.eventBlockName = eventBlockName;
    editModal.$scope.callback = callback;
    editModal.$scope.ok = false;
    focus('eventtitle');
    //- Show when some event occurs (use $promise property to ensure the template has been loaded)
    editModal.$promise.then(editModal.show);
  };

  var split = function(events) {
    var unknown = [], before = [], after = [];
    for (var i = 0; i < events.length; i++) {
      if(angular.isDefined(events[i].to)) {
        events[i].to = moment(events[i].to);
      }
      if(angular.isDefined(events[i].from)) {
        events[i].from = moment(events[i].from);
        if(events[i].from.isAfter()) {
          after.push(events[i]);
        }
        else {
          before.push(events[i]);
        }
      } else {
        unknown.push(events[i]);
      }
    }
    return {unknown:unknown, before:before, after:after};
  };

  var removeFromClient = function (events, event, eventBlockName, callback) {
    var errors = [
      "no event on client site found to remove"
    ];
    var index = events[eventBlockName].indexOf(event);
    if (index > -1) {
      events[eventBlockName].splice(index, 1);
      if(angular.isFunction(callback)) {
        return callback(null, events);
      }
      return events;
    }
    if(angular.isFunction(callback)) {
      return callback(errors[0], events);
    }
    return errors[0];
  };

  var remove = function(events, event, eventBlockName, callback) {
    // $log.debug("remove event", event, eventBlockName);
    if(event.id) {
      $log.debug(event);
      $sailsSocket.delete('/timeline/'+event.id).success(function(users, status, headers, config) {
        removeFromClient(events, event, eventBlockName, callback);
      });
    } else {
      removeFromClient(events, event, eventBlockName, callback);
    }
  };

  var transform = function(events) {
    events = split(events);
    events.before = UtilityService.invertOrder(events.before);
    return events;
  };

  var merge = function(unknown, before, after) {
    if(angular.isUndefined(unknown)) {
      unknown = [];
    }
    if(angular.isUndefined(before)) {
      before = [];
    }
    if(angular.isUndefined(after)) {
      after = [];
    }
    return unknown.concat(before).concat(after);
  };

  var append = function(events, event, callback) {
    events.unknown.push(event);
    var allEvents = merge(events.unknown, events.before, events.after);
    events = transform(allEvents);
    if(angular.isFunction(callback)) {
      return callback(null, events);
    }
    return events;
  };

  var create = function(data) {
    if(!data || !data.from) {
      data.from = moment();
      data.from.add(1, 'hours');
      data.from.minutes(0);
    }
    if(!data || !data.title) {
      data.title = "";
    }
    if(!data || !data.person) {
      data.person = "";
    }
    if(!data || !data.place) {
      data.place = "";
    }
    if(!data || !data.page) {
      callback("Page not set.");
    }
    return data;
  };

  var createEdit = function(events, event, callback) {
    event = create(event); 
    edit(event, null, callback);
  };

  var fix = function(object, callback) {
    if(!object.name || object.name === "") {
      // Set object.name to object.title but only the letters in lower case
      object.name = object.title.toLowerCase().replace(/[^a-z]+/g, '');
      // $log.debug("set object.name to", object.name);
    }
    if(angular.isFunction(callback)) {
      return callback(null, object);
    }
    return object;
  };

  var fixEach = function(objects, callback) {
    for (var i = objects.length - 1; i >= 0; i--) {
      objects[i] = fix(objects[i]);
    }
    if(angular.isFunction(callback)) {
      return callback(null, objects);
    }
    return objects;
  };

  var refresh = function(eventBlocks) {
    var allEvents = merge(eventBlocks.unknown, eventBlocks.before, eventBlocks.after);
    // $log.debug("allEvents.length", allEvents.length);
    eventBlocks = transform(allEvents);
    // $log.debug("refreshed");
    return eventBlocks;
  };

  var saveOne = function (eventBlocks, eventBlockName, event, callback) {
    var errors = [
      "EventService: Can't save event.",
      "EventService: Can't save event, event to update not found.",
      "EventService: Can't save event, parameters undefind.",
    ];
    if(angular.isDefined(event) && angular.isDefined(eventBlockName) && angular.isDefined(callback)) {
      event = fix(event);
      if(angular.isUndefined(event.id)) {
        // create because id is undefined
        $sailsSocket.post('/timeline', event).success(function(data, status, headers, config) {
          if(angular.isArray(data)) {
            data = data[0];
          }
          // $log.debug("event created", event, data);
          var index = eventBlocks[eventBlockName].indexOf(event);
          if (index > -1) {
            eventBlocks[eventBlockName][index] = data;
            // $log.debug(eventBlocks[eventBlockName][index]);
            callback(null, eventBlocks[eventBlockName][index]);
          } else {
            callback(errors[1]);
          }
        }).error(function (data, status, headers, config) {
          if(angular.isArray(data)) {
            data = data[0];
          }
          $log.error(data, status, headers, config);
          callback(errors[0]);
        });
      } else {
        // update because id is defined
        $sailsSocket.put('/timeline/'+event.id, event).success(function(data, status, headers, config) {
          if(angular.isArray(data)) {
            data = data[0];
          }
          // $log.debug("event updated", event, data);
          event = data;
          callback(null, event);
        }).error(function (data, status, headers, config) {
          $log.error(data, status, headers, config);
          callback(errors[0]);
        });
      }
    } else {
      callback(errors[2]);
    }
  };

  var saveAllInBlock = function(eventBlocks, eventBlockName, callback) {
    $async.map(eventBlocks[eventBlockName], function (event, callback) {
      saveOne(eventBlocks, eventBlockName, event, callback);
    }, callback);
  };


  var saveBlocks = function(eventBlocks, callback) {
    var errors = [
      "EventService: Can't save eventBlocks, parameters undefind."
    ];
    // save just this event if defined
    if(angular.isDefined(eventBlocks) && angular.isDefined(callback)) {
      return $async.map(['after', 'before', 'unknown'], function (eventBlockName, callback) {
        saveAllInBlock(eventBlocks, eventBlockName, callback);
      }, function(err, eventBlocksArray) {
        if(err) {
           $log.error(err);
          if(angular.isFunction(callback)) {
            return callback(err);
          }
        }
        var allEvents = merge(eventBlocksArray[0], eventBlocksArray[1], eventBlocksArray[2]);
        eventBlocks = transform(allEvents);
        return callback(null, eventBlocks);
      });
    }
    $log.error(errors[0]);
    if(angular.isFunction(callback)) {
      return callback(errors[0]);
    }
  };

  var resolve = function(page) {
    return $sailsSocket.get('/timeline').then (function (data) {
      // $log.debug(data);
      return transform(data.data);
    }, function error (resp){
      $log.error("Error on resolve "+page, resp);
    });
  };

  var subscribe = function () {
    $sailsSocket.subscribe('timeline', function(msg){
      $log.debug(msg);
      switch(msg.verb) {
        case 'updated':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Ereignis wurde aktualisiert', msg.data.title);
          }
          findEvent(msg.id, function(error, event, eventBlock, index) {
            if(error) {
              $log.debug(error);
              return error;
            }
            event = msg.data;
            $scope.refresh();
          });
        break;
        case 'created':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Ereignis wurde erstellt', msg.data.title);
          }
          $scope.events.before.push(msg.data);
          $scope.refresh();
        break;
        case 'removedFrom':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Ereignis wurde entfernt', msg.data.title);
          }
          findEvent(msg.id, function(error, event, eventBlock, index) {
            if(error) {
              $log.debug(error);
              return error;
            }
            EventService.removeFromClient($scope.events, event, eventBlock);
          });
        break;
        case 'destroyed':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Ereignis wurde gelöscht', msg.data.title);
          }
          findEvent(msg.id, function(error, event, eventBlock, index) {
            if(error) {
              $log.debug(error);
              return error;
            }
            EventService.removeFromClient($scope.events, event, eventBlock);
          });
        break;
        case 'addedTo':
          if($rootScope.authenticated) {
            $rootScope.pop('success', 'Ein Ereignis wurde hinzugefügt', msg.data.title);
          }
        break;
      }
    });
  };

  return {
    subscribe: subscribe,
    split: split,
    merge: merge,
    append: append,
    transform: transform,
    saveOne: saveOne,
    saveAllInBlock: saveAllInBlock,
    saveBlocks: saveBlocks,
    edit: edit,
    createEdit: createEdit,
    fixEach: fixEach,
    resolve: resolve,
    setModals: setModals,
    refresh: refresh,
    openTypeChooserModal: openTypeChooserModal,
    chooseType: chooseType,
    removeFromClient: removeFromClient,
    remove: remove
  };
});