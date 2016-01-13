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
 *     messageport.stopListening('port1');
 *     messageport.listen('port2', true, function(message, sender) {
 *       // sender = {appId, portName, trusted}
 *     });
 *     messageport.stopListening('port2', true);
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

function getNewErrorFromNativeMessage(reason) {
  if (reason === undefined || typeof reason !== 'string')
    return undefined;

  let errorType;
  switch (reason) {
    case 'invalid parameter':
    errorType = 'InvalidValueError';
    break;
    case 'port not found':
    errorType = 'NotFoundError';
    break;
    case 'max exceeded':
    errorType = 'QuotaError';
    break;
    case 'resource unavailable':
    errorType = 'InvalidStateError';
    break;
    case 'out of memory':
    errorType = 'OutOfMemoryError';
    break;
    case 'io error':
    errorType = 'IOError';
    break;
    case 'certificate not match':
    errorType = 'InvalidOperationError';
    break;
    default:
    return undefined;
  }

  return new Error(errorType);
}

function registerLocalPort(portName, trusted) {
  let args = {'msg': {'localPort': String(portName),
                      'trusted': Boolean(trusted)}};
  let ret = native_sync_call('registerLocalPort', args);
  return ret;
}

function unregisterLocalPort(localId, trusted) {
  let args = {'msg': {'localId': Number(localId),
                      'trusted': Boolean(trusted)}};
  let ret = native_sync_call('unregisterLocalPort', args);
  return ret;
}

function combinePortNameAndTrusted(portName, trusted) {
  return `___${portName}___${(trusted === true ? 'true' : 'false')}___`;
}

// `portName, trusted` -> { localId, callback }
const MESSAGE_PORT_MAP = Symbol();

