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

let EventEmitter = require('events');

function native_sync_call(method, parameter) {
  let args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  try {
    return JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(args)));
  } catch (e) {
    console.err(e.message);
    return {};
  }
}

function registerEventHandler(messageport) {
  let handler = (function(self) {
    return function(json) {
      let msg = JSON.parse(json);
      self.__event_handle__(msg);
    };
  })(messageport);
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
  let args = {'msg': {'localPort': String(portName),
                      'trusted': Boolean(trusted)}};
  let ret = native_sync_call('registerLocalPort', args);
  return Number(ret['result']);
}

function unregisterLocalPort(localId, trusted) {
  let args = {'msg': {'localId': Number(localId),
                      'trusted': Boolean(trusted)}};
  let ret = native_sync_call('unregisterLocalPort', args);
  return Number(ret['result']);
}

function combinePortNameAndTrusted(portName, trusted) {
  return `___${portName}___${(trusted === true ? 'true' : 'false')}___`;
}

// `portName, trusted` -> { localId, callback }
const MESSAGE_PORT_MAP = Symbol();

/**
 * The MessagePort class provides functions to communicate between ports.
 * ``` javascript
 * var messageport = require('tizen-message-port');
 * ```
 * @class MessagePort
 * @public
 * @since 3.0
 * @public
 */
class MessagePort {
  constructor() {
    this[MESSAGE_PORT_MAP] = new Map();
    registerEventHandler(this);
  }

  /**
   * Listens message from other ports.
   *
   * ```javascript
   * messageport.listen('port1', function(message, sender) {
   *   // (this callback will be invoked when this port receives any message)
   *   // message is a Map object
   *   // sender = {appId, portName, trusted}
   * });
   * ```
   *
   * This method internally registers a port with the portName which is
   * specified in this method.
   * Two ports can listen with the same portName if one is trusted and
   * the other one is untrusted. For example, the following is allowed:
   *
   * ``` javascript
   * // resgisters an untrusted port with name 'port1'
   * messageport.listen('port1', function(message, sender){});
   *
   * // resgisters a trusted port with name 'port1'
   * messageport.listen('port1', true, function(message, sender){});
   * ```
   *
   * @method listen
   *
   * @param {String} portName The name of the port which will listen.
   * @param {Boolean} [trusted=false] True if the port which will listen is to
   * be registered as a trusted port. False is the default.
   * @param {Function} callback Callback function to be invoked when
   * this port receives any message.
   * The callback function takes two parameters:
   * @param {Map} callback.message Message which is received.
   * @param {Object} [callback.sender] Information of sender who sends
   * this message. If sender sent without own information, sender can be
   * undefined.
   * @param {String} callback.sender.appId Application ID of sender application.
   * @param {String} callback.sender.portName Name of the sender port.
   * @param {Boolean} callback.sender.trusted True if the port which sends this
   * message.
   *
   * @since 3.0
   */
  listen(portName, trusted, callback) {
    if (callback === undefined && trusted instanceof Function) {
      callback = trusted;
      trusted = false;
    }

    let localId = registerLocalPort(portName, trusted);
    if (localId !== NaN && localId > 0) {
      this[MESSAGE_PORT_MAP].set(combinePortNameAndTrusted(portName, trusted),
                                 {'localId': localId, 'callback': callback});
    } else {
      console.error('Failed to registered port: ' + portName);
    }
  }

  /**
   * Stops listening message from other ports.
   *
   * Two ports with the same portName can stop listening if one is trusted and
   * the other one is untrusted. For example, the following is possible:
   *
   * ``` javascript
   * // unresgisters an untrusted port with name 'port1'
   * messageport.stopListen('port1');
   *
   * // unresgisters a trusted port with name 'port1'
   * messageport.stopListen('port1', true);
   * ```
   *
   * @method stopListen
   *
   * @param {String} portName The name of the port which will stop listening
   * port.
   * @param [trusted=false] {Boolean} True if the port which will stop listening
   * is being registered as a trusted port. False is the default.
   *
   * @since 3.0
   */
  stopListen(portName, trusted) {
    let key = combinePortNameAndTrusted(String(portName), Boolean(trusted));
    let value = this[MESSAGE_PORT_MAP].get(key);
    if (value === undefined) {
      console.err('Failed to find (%s,%s) in map', portName, trusted);
      return;
    }
    unregisterLocalPort(value.localId, trusted);
    this[MESSAGE_PORT_MAP].delete(key);
  }

