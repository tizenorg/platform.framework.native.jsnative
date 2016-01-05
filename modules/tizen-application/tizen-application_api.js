'use strict';


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
  args['asyncid'] = 'asynid_' + asyncid;
  async_map.set(args['asyncid'], cb);
  extension.postMessage(JSON.stringify(args));
}

function registEventHandler(app) {
  var handler = (function(self) {
    return function(json) {
      var msg = JSON.parse(json);
      if (msg['asyncid'] && async_map.has(msg['asyncid'])) {
        var cb = async_map.get(msg['asyncid']);
        async_map.delete(msg['asyncid']);
        cb(msg);
      } else {
        self.__event_handle__(msg);
      }
    };
  })(app);
  extension.setMessageListener(handler);
}

var ApplicationCommon = require('tizen-application-common').ApplicationCommon;


var started = Symbol();
/**
 * @class Application
*  @extends ApplicationCommon
 */
class Application extends ApplicationCommon {
  constructor() {
    super();
    this[started] = false;
    registEventHandler(this);
  }

  __event_handle__(msg) {
    if (msg['event'] == 'appcontrol') {
      var RequestedAppControl =
          require('tizen-application-common').RequestedAppControl;
      var request = new RequestedAppControl({'json': msg['data']});
      this.emit('appcontrol', request);
    } else if (
        [
          'pause', 'resume', 'terminate', 'languagechange', 'lowmemory',
          'lowbattery', 'regionchange', 'orientationchange'
        ].indexOf(msg['event']) >= 0) {
      this.emit(msg['event'], msg['data']);
    } else {
      console.log('invalid event was passed');
    }
  }

   /**
    * @method start
    * @return {Promise<>}
    */
   start() {
    if (this[started])
      return Promise.reject(new Error('already started'));

    this[started] = true;
    return new Promise(function(resolve, reject) {
      require('gcontext').init();
      process.title = process.argv[1];
      var args = {};
      args['argv'] = process.argv.slice(1);
      native_async_call('start', args, function(result) {
        if (result['result'] == 'OK') {
          resolve();
        } else {
          reject(new Error(result['reason']));
        }
      });
    });
   }

  /**
   * ....
   * @event appcontrol
   * @param {AppControl} appcontrol
   * @since 3.0
   */

  /**
   * ....
   * @event pause
   * @since 3.0
   */

  /**
   * ....
   * @event resume
   * @since 3.0
   */

  /**
   * ....
   * @event terminate
   * @since 3.0
   */

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


/*
 * @module tizen-application
 *
 * 'tizen-application' module exports a instance of Application class.
 *
 * ```
 * var AppControl = require('tizeen-app-control');
 *
 * var app = require('tizen-application');
 * app.on('appcontrol', function(requested){
 *   if (requested.operation == AppControl.OPERATION_MAIN) {
 *     // main ..
 *   } else {
 *     ....
 *   }
 * });
 *
 * app.on('pause', function() {
 *   // pause ...
 * });
 *
 * app.on('terminate', function(){
 *   // release resources
 * });
 *
 * app.start().then(function() {
 *   console.log(app.name);
 *   console.log(app.id);
 *
 * }).catch(function(e){
 *   console.log(e.message);
 * });
 *
 * ```
 */
exports = new Application();
