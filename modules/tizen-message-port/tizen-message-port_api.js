'use strict';

var util = require('util');

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

function registerLocalPort(localPort, trusted) {
  var args = { 'msg': { 'localPort': localPort,
                        'trusted': trusted } };
  var ret = native_sync_call('registerLocalPort', args);
  return parseInt(ret);
}


function unregisterLocalPort(localId, trusted) {
  var args = { 'msg': { 'localId': localId,
                        'trusted': trusted } };
  var ret = native_sync_call('unregisterLocalPort', args);
  return ret;
}

var EventEmitter = require('events');
class LocalPort extends EventEmitter {
  constructor(localPort, trusted) {
    super();

    this.localPort = localPort;
    this.trusted = trusted;
    this.localId = registerLocalPort(localPort, trusted);

    var reaper = require('reaper');
    reaper.setReaper(this, function(deletedObj) {
      console.log('reaper will operate for LocalPort instance');
      unregisterLocalPort(deletedObj.localId, deletedObj.trusted);
    });
  }
};

class RemotePort {
  constructor(appId, name, options) {
    this.appId = appId;
    this.name = name;
    this.trusted = options && options.trusted || false;
    this.localPort = options && options.localPort || null;
  }

  isRegistered() {
    var self = this;
    return new Promise(function(resolve, reject) {
      var args = { 'msg': { 'remoteAppId': self.appId,
                            'remotePort': self.name,
                            'trusted': self.trusted } };
      native_async_call('isRegistered', args, function(result) {
          if (result['result'] != null) {
            resolve(result['result']);
          } else {
            reject(new Error(result['reason']));
          }
      });
    });
  }

  // message's elements must have only 'string'
  send(message, localPort) {
    var self = this;
    return new Promise(function(resolve, reject) {
      if (message && message.constructor.name == 'Map') {
        var _localPort = null;
        if (localPort && localPort.constructor.name == 'LocalPort')
          _localPort = localPort;

        // Map -> Object
        var objMap = {};
        message.forEach(function(value, key) {
          objMap[key] = value;
        });

        var args = { 'msg': { 'remoteAppId': self.appId,
                              'remotePort': self.name,
                              'message': objMap,
                              'trusted': self.trusted,
                              'localPort': _localPort } };
        native_async_call('send', args, function(result) {
          if (result['result'] == 'OK') {
            resolve(self);
          } else {
            reject(new Error(result['reason']));
          }
        });

      } else {
        reject(new Error('message should be Map'));
      }
    });
  }
};

class MessagePort {
  constructor() {
    registerEventHandler(this);
    this.localPort = null;
    this.RemotePort = RemotePort;
  }

  createLocal(localPort, trusted) {
    if (this.localPort == null) {
      this.localPort = new LocalPort(localPort, trusted || false);
    }
    return this.localPort;
  }

  // TODO: it will be in private
  __event_handle__(msg) {
    if ('message' == msg['event']) {
      var data = JSON.parse(msg['data']);

      var message = null;
      var remotePort = null;

      // Object -> Map(message)
      var msgObj = data['msgObj'];
      if (msgObj != null && typeof(msgObj) == 'object') {
        message = new Map();
        for (var key in msgObj) {
          message.set(key, msgObj[key]);
        }
        delete data['msgObj'];
      }

      // Object's contents -> remotePort
      remotePort = new RemotePort(data['remoteAppId'],
                                  data['remotePort'],
                                  { trusted: trusted,
                                    localPort: this.localPort });

      this.localPort.emit('message', message, remotePort);
    } else {
      console.error('invalid event was passed');
    }
  }
};

// @module tizen-message-port
// ...
// var messagePort = require('tizen-message-port');

// var myPort = messagePort.createLocal('ServiceForMessageLogging');
// myPort.on('message', function(message, remotePort) {
//   if (!remotePort.trusted) {
//     console.log('only messages from trusted ports are accepted');
//   } else {
//     // Note: appId & name will be null if remote port sends without providing own local port
//     console.log('remoteAppId: ' + remotePort.appId);
//     console.log('remotePort: ' + remotePort.name);

//     // if the message consists of one key('msg') & one value('hello world') in Map,
//     var msgValue = message.get('msg');
//     console.log('msg: ' + msgValue); // msg: hello world
//   }
// });

// var remotePort = new messagePort.RemotePort(myOwnAppId, 'ServiceForMessageLogging');
// remotePort.isRegistered()
//   .then(function(remotePort, result) {
//     console.log('result: ' + result);

//     var myMessage = new Map();
//     myMessage.set('msg', 'hello world');
//     remotePort.send(myMessage)
//       .then(function(messagePort) {
//         console.log('successfully sent');
//       }, function(err) {
//         console.log(err);
//       });
//   }, function(err) {
//     console.log('err: ' + err);
//   });
// ...


exports = new MessagePort();
