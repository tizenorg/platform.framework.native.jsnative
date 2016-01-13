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

/**
The Tizen Message Port Module.

`require('tizen-message-port')` returns an instance of the {{#crossLink "MessagePort"}}{{/crossLink}} class.

``` javascript
    var messageport = require('tizen-message-port');

    messageport.listen('port1', function(message, sender) {
      // sender = {appId, portName, trusted}
    });
    messageport.stopListen('port1');
    messageport.listen('port2', true, function(message, sender) {
      // sender = {appId, portName, trusted}
    });
    messageport.stopListen('port2', true);

    var message = {
      // currently processes only two type below
      msg1: 'hello world!',    // str
      msg2: ['hello', 'world'] // str array
    };

    // for one direction
    messageport.send({'appId': appId, 'portName': portName, 'trusted': true},
                     message);

    // for bidirection
    messageport.send({'appId': appId, 'portName': portName, 'trusted': true},
                     message, {'portName': myPortName, 'trusted': true});
```

@module tizen-message-port
**/

'use strict';

var util = require('util');
var EventEmitter = require('events');

var async_message_id = 0;
var async_map = new Map();

function native_sync_call(method, parameter) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  try {
    return JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(args)));
  } catch (e) {
    console.log(e.message);
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

function registerEventHandler(app) {
  var handler = (function(self) {
    return function(json) {
      var msg = JSON.parse(json);
      if (msg['asyncid'] && async_map.has(msg['asyncid'])) {
        var cb = async_map.get(msg['asyncid']);
        async_map.delete(msg['asyncid']);
        if (cb instanceof Function) {
          cb(msg);
        } else {
          console.log('cb is not function');
        }
      } else {
        self.__event_handle__(msg);
      }
    };
  })(app);
  extension.setMessageListener(handler);
}

function convertObjectToMap(obj) {
  var map = new Map();
  for (var key in obj) {
    map.set(key, obj[key]);
  }
  return map;
}

function convertMapToObject(map) {
  var obj = {};
  map.forEach(function(value, key) {
    obj[key] = value;
  });
  return obj;
}

function registerLocalPort(portName, trusted) {
  var args = {'msg': {'localPort': portName,
                      'trusted': trusted.toString()}};
  var ret = native_sync_call('registerLocalPort', args);
  console.log('ret: ' + ret);
  return parseInt(ret['result']);
}

function unregisterLocalPort(localId, trusted) {
  var args = {'msg': {'localId': localId.toString(),
                      'trusted': trusted.toString()}};
  var ret = native_sync_call('unregisterLocalPort', args);
  console.log('ret: ' + ret);
  return parseInt(ret['result']);
}

function findCallbackByLocalId(messagePort, localId) {
  for (var v of messagePort[map_].values()) {
    if (v.localId === localId)
      return v.callback;
  }
  return undefined;
}

var map_ = Symbol();

/**
 * @class MessagePort
 * @public
 * @since 3.0
 */
class MessagePort {
  constructor() {
    this[map_] = new Map();  // { portName, trusted } -> { localId, callback }
    registerEventHandler(this);
  }

   /**
    * @method listen
    * @param {string} portName
    * @param [options] {boolean} trusted
    * @param {function} callback
    */
  listen(portName, trusted, callback) {
    // argument check
    var _callback = null;
    var _trusted = null;
    if (callback == undefined && trusted instanceof Function) {
      _callback = trusted;
      _trusted = false;
    } else {
      _callback = callback;
      _trusted = (trusted === undefined) ? false : trusted;
    }

    var localId = registerLocalPort(portName, _trusted);
    if (localId > 0) {
      var value = {'localId': localId, 'callback': _callback};
      this[map_].set({'portName': portName, 'trusted': _trusted}, value);
    } else {
      console.log('can\'t registered port: ' + portName);
    }
  }

 /**
  * @method stopListen
  * @param {string} portName
  * @param [options] {boolean} trusted
  */
  stopListen(portName, trusted) {
    if (trusted === undefined)
      trusted = false;
    var receiver = {'portName': portName, 'trusted': trusted};
    if (!this[map_].has(receiver))
      return;
    var value = this[map_].get(receiver);
    unregisterLocalPort(value.id, trusted);
    this[map_].delete(receiver);
  }

 /**
  * @method send
  * @param {object} receiver {appId, portName, trusted = false}
  * @param {Map} message
  * @param [options] {object} sender {portName, trusted = false}
  */
  send(receiver, message, sender) {
    if (typeof message !== 'object' && !(message instanceof Map)) {
      throw new Error('[MessagePort::send] Wrong Type of message');
    }

    if (receiver.trusted === undefined)
      receiver.trusted = false;

    var withSender = false;
    if (sender && sender.portName) {
      if (sender.trusted === undefined)
        sender.trusted = false;
      if (this[map_].has(sender))
        withSender = true;
    }

    if (message instanceof Map)
      message = convertMapToObject(message);

    var args = {'msg': {'appId': receiver.appId,
                        'portName': receiver.portName,
                        'trusted': receiver.trusted.toString(),
                        'message': message }};
    if (withSender) {
      args['msg'] = Object.assign(args['msg'], {'localId':
                                                this[map_].get(sender)
                                                .localId.toString()});
    }

    var ret = native_sync_call('send', args);
    return parseInt(ret['result']);
  }

  __event_handle__(msg) {
    if ('listen' == msg['event']) {
      var data = JSON.parse(msg['data']);

      var appId = data['appId'];
      var portName = data['portName'];
      var trusted = (data['trusted'] === 'true');
      var map = convertObjectToMap(data['msg']);
      var sender = {'appId': appId, 'portName': portName, 'trusted': trusted };

      var localId = parseInt(data['localId']);
      var listenCb = findCallbackByLocalId(this, localId);

      if (listenCb && listenCb instanceof Function) {
        listenCb(map, sender);
      } else {
        console.error('can\'t find any callback for listen id: ' + localId);
      }
    } else {
      console.error('invalid event was passed');
    }
  }
};

exports = new MessagePort();
