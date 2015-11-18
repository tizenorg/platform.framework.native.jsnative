/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd All Rights Reserved
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

var Type = function() {};

Type.prototype.isBoolean = function(obj) {
  return typeof obj === 'boolean';
};

Type.prototype.isObject = function(obj) {
  return (null !== obj && typeof obj === 'object' && !this.isArray(obj));
};

Type.prototype.isArray = function(obj) {
  return Array.isArray(obj);
};

Type.prototype.isFunction = function(obj) {
  return typeof obj === 'function';
};

Type.prototype.isNumber = function(obj) {
  return typeof obj === 'number';
};

Type.prototype.isString = function(obj) {
  return typeof obj === 'string';
};

Type.prototype.isDate = function(obj) {
  return obj instanceof Date;
};

Type.prototype.isNull = function(obj) {
  return obj === null;
};

Type.prototype.isNullOrUndefined = function(obj) {
  return (obj === null || obj === undefined);
};

Type.prototype.isUndefined = function(obj) {
  return obj === void 0;
};

Type.prototype.isA = function(obj, type) {
  var clas = Object.prototype.toString.call(obj).slice(8, -1);
  return (obj !== undefined) && (obj !== null) && (clas === type);
};

Type.prototype.isEmptyObject = function(obj) {
  for (var property in obj) {
    if (obj.hasOwnProperty(property)) {
      return false;
    }
  }
  return true;
};

Type.prototype.hasProperty = function(obj, prop) {
  return prop in obj;
};

Type.prototype.arrayContains = function(arr, value) {
  return (arr.indexOf(value) > -1);
};

Type.prototype.getValues = function(obj) {
  var ret = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      ret.push(obj[key]);
    }
  }
  return ret;
};

var _type = new Type();

var Converter = function() {};

function _nullableGeneric(func, nullable, val) {
  if (_type.isNull(val) && nullable === true) {
    return val;
  } else {
    return func.apply(null, [].slice.call(arguments, 2));
  }
}

function _toBoolean(val) {
  return Boolean(val);
}

Converter.prototype.toBoolean = function(val, nullable) {
  return _nullableGeneric(_toBoolean, nullable, val);
};

function _toLong(val) {
  var ret = parseInt(val, 10);
  return isNaN(ret) ? (val === true ? 1 : 0) : ret;
}

Converter.prototype.toLong = function(val, nullable) {
  return _nullableGeneric(_toLong, nullable, val);
};

function _toLongLong(val) {
  // According to WebIDL specification this will not be a precise representation
  // of requested val. We're converting the val to signed long and then pass it
  // to C++ to get the value in required range.
  return native_.getResultObject(native_.callSync('Utils_toLongLong', {
    n : _toLong(val)
  }));
}

Converter.prototype.toLongLong = function(val, nullable) {
  return _nullableGeneric(_toLongLong, nullable, val);
};

function _toUnsignedLong(val) {
  return _toLong(val) >>> 0;
}

Converter.prototype.toUnsignedLong = function(val, nullable) {
  return _nullableGeneric(_toUnsignedLong, nullable, val);
};

function _toUnsignedLongLong(val) {
  // According to WebIDL specification this will not be a precise representation
  // of requested val. We're converting the val to signed long and then pass it
  // to C++ to get the value in required range.
  return native_.getResultObject(native_.callSync('Utils_toUnsignedLongLong', {
    n : _toLong(val)
  }));
}

Converter.prototype.toUnsignedLongLong = function(val, nullable) {
  return _nullableGeneric(_toUnsignedLongLong, nullable, val);
};

function _toShort(val) {
  return ((_toLong(val) + 32768) & 0xFFFF) - 32768;
}

Converter.prototype.toShort = function(val, nullable) {
  return _nullableGeneric(_toShort, nullable, val);
};

function _toUnsignedShort(val) {
  return (Math.abs(_toLong(val)) & 0xFFFF);
}

Converter.prototype.toUnsignedShort = function(val, nullable) {
  return _nullableGeneric(_toUnsignedShort, nullable, val);
};

function _toByte(val) {
  return ((_toLong(val) + 128) & 0xFF) - 128;
}

Converter.prototype.toByte = function(val, nullable) {
  return _nullableGeneric(_toByte, nullable, val);
};

function _toOctet(val) {
  return _toLong(val) & 0xFF;
}

Converter.prototype.toOctet = function(val, nullable) {
  return _nullableGeneric(_toOctet, nullable, val);
};

function _toDouble(val) {
  var ret = Number(val);
  if (isNaN(ret) || !isFinite(ret)) {
    throw new Error('Cannot convert ' + String(val) + ' to double.');
  }
  return ret;
}

Converter.prototype.toDouble = function(val, nullable) {
  return _nullableGeneric(_toDouble, nullable, val);
};

function _toString(val) {
  return String(val);
}

