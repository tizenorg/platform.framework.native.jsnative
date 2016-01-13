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
 * The Tizen Message Port Module.
 *
 * `require('tizen-message-port')` returns an instance of the
 * {{#crossLink "MessagePort"}}{{/crossLink}} class.
 *
 * ``` javascript
 *     var messageport = require('tizen-message-port');
 *
 *     messageport.listen('port1', function(message, sender) {
 *       // sender = {appId, portName, trusted}
 *     });
 *     messageport.stopListen('port1');
 *     messageport.listen('port2', true, function(message, sender) {
 *       // sender = {appId, portName, trusted}
 *     });
 *     messageport.stopListen('port2', true);
 *
 *     var message = {
 *       // currently processes only two type below
 *       msg1: 'hello world!',    // str
 *       msg2: ['hello', 'world'] // str array
 *     };
 *
 *     // for one direction
 *     messageport.send({'appId': appId, 'portName': portName, 'trusted': true},
 *                      message);
 *
 *     // for bidirection
 *     messageport.send({'appId': appId, 'portName': portName, 'trusted': true},
 *                      message, {'portName': myPortName, 'trusted': true});
 * ```
 *
 * @module tizen-message-port
 * @since 3.0
**/

'use strict';

let util = require('util');
let EventEmitter = require('events');

function native_sync_call(method, parameter) {
  let args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  try {
    return JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(args)));
  } catch (e) {
    console.log(e.message);
    return {};
  }
}

