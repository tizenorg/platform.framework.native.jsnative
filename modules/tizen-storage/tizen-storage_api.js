'use strict';

var async_message_id = 0;
var async_map = new Map();

var EventEmitter = require('events');

function native_async_call(method, parameter, cb) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  var asyncid = async_message_id++;
  args['asyncid'] = 'asyncid_' + asyncid;
  async_map.set(args['asyncid'], cb);
  extension.postMessage(JSON.stringify(args));
}

function registerEventHandler(app) {
  var handler = (function(self) {
    return function(json) {
      var msg = JSON.parse(json);
      if (msg['asyncid'] && async_map.has(msg['asyncid'])) {
        var cb = async_map.get(msg['asyncid']);
        async_map.delete(msg['asyncid']);
        cb(msg);
      }
      else {
        self.__event_handler__(msg);
      }
    };
  })(app);
  extension.setMessageListener(handler);
}

/**
* @class StorageManager
* @extends EventEmitter
 **/
class StorageManager extends EventEmitter {

  constructor() {
    super();
    registerEventHandler(this);
  }

/*  event/*

  /**
  * @event change
  * @param {string} - New state of the storage
  * * 'unmountable' - Storage is present but cannot be mounted. Typically it happens if the file system of the storage is corrupted
  * * 'removed' - Storage is not present
  * * 'mounted' - Storage is present and mounted with read/write access
  * * 'mounted_read_only' - Storage is present and mounted with read only access
  **/
  __event_handle__(msg) {
    if (msg['event'] == 'change') {
      var data = JSON.parse(msg['data']);
      this.emit('change', data);
    }
    else {
      console.log('invalid event was passed');
    }
  }

/* method */

  /**
  * @method getStorages
  * @return {Storages} Array of Storage objects
  * @privilege http://tizen.org/privilege/filesystem.read
  * @throw
  * * InvalidValueError
  * * OutOfMemoryError
  * * NotFoundError
  **/
  getStorages() {
    return new Promise(function(resolve, reject) {
      native_async_call('getStorages', undefined, function(result) {
      if (result['reason']) {
        reject(new Error(result['reason']));
        return;
      }
      var storage_list = result['storages'].map(function(storage) {
        return new Storage(storage['id'], storage['type'], storage['state'],
                           storage['path'], storage['totalSpace'], storage['availableSpace']);
      });
      resolve(storage_list);
      });
    });
  }

}

/**
* @class Storage
**/

var STORAGE_ID = Symbol();
var STORAGE_TYPE = Symbol();
var STORAGE_STATE = Symbol();
var STORAGE_PATH = Symbol();
var STORAGE_TOTAL_SPACE = Symbol();
var STORAGE_AVAILABLE_SPACE = Symbol();

class Storage {

  constructor(storage_id, storage_type, storage_state,
              storage_path, storage_total_space, storage_available_space) {
    this[STORAGE_ID] = storage_id;
    this[STORAGE_TYPE] = storage_type;
    this[STORAGE_STATE] = storage_state;
    this[STORAGE_PATH] = storage_path;
    this[STORAGE_TOTAL_SPACE] = storage_total_space;
    this[STORAGE_AVAILABLE_SPACE] = storage_available_space;
  }

/* method */

  /**
  * @method getDirectory
  * @param {string} The type of the directory
  * * 'images' - Image directory
  * * 'sounds' - Sounds directory
  * * 'videos' - Videos directory
  * * 'camera' - Camera directory
  * * 'downloads' - Downloads directory
  * * 'music' - Music directory
  * * 'documents' - Documents directory
  * * 'others' - Others directory
  * * 'system_ringtones' - System ringtones directory
  * @return {string} Returns the absolute path of the given standard directory on the storage.
  * @throw
  * * InvalidValueError
  * * OutOfMemoryError
  * * NotFoundError
  **/
  getDirectory(dir_type) {
    var storage_id = this[STORAGE_ID];
    return new Promise(function(resolve, reject) {
      var params = {"id":storage_id, "type":dir_type};
      native_async_call('getDirectory', params, function(result) {
      if (result['reason']) {
        reject(new Error(result['reason']));
        return;
      }
      resolve(result['dir']);
      });
    });
  }

/*attribute*/

  /**
  * @attribute id
  * @type long
  * @readOnly
  **/
  get id() {
    return this[STORAGE_ID];
  }
  /**
  * @attribute type
  * @type string
  * * 'internal' - Internal device storage (built-in storage in a device, non-removable)
  * * 'external' - External storage
  * @readOnly
  **/
  get type() {
    return this[STORAGE_TYPE];
  }
  /**
  * @attribute state
  * @type string
  * * 'unmountable' - Storage is present but cannot be mounted. Typically it happens if the file system of the storage is corrupted
  * * 'removed' - Storage is not present
  * * 'mounted' - Storage is present and mounted with read/write access
  * * 'mounted_read_only' - Storage is present and mounted with read only access
  * @readOnly
  **/
  get state() {
    return this[STORAGE_STATE];
  }
  /**
  * @attribute path
  * @type string
  * @readOnly
  **/
  get path() {
    return this[STORAGE_PATH];
  }
  /**
  * @attribute totalSpace
  * @type unsigned long long
  * @readOnly
  **/
  get totalSpace() {
    return this[STORAGE_TOTAL_SPACE];
  }
  /**
  * @attribute availableSpace
  * @type unsigned long long
  * @readOnly
  **/
  get availableSpace() {
    return this[STORAGE_AVAILABLE_SPACE];
  }

}

exports = new StorageManager();
