'use strict';

function native_call(method, parameter) {
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

var AppControl = require('tizen-app-control');

var callerAppId = Symbol();
/**
 * @class RequestedAppControl
 */
class RequestedAppControl extends AppControl {
  constructor(config) {
    super('', {json: config});
    this[callerAppId] = config['__AUL_CALLER_APPID__'];
  }

  /**
   * ....
   * @method response
   * @param {Map, Object} data
   */
  response(data) {
    var data_obj = data;
    if (data instanceof Map) {
      data.forEach(function(v, k) {
        data_obj[k] = v;
      });
    }
    var args = {};
    args['appcontrol'] = this.toJSON();
    args['data'] = data_obj;
    native_call('appcontrol_response', args);
  }

  /**
   * @attribute callerAppID
   * @type {string}
   * @readonly
   */
  get callerAppID() {
    return this[callerAppId];
  }
};

var EE = require('events');
/**
 * @class ApplicationCommon
*  @extends Node.EventEmmitter
 */
class ApplicationCommon extends EE {
  constructor() {
    super();
  }

  get id() {
    return native_call('id')['data'];
  }

  get name() {
    return native_call('name')['data'];
  }

  get version() {
    return native_call('version')['data'];
  }

  get dataPath() {
    return native_call('datapath')['data'];
  }

  get resPath() {
    return native_call('respath')['data'];
  }

  get cachePath() {
    return native_call('cachepath')['data'];
  }

  get sharedResPath() {
    return native_call('sharedrespath')['data'];
  }

  /**
   * ....
   * @event lowmemory
   * @param {string} status
   * * "NORMAL"
   * * "SOFT_WARNING"
   * * "HARD_WARNING"
   * @since 3.0
   */


  /**
   * ....
   * @event lowbattery
   * @param {string} status
   * * "POWER_OFF "
   * * "CRITICAL_LOW"
   * @since 3.0
   */

  /**
   * ....
   * @event languagechange
   *
   * @since 3.0
   */

  /**
   * ....
   * @event regionchange
   * @param {string} language
   *
   * @since 3.0
   */

  /**
   * ....
   * @event orientationchange
   * @param {string} orientation
   *
   * @since 3.0
   */

};

exports.ApplicationCommon = ApplicationCommon;
exports.RequestedAppControl = RequestedAppControl;
