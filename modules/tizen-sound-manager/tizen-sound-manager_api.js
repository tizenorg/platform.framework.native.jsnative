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

'use strict'


var async_message_id = 0;
var async_map = new Map();

var EE = require('events');

function native_async_call(method, parameter, callback) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);  // https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
  var asyncid = async_message_id++;
  args['asyncid'] = 'asynid_' + asyncid;
  async_map.set(args['asyncid'], callback);  // set the map with (key: id, value: cb) in js layer
  extension.postMessage(JSON.stringify(args));  // send JSON object to native layer
}

function native_sync_call(method, parameter) {
  var args = {};
  args["cmd"] = method;
  args = Object.assign(args, parameter);
  try {
    return extension.internal.sendSyncMessage(JSON.stringify(args));
  } catch (e) {
    console.log(e.message);
    return {};
  }
}

function registerEventHandler(app) {
  var handler = (function(self) {
    return function(json) {
      var msg = JSON.parse(json);
      if (msg["asyncid"] && async_map.has(msg["asyncid"])) {
        var callback = async_map.get(msg["asyncid"]);
        async_map.delete(msg["asyncid"]);
        if (callback instanceof Function) {
          callback(msg);
        } else {
          console.log("callback in not function");
        } // end if
      } else {
        self.__event_handle__(msg);
      } // end if
    }; // end function
  })(app);
  extension.setMessageListener(handler);
} // end registerEventHandler()

/**
 * @class SoundManager
*  @extends Node.EventEmmitter
 */
class SoundManager extends EE{
  constructor() {
    super();

    registerEventHandler(this);
  }

  __event_handle__(msg) {
    if (msg['event'] == 'connect') {
      var connectedEvent;
      //todo
      this.emit('connect', connectedEvent);
    } else if (msg['event'] == 'changedDeviceInfo') {
      var deviceInfo;
     //todo
      this.emit('changedDeviceInfo', deviceInfo);
    } else if (msg['event'] == 'interrupt') {
      var interruptEvent;
      //todo
      this.emit('interrupt', interruptEvent);
    } else if (msg['event'] == 'volume') {
      var volumeLevel;
      //todo
      this.emit('volume', volumeLevel);
    } else {
      console.log('invalid event was passed');
    }
  }


};

class Volume extends EE{
  constructor() {
    super();
    registerEventHandler(this);
  }

  get currentSoundType() {
    console.log("get currentSoundType");
    var ret = native_sync_call('getcurrentSoundType');
    return ret;
  }

  set currentSoundType(type) {
    console.log("set currentSoundType");
    var args = {'soundtype':type};
    var ret = native_sync_call('setcurrentSoundType',args);
  }

  getMaxVolume(type) {
    console.log("enter getMaxVolume");
    var args = {'soundtype':type};
    var ret = native_sync_call('getMaxVolume',args);
    return ret;
  }

  getVolume(type) {
    console.log("enter getVolume");
    var args = {'soundtype':type};
    var ret = native_sync_call('getVolume',args);
    return ret;
  }

  setVolume(type, volume) {
    console.log("enter setVolume");
    var args = {'soundtype':type, 'volume':volume};
    var ret = native_sync_call('setVolume',args);
  }

  __event_handle__(ev) {
  console.log('__event_handle__ : ' + ['event']);
    var change = false;
    if (ev['event'] === 'volume.change') {
        this.emit('change',ev['type'],ev['volume']);
    }
  }

}

exports = new SoundManager();
