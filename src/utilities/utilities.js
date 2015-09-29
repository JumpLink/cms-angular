angular.module('jumplink.cms.utilities', [
  ])
  .service('UtilityService', function ($log) {
    var invertOrder = function (array) {
      var result = [];
      for (var i = array.length - 1; i >= 0; i--) {
        result.push(array[i]);
      }
      return result;
    };

    /**
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

    /**
     * Capitalize the first character of a string, but not change the case of any of the other letters.
     *
     * @see http://stackoverflow.com/questions/1026069/capitalize-the-first-letter-of-string-in-javascript
     */
    var capitalizeFirstLetter = function (string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    };

    var lowercaseFirstLetter = function (string) {
      return string.charAt(0).toLowerCase() + string.slice(1);
    };

    return {
      invertOrder: invertOrder,
      findKeyValue: findKeyValue,
      capitalizeFirstLetter: capitalizeFirstLetter,
      lowercaseFirstLetter: lowercaseFirstLetter,
    };
  });