'use strict';

var AppControl = require('tizen-app-control');

var callerAppId = Symbol();
/**
 * @class RequestedAppControl
 */
class RequestedAppControl extends AppControl {
  constructor(config) {
    super('', {json: config});
    this[callerAppId] = config['__caller_app_id__'];
  }

  /**
   * ....
   * @method response
   * @param Map data
   */
  response(data) {
    // native call with this.toJSON();
  }

  /**
   * @attribute String callerAppID
   * @readonly
   */
  get callerAppID() {
    return this[callerAppId];
  }
};


var EE = require('events');
class ApplicationCommon extends EE {
  constructor() {

  }

  get id() {
    return undefined; // native...
  }

  get name() {
    return undefined;
  }

  get version() {
    return undefined;
  }

  get dataPath() {
    return undefined;
  }

  get resPath() {
    return undefined;
  }

  get cachePath() {
    return undefined;
  }

  get sharedResPath() {
    return undefined;
  }

  /**
   * ....
   * @event lowmemory
   * @param {String} status
   * * "NORMAL"
   * * "SOFT_WARNING"
   * * "HARD_WARNING"
   * @since 3.0
   */


  /**
   * ....
   * @event lowbattery
   * @param {String} status
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
   * @param {String} language
   *
   * @since 3.0
   */

  /**
   * ....
   * @event orientationchange
   * @param {String} ...
   *
   * @since 3.0
   */

};

exports.ApplicationCommon = ApplicationCommon;
exports.RequestedAppControl = RequestedAppControl;
