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

function native_async_call(method, parameter, callback) {
  var msg = {};
  msg["cmd"] = method;
  msg["args"] = Object.assign({}, parameter);
  var asyncid = async_message_id++;
  msg["asyncid"] = "asyncid_" + asyncid;
  async_map.set(msg["asyncid"], callback);
  extension.internal.postMessage(JSON.stringify(msg));
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
    } // end function
  })(app);
  extension.setMessageListener(handler);
} // end registerEventHandler()

var EE = require('events');
/**
 * @class SoundManager
*  @extends Node.EventEmmitter
 */
class SoundManager extends EE{
  constructor() {
    super();

    registEventHandler(this);
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

exports = new SoundManager();
