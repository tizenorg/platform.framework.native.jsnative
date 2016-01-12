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
  var args = {};
  args["cmd"] = method;
  args = Object.assign(args, parameter);
  var asyncid = async_message_id++;
  args["asyncid"] = "asyncid_" + asyncid;
  async_map.set(args["asyncid"], callback);
  extension.postMessage(JSON.stringify(args));
}

function native_sync_call(method, parameter) {
  var args = {};
  args["cmd"] = method;
  args = Object.assign(args, parameter);
  try {
    return JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(args)));
  } catch (e) {
    console.log('recevied message parse error:' + e.message);
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
        }
      } else {
        self.__event_handle__(msg);
      }
    }
  })(app);
  extension.setMessageListener(handler);
}

var internal_id = Symbol();
var device_name = Symbol();
var id_direction = Symbol();
var device_type = Symbol();
var activation_state = Symbol();
/**
 * @class Device
 */
class Device {
   constructor(id , name, type, direction, state){
    console.log('Device constructor ');
    this[internal_id] = id;
    this[device_name] = name;
    this[device_type] = type;
    this[id_direction] = direction;
    this[activation_state] = state;
  }

  /**
   * @attribute id
   * @type {int}
   * @readonly
   */
  get id() {
    return this[internal_id];
  }

  /**
   * @attribute name
   * @type {string}
   * @readonly
   */
  get name() {
    return this[device_name];
  }

  /**
   * @attribute ioDirection
   * @type {string}
   * @readonly
   */
  get ioDirection() {
    return this[id_direction];
  }

  /**
   * @attribute state
   * @type {string}
   * @readonly
   */
  get state() {
    return this[activation_state];
  }

  /**
   * @attribute type
   * @type {string}
   * @readonly
   */
  get type() {
    return this[device_type];
  }
};

var EE = require('events');

var connection_filter = Symbol();
var deviceinfo_filter = Symbol();
/**
 * @class SoundManager
 *  @extends Node.EventEmmitter
 */
class SoundManager extends EE{
  constructor() {
    console.log('SoundManager constructor');
    super();
    this[connection_filter] = {'direction': 'both' , 'type': 'all',  'state': 'all'};
    this[deviceinfo_filter] =  {'direction': 'both' , 'type': 'all',  'state': 'all'};
    console.log('registerEventHandler');
    registerEventHandler(this);
  }

  __event_handle__(msg) {
    console.log('__event_handle__');

    if (msg['event'] == 'connectionState') {
      var connectionState = msg['data'];
      this.emit('connectionState', connectionState);
    } else if (msg['event'] == 'deviceInfo') {
      var deviceInfo= msg['data'];
      this.emit('deviceInfo', deviceInfo);
    } else {
      console.log('invalid event was passed');
    }
  }

   get connectionFilter(){
     console.log(' get connectionFilter');
     return this[connection_filter];
  }

   set connectionFilter(filter){
     console.log(' set connectionFilter');
     this[connection_filter] = filter;
     native_sync_call('setConnectionFilter', filter);
  }

   get deviceInfoFilter(){
     console.log(' get deviceInfoFilter');
     return this[deviceinfo_filter];
  }

   set deviceInfoFilter(filter){
        console.log(' set deviceInfoFilter');
        this[deviceinfo_filter] = filter;
        native_sync_call('setDeviceInfoFilter', filter);
  }

/**
 * @method getCurrentDeviceList
 * @param {Object} [filter] A filter to filter the return results.
 * This optional object has three properties which each have a default value
 * which are used if this parameter is not specified:
 * - 'direction' - One of 'in', 'out' or 'both' for input, output or for
 * both input and output devices respectively. 'both' is default.
 * - 'type' - Can be 'internal', 'external' or 'all' for built-in, external
 * or both built-in and external devices respectively. 'all' is default.
 * - 'state' - Can be 'activated', 'deactivated' or 'all' for activated,
 * deactivated or both activated and deactivated devices respectively. 'all'
 * is default.
 * @return {Promise<Device[]>} A list of current device
 * var soundManager = require('tizen-sound-manager');
 *
 * var filter = {'direction': 'in',
 *               'type': 'internal',
 *               'state': 'activated'};
 * var list = soundManager.getCurrentDeviceList(filter);
 */
  getCurrentDeviceList(filter){
    console.log('getCurrentDeviceList');
    return new Promise(function(resolve, reject) {
        native_async_call('getCurrentDeviceList', filter , function(result) {
            if(result['result'] == 'OK') {
                var devices = result['data'].map(function(deviceData) {
                      console.log('deviceData id:' + deviceData.id + ', name:' + deviceData.name 
                                + ', type:' + deviceData.type + ', direction:'+ deviceData.direction + ', state:'+deviceData.state);
                      return new Device(deviceData.id, deviceData.name, deviceData.type, deviceData.direction, deviceData.state);
                });
                resolve(devices);
            } else {
                reject(new Error(result['reason']));
            }
       });
     });
  }

};

exports = new SoundManager();
