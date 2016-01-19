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
    };
  })(app);
  extension.setMessageListener(handler);
}

extension.setMessageListener(function(json) {
  var msg = JSON.parse(json);
  if (msg['asyncid'] && async_map.has(msg['asyncid'])) {
    var cb = async_map.get(msg['asyncid']);
    async_map.delete(msg['asyncid']);
    if (cb instanceof Function) {
      cb(msg);
    } else {
      console.log('cb is not function');
    }
  }
});

/**
* @class Storage
 **/
class Storage {

  constructor() {
    console.log("@@@ Storage class init 0");

/**/
    this.Info_ = new Info();
    this.MemorySizeInfo_ = new MemorySizeInfo();
  }

  /**
  * @method getStorages
  * @return {Storage.Info} Array of Info objects
  * @privilege http://tizen.org/privilege/filesystem.read
  * @throw
  * * InvalidValueError
  * * OutOfMemoryError
  * * NotFoundError
  * @since 3.0
  **/
  getStorages() {
    console.log("@@@ getStorages 0");
    return new Promise(function(resolve, reject) {
      native_async_call('getStorages', undefined, function(result) {
      if (result['reason']) {
        reject(new Error(result['reason']));
        return;
      }
      resolve(result['storages']);
      });
    });
    console.log("@@@ getStorages 1");
  }

  /**
  * @method getMemorySize
  * @param {string} Type of the storage
  * * 'internal' - Internal device storage (built-in storage in a device, non-removable)
  * * 'external' - External storage
  * @return {Storage.MemorySizeInfo} information about the storage size
  **/
  getMemorySize(type) {
    console.log("@@@ getMemorySize 0");
    return new Promise(function(resolve, reject) {
      var args = {'type': type};
      native_async_call('getMemorySize', args, function(result) {
      if (result['reason']) {
        reject(new Error(result['reason']));
        return;
      }
      resolve(result['size']);
      });
    });
    console.log("@@@ getMemorySize 1");
  }

  /**
  * @method getStorage
  * @param {Long} The storage ID
  * @return {Storage.Info} Seleted storage information as Info object
  * @privilege http://tizen.org/privilege/filesystem.read
  * @throw
  * * InvalidValueError
  * * OutOfMemoryError
  * * NotFoundError
  * @since 3.0
  **/
  getStorage(id) {
    console.log("@@@ getStorage 0");
    return new Promise(function(resolve, reject) {
      native_async_call('getStorage', undefined, function(result) {
      if (result['reason']) {
        reject(new Error(result['reason']));
        return;
      }
      resolve(result['storage']);
      });
    });
    console.log("@@@ getStorage 1");
  }

}

/**
* @class Storage.Info
**/
class Info extends EventEmitter {

  constructor() {
    console.log("@@@ Storage.info class init 0");
    super();
    registerEventHandler(this);
  }

  /**
  * @method getStorageSpace
  * @return {unsigned long long} Returns asynchronously the size of the storage in Bytes.
  * @throw
  * * InvalidValueError
  * * OutOfMemoryError
  * * NotFoundError
  * * InternalError
  * @since 3.0
  **/
  getStorageSpace() {
    console.log("@@@ getStandardDirectory 0");
    console.log("@@@ getStandardDirectory 1");
  }

  /**
  * @method getAvailableSpace
  * @return {unsigned long long} Returns asynchronously the free/available space on the storage in Bytes.
  * @throw
  * * InvalidValueError
  * * OutOfMemoryError
  * * NotFoundError
  * * InternalError
  * @since 3.0
  **/
  getAvailableSpace() {
    console.log("@@@ getStandardDirectory 0");
    console.log("@@@ getStandardDirectory 1");
  }

  /**
  * @method getStandardDirectory
  * @param {string} The type of the standard directory
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
  * @since 3.0
  **/
  getStandardDirectory(type) {
    console.log("@@@ getStandardDirectory 0");
    console.log("@@@ getStandardDirectory 1");
  }

/*  event/*
  /**
  * @event state
  * @param {string} state New state of the storage
  * * 'unmountable' - Storage is present but cannot be mounted. Typically it happens if the file system of the storage is corrupted
  * * 'removed' - Storage is not present
  * * 'mounted' - Storage is present and mounted with read/write access
  * * 'mounted_read_only' - Storage is present and mounted with read only access
  **/


/*attribute*/

  /**
  * @attribute id
  * @type long
  * @readOnly
  **/

  /**
  * @attribute type
  * @type string
  * @readOnly
  **/

  /**
  * @attribute rootPath
  * @type string
  * @readOnly
  **/

  /**
  * @attribute absolutePath
  * @type string
  * @readOnly
  **/

}

/**
* @class Storage.MemorySizeInfo
**/
class MemorySizeInfo {
  constructor() {
    console.log("@@@ Storage.MemorySizeInfo class init 0");
  }

  /**
  * @attribute bsize
  * @type unsigned long
  * @readOnly
  **/

  /**
  * @attribute frsize
  * @type unsigned long
  * @readOnly
  **/

  /**
  * @attribute blocks
  * @type long long
  * @readOnly
  **/

  /**
  * @attribute bfree
  * @type long long
  * @readOnly
  **/

  /**
  * @attribute bavail
  * @type long long
  * @readOnly
  **/

  /**
  * @attribute files
  * @type long long
  * @readOnly
  **/

  /**
  * @attribute ffree
  * @type long long
  * @readOnly
  **/

  /**
  * @attribute favail
  * @type long long
  * @readOnly
  **/

  /**
  * @attribute fsid
  * @type unsigned long
  * @readOnly
  **/

  /**
  * @attribute flag
  * @type unsigned long
  * @readOnly
  **/

  /**
  * @attribute namemax
  * @type unsigned long
  * @readOnly
  **/

}

exports = new Storage();
