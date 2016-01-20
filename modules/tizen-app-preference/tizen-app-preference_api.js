'use strict';

function native_sync_call(method, parameter) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  try {
  	console.log("[sync call] 1");
  	var ret = extension.internal.sendSyncMessage(JSON.stringify(args));
	console.log("[sync call] 2");
    return JSON.parse(ret);
  } catch (e) {
    console.log('recevied message parse error:' + e.message);
    return {};
  }
}

/**
 * @class AppPreference
 */
class AppPreference {
  constructor() {
  }

  /**
   * @attribute length
   * @type {Number}
   */
  get length() {
    return keys().length;
  }

  /**
   * @method getItem
   * @param {string} key
   * @return {string}
   */
  getItem(key) {
    var result = native_sync_call('get', {'key': key});
	
    return result['data'];
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

exports = new AppPreference();