Converter.prototype.toString = function(val, nullable) {
  return _nullableGeneric(_toString, nullable, val);
};

function _toPlatformObject(val, types) {
  var v;
  var t;
  if (_type.isArray(val)) {
    v = val;
  } else {
    v = [val];
  }

  if (_type.isArray(types)) {
    t = types;
  } else {
    t = [types];
  }
  var match = false;
  for (var i = 0; i < t.length; ++i) {
    for (var j = 0; j < v.length; ++j) {
      match = match || (v[j] instanceof t[i]);
    }
  }
  if (match) {
    return val;
  }

  throw new Error('Cannot convert ' +
                  String(val) + ' to ' + String(t[0].name) + '.');
}

Converter.prototype.toPlatformObject = function(val, types, nullable) {
  return _nullableGeneric(_toPlatformObject, nullable, val, types);
};

function _toFunction(val) {
  if (_type.isFunction(val)) {
    return val;
  }

  throw new Error('Cannot convert ' + String(val) + ' to function.');
}

Converter.prototype.toFunction = function(val, nullable) {
  return _nullableGeneric(_toFunction, nullable, val);
};

function _toArray(val) {
  if (_type.isArray(val)) {
    return val;
  }

  throw new Error('Cannot convert ' + String(val) + ' to array.');
}

Converter.prototype.toArray = function(val, nullable) {
  return _nullableGeneric(_toArray, nullable, val);
};

function _toDictionary(val) {
  if (_type.isObject(val) || _type.isFunction(val)) {
    return val;
  }

  throw new Error('Cannot convert ' + String(val) + ' to dictionary.');
}

Converter.prototype.toDictionary = function(val, nullable) {
  return _nullableGeneric(_toDictionary, nullable, val);
};

function _toEnum(val, e) {
  var v = _toString(val);
  if (_type.arrayContains(e, v)) {
    return v;
  }

  throw new Error('Cannot convert ' + v + ' to enum.');
}

Converter.prototype.toEnum = function(val, e, nullable) {
  return _nullableGeneric(_toEnum, nullable, val, e);
};

var _converter = new Converter();

var Validator = function() {
  this.Types = {
    BOOLEAN: 'BOOLEAN',
    LONG: 'LONG',
    LONG_LONG: 'LONG_LONG',
    UNSIGNED_LONG: 'UNSIGNED_LONG',
    UNSIGNED_LONG_LONG: 'UNSIGNED_LONG_LONG',
    BYTE: 'BYTE',
    OCTET: 'OCTET',
    DOUBLE: 'DOUBLE',
    STRING: 'STRING',
    FUNCTION: 'FUNCTION',
    DICTIONARY: 'DICTIONARY',
    PLATFORM_OBJECT: 'PLATFORM_OBJECT',
    LISTENER: 'LISTENER',
    ARRAY: 'ARRAY',
    ENUM: 'ENUM',
    FILE_REFERENCE: 'FILE_REFERENCE'
  };
};


/**
 * Verifies if arguments passed to function are valid.
 *
 * Description of expected arguments.
 * This is an array of objects, each object represents one argument.
 * First object in this array describes first argument, second object describes second
 * argument, and so on.
 * Object describing an argument needs to have two properties:
 *   - name - name of the argument,
 *   - type - type of the argument, only values specified in Validator.Types are allowed.
 * Other properties, which may appear:
 *   - optional - if set to value which evaluates to true, argument is optional
 *   - nullable - if set to to true, argument may be set to null
 *   - values - required in case of some objects, value depends on type
 *   - validator - function which accepts a single parameter and returns true or false;
 *                 if this property is present, this function will be executed,
 *                 argument converted to expected type is going to be passed to this function
 *
 * @param {Array} a - arguments of a method
 * @param {Array} d - description of expected arguments
 * @return {Object} which holds all available arguments.
 * @throws TypeMismatchError if arguments are not valid
 *
 * @code
 * [
 *   {
 *     name: 'first',
 *     type: 'aType'
 *   }
 * ]
 * @code
 * [
 *   {
 *     name: 'first',
 *     type: 'aType',
 *     optional: true
 *   }
 * ]
 * @code
 * [
 *   {
 *     name: 'first',
 *     type: 'aType',
 *     nullable: true
 *   }
 * ]
 * @code
 * [
 *   {
 *     name: 'first',
 *     type: 'aType',
 *     optional: true,
 *     nullable: true
 *   }
 * ]
 * @code
 * [
 *   {
 *     name: 'first',
 *     type: Validator.Types.PLATFORM_OBJECT,
 *     values: ApplicationControl // type of platform object
 *   }
 * ]
 * @code
 * [
 *   {
 *     name: 'first',
 *     type: Validator.Types.PLATFORM_OBJECT,
 *     values: [Alarm, AlarmRelative, AlarmAbsolute] // accepted types
 *   }
 * ]
 * @code
 * [
 *   {
 *     name: 'first',
 *     type: Validator.Types.LISTENER,
 *     values: ['onsuccess', 'onfailure'] // array of callbacks' names
 *   }
 * ]
 * @code
 * [
 *   {
 *     name: 'first',
 *     type: Validator.Types.ARRAY,
 *     values: ApplicationControlData // type of each element in array,
 *                                    // tested with instanceof
 *   }
 * ]
 * @code
 * [
 *   {
 *     name: 'first',
 *     type: Validator.Types.ARRAY,
 *     values: Validator.Types.DOUBLE // converts elements, only primitive types are supported
 *   }
 * ]
 * @code
 * [
 *   {
 *     name: 'first',
 *     type: Validator.Types.ENUM,
 *     values: ['SCREEN_DIM', 'SCREEN_NORMAL', 'CPU_AWAKE'] // array of allowed values
 *   }
 * ]
 */
