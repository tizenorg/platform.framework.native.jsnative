'use strict';

var ApplicationCommon = require('tizen-application-common').ApplicationCommon;

/**
 * @class Application
*  @extends ApplicationCommon
 */
class Application extends ApplicationCommon {
  constructor() {
    super();
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
    *
    * @method start
    * @return {Promise<>}
    */
   start() {
    return new Promise(function(resove, reject) {
      // native...
    });
   }
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
 * });
 *
 * ```
 */
exports = new Application();