/**
 * The MessagePort class provides functions to communicate between ports.
 * require('tizen-message-port') returns an instance of this class
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
   * This method internally registers a port with the portName which is
   * specified in this method.
   *
   * ```javascript
   * messageport.listen('port1', function(message, sender) {
   *   // (this callback will be invoked when this port receives any message)
   *   // message is a Map. when reiceive the message, its type is only Map.
   *   // sender = {appId, portName, trusted}
   *
   *   console.log('The message: ' + message.get(sthMapKey));
   *   if (sender.trusted) {
   *     console.log('Who sent this message?');
   *     console.log('appId: ' + sender.appId);
   *     if (sender.portName !== undefined) {
   *       console.log('portName: ' + sender.portName);
   *     }
   *   }
   * });
   * ```
   *
   * Two ports can listen with the same portName if one is trusted and
   * the other one is untrusted. For example, the following would register two
   * different ports.
   *
   * ``` javascript
   * // registers an untrusted port with name 'port1'
   * messageport.listen('port1', function(message, sender){});
   *
   * // registers a trusted port with name 'port1'
   * messageport.listen('port1', true, function(message, sender){});
   * ```
   *
   * @method listen
   *
   * @param {String} portName The name of the port which will listen.
   * @param {Boolean} [trusted=false] true if the port which will listen is to
   * be registered as a trusted port. false is the default.
   * @param {Function} callback Callback function to be invoked when
   * this port receives any message.
   * The callback function takes two parameters:
   * @param {Map} callback.message Message which is received. When receive the
   * message, it can be only Map.
   * @param {Object} [callback.sender] Information of sender who sends
   * this message. If sender sent without own information, sender can be
   * undefined.
   * @param {String} callback.sender.appId Application ID of sender application.
   * @param {String} callback.sender.portName Name of the sender port.
   * @param {Boolean} callback.sender.trusted true if the port which sends this
   * message is trusted. false otherwise.
   *
   * @return {Boolean} true if the port is registered. false otherwise.
   *
   * @throws
   * * InvalidValueError - The specified portName and trusted are not valid
   * * OutOfMemoryError - Out of memory
   * * IOError - Internal I/O error
   * @since 3.0
   */
  listen(portName, trusted, callback) {
    if (callback === undefined && trusted instanceof Function) {
      callback = trusted;
      trusted = false;
    }

    let ret = registerLocalPort(portName, trusted);
    let localId = Number(ret['result']);
    if (localId !== NaN && localId > 0) {
      this[MESSAGE_PORT_MAP].set(combinePortNameAndTrusted(portName, trusted),
                                 {'localId': localId, 'callback': callback});
      return true;
    } else {
      if (ret['reason'] !== undefined) {
        let reason = String(ret['reason']);
        console.error('Failed to registered port(' + portName + ', ' + trusted +
                      ') because ' + reason);
        throw getNewErrorFromNativeMessage(reason);
      }
      return false;
    }
  }

  /**
   * Stops a port from listening to messages from other ports.
   *
   * Two ports with the same portName can stop listening if one is trusted and
   * the other one is untrusted. For example, the following is possible:
   *
   * ``` javascript
   * // unresgisters an untrusted port with name 'port1'
   * messageport.stopListening('port1');
   *
   * // unresgisters a trusted port with name 'port1'
   * messageport.stopListening('port1', true);
   * ```
   *
   * @method stopListening
   *
   * @param {String} portName The name of the port which will stop listening
   * port.
   * @param [trusted=false] {Boolean} true if the port which will stop listening
   * was set to listen as a trusted port. false is the default.
   *
   * @return {Boolean} true if the port is unregistered. false otherwise.
   *
   * @throws
   * * InvalidValueError - The specified portName and trusted are not valid
   * * NotFoundError - The port which has specified portName and trusted cannot be found
   * * OutOfMemoryError - Out of memory
   * * IOError - Internal I/O error
   *
   * @since 3.0
   */
  stopListening(portName, trusted) {
    let key = combinePortNameAndTrusted(String(portName), Boolean(trusted));
    let value = this[MESSAGE_PORT_MAP].get(key);
    if (value === undefined) {
      console.err('Failed to find (%s,%s) in map', portName, trusted);
      return;
    }
    let ret = unregisterLocalPort(value.localId, trusted);
    if (Number(ret['result']) === 0) {
      this[MESSAGE_PORT_MAP].delete(key);
      return true;
    } else {
      if (ret['reason'] !== undefined) {
        let reason = String(ret['reason']);
        console.error('Failed to registered port(' + portName + ', ' + trusted +
                      ') because ' + reason);
        throw getNewErrorFromNativeMessage(reason);
      }
      return false;
    }
  }

  /**
   * Send one or more messages to a port which is listening.
   *
   * ```javascript
   * // if message's type is Map,
   * var messageMap = new Map();
   * messageMap.set('msg1', 'hello world');
   * messageMap.set('msg2', ['hello', 'world']);
   *
   * // if message's type is Object,
   * var messageObj = {};
   * messageObj.msg1 = 'hello world';
   * messageObj.msg2 = ['hello', 'world'];
   *
   * // sends the message without sender information,
   * send({appId: 'receiverAppId', portNmae: 'receiverPortName'}, messageMap);
   *
   * // or sends the message with sender information,
   * send({appId: 'receiverAppId', portNmae: 'receiverPortName'}, messageObj,
   *      {portName: 'senderPort', trusted: true});
   *
   * // caution: accepted message's values' types are only string and string array
   * message.set('msg1', 'hello world');  // string type is accepted
   * message.set('msg2', ['hello', 'world']);  // string array type is accepted
   * // message.set('msg3', true);  // not accepted
   * // message.set('msg4', {name: 'tizen'});  // not accepted
   * // message.set('msg5', 12345);  // not accepted
   * // message.set('msg6', function() {});  // not accepted
   * ```
   *
   * @method send
   *
   * @param {Object} receiver Message receiver information.
   * @param {String} receiver.appId Application ID of receiver application.
   * @param {String} receiver.portName Name of the receiver port.
   * This port should be set to listen by the application with appId.
   * @param {Boolean} [receiver.trusted=false] true if the receiver port which
   * is listening as a trusted port. false is the default.
   * @param {Map|Object} message Message to send to receiver. When send the
   * message, it can be a Map or an Object.
   * * Currently, only string value and string array value are supported.
   * @param {Object} [sender] Message sender information.
   * @param {String} sender.portName Name of port which sends the message. The
   * application which calls this method should have set this portName to
   * {{#crossLink "MessagePort/listen:method"}}{{/crossLink}}.If this portName
   * is not set to {{#crossLink "MessagePort/listen:method"}}{{/crossLink}},
   * the message is sent without sender information.
   * @param {Boolean} [sender.trusted=false] true if the sender port is
   * listening as a trusted port. false is the default.
   *
   * @return {Boolean} True if send() is successful.
   *
   * @throws
   * * InvalidValueError - The specified receiver is not valid
   * * OutOfMemoryError - Out of memory
   * * NotFoundError - The port which has specified appId, portName and trusted in receiver cannot be found
   * * InvalidOperationError - The receiver is not signed with the same certificate
   * * QuotaError - The size of the message has exceeded the maximum limit
   * * IOError - Internal I/O error
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
    if (Number(ret['result']) === 0) {
      return true;
    } else {
      if (ret['reason'] !== undefined) {
        let reason = String(ret['reason']);
        console.error('Failed to registered port(' + portName + ', ' + trusted +
                      ') because ' + reason);
        throw getNewErrorFromNativeMessage(reason);
      }
      return false;
    }
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