Validator.prototype.validateArgs = function(a, d) {
  var args = {has: {}};

  for (var i = 0; i < d.length; ++i) {
    var name = d[i].name;
    args.has[name] = (i < a.length);

    var optional = d[i].optional;
    var nullable = d[i].nullable;
    var val = a[i];

    if (args.has[name] || !optional) {
      var type = d[i].type;
      var values = d[i].values;

      switch (type) {
        case this.Types.BOOLEAN:
          val = _converter.toBoolean(val, nullable);
          break;

        case this.Types.LONG:
          val = _converter.toLong(val, nullable);
          break;

        case this.Types.LONG_LONG:
          val = _converter.toLongLong(val, nullable);
          break;

        case this.Types.UNSIGNED_LONG:
          val = _converter.toUnsignedLong(val, nullable);
          break;

        case this.Types.UNSIGNED_LONG_LONG:
          val = _converter.toUnsignedLongLong(val, nullable);
          break;

        case this.Types.BYTE:
          val = _converter.toByte(val, nullable);
          break;

        case this.Types.OCTET:
          val = _converter.toOctet(val, nullable);
          break;

        case this.Types.DOUBLE:
          val = _converter.toDouble(val, nullable);
          break;

        case this.Types.STRING:
          val = _converter.toString(val, nullable);
          break;

        case this.Types.FUNCTION:
          val = _converter.toFunction(val, nullable);
          break;

        case this.Types.DICTIONARY:
          val = _converter.toDictionary(val, nullable);
          break;

        case this.Types.PLATFORM_OBJECT:
          val = _converter.toPlatformObject(val, values, nullable);
          break;

        case this.Types.LISTENER:
          if (_type.isNull(val)) {
            if (!nullable) {
              throw new Error('Argument "' + name + '" cannot be null.');
            }
          } else {
            if (!_type.isObject(val)) {
              throw new Error('Argument "' + name + '" should be an object.');
            }
            for (var ii = 0; ii < values.length; ++ii) {
              if (_type.hasProperty(val, values[ii])) {
                val[values[ii]] = _converter.toFunction(val[values[ii]], false);
              }
            }
          }
          break;

        case this.Types.ARRAY:
          val = _converter.toArray(val, nullable);
          if (!_type.isNull(val) && values) {
            var func;

            switch (values) {
              case this.Types.BOOLEAN:
                func = _converter.toBoolean;
                break;

              case this.Types.LONG:
                func = _converter.toLong;
                break;

              case this.Types.LONG_LONG:
                func = _converter.toLongLong;
                break;

              case this.Types.UNSIGNED_LONG:
                func = _converter.toUnsignedLong;
                break;

              case this.Types.UNSIGNED_LONG_LONG:
                func = _converter.toUnsignedLongLong;
                break;

              case this.Types.BYTE:
                func = _converter.toByte;
                break;

              case this.Types.OCTET:
                func = _converter.toOctet;
                break;

              case this.Types.DOUBLE:
                func = _converter.toDouble;
                break;

              case this.Types.STRING:
                func = _converter.toString;
                break;

              default:
                func = function(val) {
                  if (!(val instanceof values)) {
                    throw new Error('Items of array "' + name +
                                    '" should be of type: ' + values + '.');
                  }
                  return val;
                };
            }

            for (var j = 0; j < val.length; ++j) {
              val[j] = func(val[j]);
            }
          }
          break;

        case this.Types.ENUM:
          val = _converter.toEnum(val, values, nullable);
          break;

        case this.Types.FILE_REFERENCE:
          if (_type.isObject(val) && 'File' === val.constructor.name && val.fullPath) {
            val = val.fullPath;
          }
          val = _converter.toString(val, nullable);
          break;

        default:
          throw new Error('Unknown type: "' + type + '".');
      }

      var _validator = d[i].validator;

      if (_type.isFunction(_validator) && !_validator(val)) {
        throw new Error('Argument "' + name +
                        '" did not pass additional validation.');
      }

      args[name] = val;
    }
  }

  return args;
};

module.exports = new Validator();
