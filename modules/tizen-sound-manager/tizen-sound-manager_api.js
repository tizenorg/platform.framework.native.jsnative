// souncmanager_api.js

'use strict'

var EventEmitter = require('events');

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
  var msg = {};
  msg["cmd"] = method;
  msg["args"] = Object.assign({}, parameter);
  return JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(msg)));
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