function registerEventHandler(app) {
  let handler = (function(self) {
    return function(json) {
      let msg = JSON.parse(json);
      if (msg['asyncid'] && async_map.has(msg['asyncid'])) {
        let cb = async_map.get(msg['asyncid']);
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
  let map = new Map();
  for (let key in obj) {
    map.set(key, obj[key]);
  }
  return map;
}

function convertMapToObject(map) {
  let obj = {};
  map.forEach(function(value, key) {
    obj[key] = value;
  });
  return obj;
}

function registerLocalPort(portName, trusted) {
  let args = {'msg': {'localPort': portName,
                      'trusted': trusted.toString()}};
  let ret = native_sync_call('registerLocalPort', args);
  return parseInt(ret['result']);
}

function unregisterLocalPort(localId, trusted) {
  let args = {'msg': {'localId': localId.toString(),
                      'trusted': trusted.toString()}};
  let ret = native_sync_call('unregisterLocalPort', args);
  return parseInt(ret['result']);
}

function combinePortNameAndTrusted(portName, trusted) {
  return `___${portName}___${(trusted === true ? 'true' : false)}___`;
}

const map_ = Symbol();

/**
 * The MessagePort class provides functions to communicate between ports.
 * ```
 * var messageport = require('tizen-message-port');
 * ```
 * @class MessagePort
 * @public
 * @since 3.0
 * @public
 */
class MessagePort {
  constructor() {
    this[map_] = new Map();  // `portName, trusted` -> { localId, callback }
    registerEventHandler(this);
  }

  /**
   * Listens message from other ports.
   * @method listen
   * @param {String} portName Port name to listen message from other port.
   * @param [options] {Boolean} trusted Is this port to listen trusted port?
   * This is skipped and its default value is false.
   * @param {Function} callback Callback function to be invoked when this port
   * receives any message.
   * @remarks
   * Note! Each port is different from each own 'trusted' value.
   * For example,
   * ````
   * listen('port1', cb){});  // A port which has its name 'port1' and is not
   *                          // trusted port(because trusted's default value
   *                          // is false if it's skipped).
   * listen('port1', true, cb){});  // Other port which has its name 'port1'
   *                                // and is trusted port.
   * ````
   * @since 3.0
   */
  listen(portName, trusted, callback) {
    if (callback == undefined && trusted instanceof Function) {
      callback = trusted;
      trusted = false;
    }

    let localId = registerLocalPort(portName, trusted);
    if (localId > 0) {
      this[map_].set(combinePortNameAndTrusted(portName, trusted),
                     {'localId': localId, 'callback': callback});
    } else {
      console.log('can\'t registered port: ' + portName);
    }

    console.log('MessagePort::map: ' + util.inspect(this[map_], false, null));
  }

  /**
   * Stops listening message from other ports
   * @method stopListen
   * @param {String} portName Port name to stop listening message from other
   * port.
   * @param [options] {Boolean} trusted Is this port to listen trusted port?
   * This is skipped and false is default.
   * @remarks
   * Note! Each port is different from each own 'trusted' value.
   * For example,
   * ````
   * stopListen('port1');  // A port which has its name 'port1' and is not
   *                       // trusted port(because trusted's default value
   *                       // is false if it's skipped).
   * stopListen('port1', true);  // Other port which has its name 'port1'
   *                             // and is trusted port.
   * ````
   * @since 3.0
   */
  stopListen(portName, trusted) {
    if (trusted === undefined)
      trusted = false;

    let key = combinePortNameAndTrusted(portName, trusted);
    let value = this[map_].get(key);
    if (value === undefined) {
      console.err('can\'t find (%s,%s) in map', portName, trusted);
      return;
    }

    unregisterLocalPort(value.localId, trusted);
    this[map_].delete(key);

    console.log('MessagePort::map: ' + util.inspect(this[map_], false, null));
  }

  /**
   * @method send
   * @param {Object} receiver Receiver to be sent message.
   * * This object has three properties.
   * * - 'appId' - Application Id to be sent message.
   * * - 'portName' - Name of port which is sent message. This port should be in
   * * the application which has the appId.
   * * - 'trusted' - Value whether the port is trusted port or not.
   * * False is default.
   * @param {Map|Object} message Message to send to receiver. Its type can be
   * both Map and Object.
   * * Be carefull about message's contents. Currently, only string value and
   * * string array value are supported.
   * ```
   * // if message's type is Map,
   * var message = new Map();
   * message.set('msg1', 'hello world');
   * message.set('msg2', ['hello', 'world']);
   *
   * // if message's type is Object,
   * var message = {};
   * message.msg1 = 'hello world';
   * message.msg2 = ['hello', 'world'];
   *
   * send({appId: 'sthpkg.sthapp', portNmae: 'hisport'}, message);
   * ```
   * @param [options] {Object} sender Sender to send this message. If you want
   * to inform receiver to know who this message sends. You can skip this
   * parameter.
   * * This object has two properties.
   * * - 'portName' - Name of port which sends message. This port name should be
   * * used as one of message port in your application. It means that in this
   * * JSNative app, you use listen function with this port name. If portName is
   * * a port name which is not used by listen(), send() sends message without
   * * sender information.
   * * - 'trusted' - Value whether the port is trusted port or not.
   * * False is default.
   * @return {boolean} Boolean value whether send() is successful or not.
   * ```
   * send({appId: 'sthpkg.sthapp', portNmae: 'hisport'}, message,
   *      {portName: 'yourport', trusted: true});
   * ```
   * @since 3.0
   */
  send(receiver, message, sender) {
    if (typeof message !== 'object' && !(message instanceof Map)) {
      throw new Error('[MessagePort::send] Wrong Type of message');
    }

    if (receiver.trusted === undefined)
      receiver.trusted = false;

    let withSender = false;
    let keySender;
    if (sender && sender.portName) {
      if (sender.trusted === undefined)
        sender.trusted = false;
      keySender = combinePortNameAndTrusted(sender.portName, sender.trusted);
      if (this[map_].has(keySender))
        withSender = true;
    }

    if (message instanceof Map)
      message = convertMapToObject(message);

    let args = {'msg': {'appId': receiver.appId,
                        'portName': receiver.portName,
                        'trusted': receiver.trusted.toString(),
                        'message': message }};

    if (withSender) {
      args['msg'] = Object.assign(args['msg'],
                                  {'localId': this[map_].get(keySender)
                                              .localId.toString()});
    }

    let ret = native_sync_call('send', args);
    return (parseInt(ret['result']) === 0);
  }

  findCallback(localId) {
    for (let v of this[map_].values()) {
      if (v.localId === localId)
        return v.callback;
    }
    return undefined;
  }

  __event_handle__(msg) {
    if ('listen' == msg['event']) {
      let data = JSON.parse(msg['data']);

      let appId = data['appId'];
      let portName = data['portName'];
      let trusted = (data['trusted'] === 'true');
      let map = convertObjectToMap(data['msg']);
      let sender = {'appId': appId, 'portName': portName, 'trusted': trusted };

      let localId = parseInt(data['localId']);
      let listenCb = this.findCallback(localId);

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