  /**
   * Send one or more messages to a port.
   *
   * ```javascript
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
   * // sends the message without sender information,
   * send({appId: 'receiverAppId', portNmae: 'receiverPortName'}, message);
   *
   * // or sends the message with sender information,
   * send({appId: 'receiverAppId', portNmae: 'receiverPortName'}, message,
   *      {portName: 'senderPort', trusted: true});
   * ```
   *
   * @method send
   *
   * @param {Object} receiver Message receiver information.
   * @param {String} receiver.appId Application ID of receiver application.
   * @param {String} receiver.portName Name of the receiver port.
   * This port should be set to listen by the application with appId.
   * @param {Boolean} [receiver.trusted=false] True if the port which will be
   * received is being registered as a trusted port. False is the default.
   * @param {Map|Object} message Message to send to receiver. Its type can be
   * both Map or Object.
   * * Currently, only string value and string array value are supported.
   * @param {Object} [sender] Information of sender who sends this message.
   * If sender want to send message without own information, set sender
   * undefined.
   * @param {String} sender.portName Name of port which sends message. This port
   * name should be used as one of message port in your application. It means
   * that in this JSNative app, you use listen() with this port name.
   * If portName is a port name which is not used by listen(), send() sends
   * message without sender information.
   * @param {Boolean} [sender.trusted=false] True if the port which will send
   * message is being registered as a trusted port. False is the default.
   *
   * @return {Boolean} True if send() is successful.
   *
   * @since 3.0
   */
  send(receiver, message, sender) {
    if (typeof message !== 'object' && !(message instanceof Map)) {
      throw new Error('[MessagePort::send] Wrong Type of message');
    }

    let withSender = false;
    let keySender;
    if (sender && sender.portName) {
      keySender = combinePortNameAndTrusted(String(sender.portName),
                                            Boolean(sender.trusted));
      if (this[MESSAGE_PORT_MAP].has(keySender))
        withSender = true;
    }

    if (message instanceof Map)
      message = convertMapToObject(message);

    let args = {'msg': {'appId': String(receiver.appId),
                        'portName': String(receiver.portName),
                        'trusted': Boolean(receiver.trusted),
                        'message': Object(message) }};

    if (withSender) {
      args['msg'] = Object.assign(args['msg'],
                                  {'localId': Number(this[MESSAGE_PORT_MAP]
                                                     .get(keySender)
                                                     .localId)});
    }

    let ret = native_sync_call('send', args);
    return (Number(ret['result']) === 0);
  }

  findCallback(localId) {
    for (let v of this[MESSAGE_PORT_MAP].values()) {
      if (v.localId === localId)
        return v.callback;
    }
    return undefined;
  }

  __event_handle__(msg) {
    if ('listen' == msg['event']) {
      let data = JSON.parse(msg['data']);

      let appId = String(data['appId']);
      let portName = data['portName'];
      let trusted = Boolean(data['trusted']);
      let map = convertObjectToMap(data['msg']);
      let sender = {'appId': appId, 'portName': portName, 'trusted': trusted };

      let localId = Number(data['localId']);
      let listenCb = this.findCallback(localId);

      if (listenCb && listenCb instanceof Function) {
        listenCb(map, sender);
      } else {
        console.error('Failed to find any callback for listen id: ' + localId);
      }
    } else {
      console.error('Invalid event was passed');
    }
  }
};

exports = new MessagePort();
