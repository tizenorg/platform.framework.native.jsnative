/*
 * Copyright (c) 2016 Samsung Electronics Co., Ltd All Rights Reserved
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

 'use strict';

var async_message_id = 0;
var async_map = new Map();

var EventEmitter = require('events');

function native_sync_call(method, parameter) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  try {
    return JSON.parse(extension.internal.sendSyncMessage(
        JSON.stringify(args)));
  } catch (e) {
    console.log('recevied message parse error:' + e.message);
    return {};
  }
}

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
        self.__event_handle__(msg);
      }
    };
  })(manager);
  extension.setMessageListener(handler);
}

/**
* The StorageManager class provides functions to get information about storage
*
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
  * Emitted when a storage status is changed.
  *
  * @event change
  * @param {Storage} Storage object of the new state.
  **/
  __event_handle__(ev) {
    if (ev['event'] === 'change') {
      this.emit('change', new Storage(ev['id'], ev['type'], ev['state'],
              ev['absolutePath'], ev['totalSpace'], ev['availableSpace']));
    }
    else {
      console.error('invalid event was passed');
    }
  }

/* method */

  /**
  * Returns the storages object.
  *
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
            storage['absolutePath'], storage['totalSpace'],
            storage['availableSpace']);
      });
      resolve(storage_list);
      });
    });
  }

}

/**
* The Storage class provides information of storage
*
* @class Storage
**/

var STORAGE_ID = Symbol();
var STORAGE_TYPE = Symbol();
var STORAGE_STATE = Symbol();
var STORAGE_ABSOLUTE_PATH = Symbol();
var STORAGE_TOTAL_SPACE = Symbol();
var STORAGE_AVAILABLE_SPACE = Symbol();

class Storage {

  constructor(storageId, storageType, storageState, storageAbsolutePath,
      storageTotalSpace, storageAvailableSpace) {
    this[STORAGE_ID] = storageId;
    this[STORAGE_TYPE] = storageType;
    this[STORAGE_STATE] = storageState;
    this[STORAGE_ABSOLUTE_PATH] = storageAbsolutePath;
    this[STORAGE_TOTAL_SPACE] = storageTotalSpace;
    this[STORAGE_AVAILABLE_SPACE] = storageAvailableSpace;
  }

/* method */

  /**
  * Returns the absolute path of the given standard directory on the storage.
  *
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
  * @return {string} absolute path of the given directory on the storage.
  * @throw
  * * InvalidValueError
  * * OutOfMemoryError
  * * NotFoundError
  **/
  getDirectory(dirType) {
    var storageId = this[STORAGE_ID];
	if (['images', 'sounds', 'videos', 'camera', 'downloads', 'music',
        'documents', 'others', 'system_ringtones'].indexOf(dirType) < 0) {
      dirType = undefined;
    }
	var args = {'id':storageId, 'type':dirType};
	var result = native_sync_call('getDirectory', args);
	return result['dir'];
  }

/*attribute*/

  /**
  * Get id of storage
  *
  * @attribute id
  * @type long
  * @readOnly
  **/
  get id() {
    return this[STORAGE_ID];
  }
  /**
  * Get type of storage
  *
  * @attribute type
  * @type string
  * * 'internal' - Internal device storage
  * * 'external' - External storage
  * @readOnly
  **/
  get type() {
    return this[STORAGE_TYPE];
  }
  /**
  * Get state of storage
  *
  * @attribute state
  * @type string
  * * 'unmountable' - Storage is present but cannot be mounted.
  * * 'removed' - Storage is not present
  * * 'mounted' - Storage is present and mounted with read/write access
  * * 'mounted_read_only' - Storage is present and mounted with read only access
  * @readOnly
  **/
  get state() {
    return this[STORAGE_STATE];
  }
  /**
  * Get absolute path of storage
  *
  * @attribute absolutePath
  * @type string
  * @readOnly
  **/
  get absolutePath() {
    return this[STORAGE_ABSOLUTE_PATH];
  }
  /**
  * Get space size of storage
  *
  * @attribute totalSpace
  * @type unsigned long long
  * @readOnly
  **/
  get totalSpace() {
    return this[STORAGE_TOTAL_SPACE];
  }
  /**
  * Get available space size of storage
  *
  * @attribute availableSpace
  * @type unsigned long long
  * @readOnly
  **/
  get availableSpace() {
    return this[STORAGE_AVAILABLE_SPACE];
  }

}

exports = new StorageManager();
