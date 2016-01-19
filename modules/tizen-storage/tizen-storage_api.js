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

function registerEventHandler(manager) {
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
  })(manager);
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
  * @return {Promise|Storage} Storage object of the new state.
  * * 'unmountable' - Storage is present but cannot be mounted. Typically it happens if the file system of the storage is corrupted
  * * 'removed' - Storage is not present
  * * 'mounted' - Storage is present and mounted with read/write access
  * * 'mounted_read_only' - Storage is present and mounted with read only access
  **/
  __event_handle__(msg) {
    if (msg['event'] == 'change') {
      this.emit('change', msg);
    }
    else {
      console.error('invalid event was passed');
    }
  }

/* method */

  /**
  * @method getStorages
  * @return {Promise|Storage[]} Array of Storage objects.
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
                           storage['absolutePath'], storage['totalSpace'], storage['availableSpace']);
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
var STORAGE_ABSOLUTE_PATH = Symbol();
var STORAGE_TOTAL_SPACE = Symbol();
var STORAGE_AVAILABLE_SPACE = Symbol();

class Storage {

  constructor(storageId, storageType, storageState,
              storageAbsolutePath, storageTotalSpace, storageAvailableSpace) {
    this[STORAGE_ID] = storageId;
    this[STORAGE_TYPE] = storageType;
    this[STORAGE_STATE] = storageState;
    this[STORAGE_ABSOLUTE_PATH] = storageAbsolutePath;
    this[STORAGE_TOTAL_SPACE] = storageTotalSpace;
    this[STORAGE_AVAILABLE_SPACE] = storageAvailableSpace;
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
  getDirectory(dirType) {
    var storageId = this[STORAGE_ID];
    return new Promise(function(resolve, reject) {
      if (['images','sounds', 'videos', 'camera', 'downloads', 'music',
           'documents', 'others', 'system_ringtones'].indexOf(dirType) >= 0) {
           dirType
      }
      var params = {"id":storageId, "type":dirType};
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
  * @attribute absolutePath
  * @type string
  * @readOnly
  **/
  get absolutePath() {
    return this[STORAGE_ABSOLUTE_PATH];
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
