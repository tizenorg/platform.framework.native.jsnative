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

function ConvertObjectToMap(obj) {
  var map map = new Map();
  for (var key in obj) {
    map.set(key, obj[key]);
  }
  return map;
}

function ConvertMapToObject(map) {
  var obj = {};
  map.forEach(function(value, key) {
    obj[key] = value;
  });
  return obj;
}

var mapPort_ = Symbol();  // portName -> { id }
var mapId_ = Symbol();    // id -> { trusted, cb }

function registerLocalPort(portName, trusted, callaback) {
  var args = { 'msg': { 'localPort': portName,
                        'trusted': trusted.toString() } };
  var ret = native_sync_call('registerLocalPort', args);
  var result = parseInt(ret['result']);
  if (result > 0)
    return result;
  else
    throw new Error('registerLocalPort ' + ret['reason']);
}

function unregisterLocalPort(localId, trusted) {
  var args = { 'msg': { 'localId': localId.toString(),
                        'trusted': trusted.toString() } };
  var ret = native_sync_call('unregisterLocalPort', args);
  var result = parseInt(ret['result']);
  if (result == 0)
    return result;
  else
    throw new Error('unregisterLocalPort: ' + ret['reason']);
}

/**
 * @class MessagePort
 */
class MessagePort {
  constructor() {
    this[mapPort_] = new Map();
    this[mapId_] = new Map();
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
    if (portName == undefined ||
        (trusted == undefined && callback == undefined)) {
      throw new Error('[MessagePort::listen] Wrong Parameter');
    }
    var _callback = null;
    var _trusted = null;
    if (callback == undefined && typeof trusted === 'function') {
      _callback = trusted;
      _trusted = false;
    } else {
      _callback = callback;
      _trusted = (trusted == undefined) ? false : trusted;
    }

    // check if the portName exists. If so, delete it.
    if (this[mapPort_].has(portName)) {
      var theId = this[mapPort_].get(portName);
      if (this[mapId_].has(theId)) {
        unregisterLocalPort(theId, this[mapId_].get(theId)[trusted]);
      }
      this[mapPort_].delete(portName);
      this[mapId_].delete(theId);
    }

    var localId = registerLocalPort(portName, _trusted, _callback);
    this[mapPort_].set(portName, localId);
    this[mapId_].set(localId, { trusted: _trusted, cb: _callback });
  }

 /**
  * @method stopListen
  * @param {string} portName
  */
  stopListen(portName) {
    if (portName == undefined || !this[mapPort_].has(portName))
      return;

    var id = this[mapPort_].get(portName);
    var trusted = this[mapId_].get(id);

    unregisterLocalPort(id, trusted);
    this[mapPort_].delete(portName);
    this[mapId_].delete(id);
  }

 /**
  * @method send
  * @param {string} appId
  * @param {string} portName
  * @param {Map} message
  * @param [options] {string} senderPortName
  * @return {Promise<void>}
  */
  send(appId, portName, message, senderPortName) {
    if (appId == undefined || portName == undefined || message == undefined)
      throw new Error('[MessagePort::send] Wrong Parameter');

    if (typeof message !== 'object' && typeof message !== 'function')
      throw new Error('[MessagePort::send] Wrong Type of message');

    var withSender = false;
    if (senderPortName && typeof senderPortName === 'string' &&
        this[mapPort_].has(senderPortName)) {
      withSender = true;
    }

    var self = this;
    return new Promise(function(resolve, reject) {
      if (typeof message === 'Map')
        message = ConvertMapToObject(message);

      var args = { 'msg': { 'appId': appId,
                            'portName': portName,
                            'message': message }};
      if (withSender)
        args = Object.assign(args,
                             { 'localId': self[mapPort_].get(portName) });

      native_async_call('send', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
        }
      });
    };
  }

  __event_handle__(msg) {
    if ('listen' == msg['event']) {
      var data = JSON.parse(msg['data']);

      var localId = parseInt(data['localId']);
      var appId = data['appId'];
      var portName = undefined;
      if (data['portName'] != undefined)
        portName = data['portName'];
      var map = ConvertObjectToMap(data['msg']);

      var listenCb = this[mapId_].get(localId);
      if (listenCb && typeof listenCb === 'function')
        listenCb(map, appId, portName);
      else
        console.error('can\'t find any callback for listen id: ' + localId);
    } else {
      console.error('invalid event was passed');
    }
  }
};

// @module tizen-message-port
// ...
// var messageport = require('tizen-message-port');

// messageport.listen('port1', function(message, appId, portName) {

// });
// messageport.stopListen('port1');

// var message = {
//   msg1: 'hello world!',    // str
//   msg2: ['hello', 'world'] // str array
//   // currently processes only two type above
// };

// messageport.send(appId, portName, message);
// ...

exports = new MessagePort();
