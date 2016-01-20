'use strict';

function native_sync_call(method, parameter) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  try {
      var ret = extension.internal.sendSyncMessage(JSON.stringify(args));
    console.log("[native_sync_call] after");
    return JSON.parse(ret);
  } catch (e) {
    console.log('recevied message parse error:' + e.message);
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


var EventEmitter = require('events');

/**
 * @class SystemRuntimeInfo
 */
class SystemRuntimeInfo extends EventEmitter{
  constructor() {
      console.log("[System-Runtime-Info] Constructor");
      super();
      registerEventHandler(this);
  }
  
  __event_handle__(msg) {
        console.log("__event_handle__ :"+msg['event']+" "+msg['data']);
      this.emit(msg['event'], msg['data']);
  }

  /**
   * @attribute length
   * @type {Number}
   */
  get length() {
    return keys().length;
  }

  /**
   * @method getValue
   * @param {string} key
   * @return {string}
   */
  getValue(key) {
    var result = native_sync_call('get', {'key': key});
    return result['data'];
  }


  /**
   * @method getSystemMemoryInfo
   * @return {string}
   */
  getSystemMemoryInfo(key) {
    var ret = native_sync_call('getSystemMemoryInfo', {'key': key});
    if(ret["result"] == "SUCCESS"){
        return ret["memoryInfo"];
    }
    return undefined;
  }

  /**
   * @method getSystemMemoryInfo
   * @return {string}
   */
  getProcessMemoryInfo(pidList) {
    var ret = native_sync_call('getProcessMemoryInfo', {'pidList': pidList});
    if(ret["result"] == "SUCCESS"){

		/*
		var packageSize = result['memoryInfos'].map(function(size) {
          return new PackageSize(size['data'], size['cache'], size['app'], size['extData'], size['extCache'], size['extApp']);
        });
		*/
        return ret["memoryInfos"];
    }
    return undefined;
  }

  /**
   * @method getSystemMemoryInfo
   * @return {string}
   */
  getCPUUsage() {
    var ret = native_sync_call('getCPUUsage');
    if(ret["result"] == "SUCCESS"){
        return ret["CPUUsage"];
    }
    return undefined;
  }

  /**
   * @method has
   * @param {string} key
   * @return {bool}
   */
  has(key) {
    return native_sync_call('has', {'key': key})['data'];
  }

  /**
   * @method setItem
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    native_sync_call('set', {'key': key, 'value': value});
  }

  /**
   * @method removeItem
   * @param {string} key
   */
  removeItem(key) {
    native_sync_call('remove', {'key': key});
  }

  /**
   * @method keys
   * @return {array}
   */
  keys() {
    return native_sync_call('keys')['data'];
  }

  /**
   * @method clear
   */
  clear() {
    native_sync_call('clear');
  }

  /**
   * @method forEach
   * @param {function} callback Function to execute for each element.
   * @param {object} thisArg Value to use as this when executing callback.
   *
   * @remarks
   * callback is invoked with three arguments:
   *  * the element value
   *  * the element key
   *  * the Map object being traversed
   */
  forEach(callback, thisArg) {
    var keys = this.keys();
    keys.forEach(function(key) {
      callback.call(thisArg, key, this.getItem(key), this);
    }, this);
  }

};

exports = new SystemRuntimeInfo();
