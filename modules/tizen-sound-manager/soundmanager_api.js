// souncmanager_api.js

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
  }).(app);
  extension.setMessageListener(handler);
} // end registerEventHandler()

class SoundManager {

};

exports = new SoundManager();