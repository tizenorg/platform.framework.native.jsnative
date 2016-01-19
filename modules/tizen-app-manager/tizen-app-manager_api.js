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
 * Tizen Application Manager module
 *
 * The 'tizen-app-manager' module exports an instance of the AppManager class.
 *
 * ```
 * var app_manager = require('tizen-app-manager');
 * app_manager.getInstalledApps().then(function(){ ... });
 *
 * @module tizen-app-manager
 */

'use strict';

function native_sync_call(method, parameter) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  try {
    return JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(args)));
  } catch (e) {
    console.log('recevied message parse error:' + e.message);
    return {};
  }
}

var async_message_id = 0;
var async_map = new Map();

function native_async_call(method, parameter, cb) {
  var args = {};
  args['cmd'] = method;
  args = Object.assign(args, parameter);
  var asyncid = async_message_id++;
  args['asyncid'] = 'asyncid_' + asyncid;
  async_map.set(args['asyncid'], cb);
  extension.postMessage(JSON.stringify(args));
}

function registEventHandler(manager) {
  extension.setMessageListener(function(json) {
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
      if (manager && typeof manager.__event_handle__ == 'function')
        manager.__event_handle__(msg);
    }
  });
}

var handle_ = Symbol();
var cache_ = Symbol();
/**
 * @class InstalledApplication
 *
 */
class InstalledApplication {
  constructor(handle) {
    this[handle_] = handle;
    this[cache_] = {};
    require('reaper').setReaper(this, function(deleted) {
      native_sync_call('instapp.delete', {'handle': handle});
    });
  }

  /**
   * Application ID
   * @attribute id
   * @type {string}
   * @readonly
   */
  get id() {
    if (!this[cache_]['id']) {
      this[cache_]['id'] =
          native_sync_call('instapp.id', {'handle': this[handle_]})['data'];
    }
    return this[cache_]['id'];
  }

  /**
   * The executable path of the application
   * @attribute executablePath
   * @type {string}
   * @readonly
   */
  get executablePath() {
    if (!this[cache_]['executablePath']) {
      this[cache_]['executablePath'] =
          native_sync_call('instapp.exe', {'handle': this[handle_]})['data'];
    }
    return this[cache_]['executablePath'];
  }

  /**
   * The label of the application.
   * @attribute label
   * @type {string}
   * @readonly
   */
  get label() {
    if (!this[cache_]['label']) {
      this[cache_]['label'] =
          native_sync_call('instapp.label', {'handle': this[handle_]})['data'];
    }
    return this[cache_]['label'];
  }

  /**
   * The absolute path to the icon image.
   * @attribute iconPath
   * @type {string}
   * @readonly
   */
  get iconPath() {
    if (!this[cache_]['iconPath']) {
      this[cache_]['iconPath'] =
          native_sync_call('instapp.iconpath',
                          {'handle': this[handle_]})['data'];
    }
    return this[cache_]['iconPath'];
  }

  /**
   * The package ID
   * @attribute packageID
   * @type {string}
   * @readonly
   */
  get packageID() {
    if (!this[cache_]['packageID']) {
      this[cache_]['packageID'] =
          native_sync_call('instapp.package',
                          {'handle': this[handle_]})['data'];
    }
    return this[cache_]['packageID'];
  }

  /**
   * The application type
   * @attribute type
   * @type {string}
   * @readonly
   */
  get type() {
    if (!this[cache_]['type']) {
      this[cache_]['type'] =
          native_sync_call('instapp.type',
                          {'handle': this[handle_]})['data'];
    }
    return this[cache_]['type'];
  }

  /**
   * The metadata
   * @attribute metadata
   * @type {Object} {'key':value, ....}
   * @readonly
   */
  get metadata() {
    if (!this[cache_]['metadata']) {
      this[cache_]['metadata'] =
          native_sync_call('instapp.metadata',
                          {'handle': this[handle_]})['data'];
    }
    return this[cache_]['metadata'];
  }

  /**
   * Do not displayed in menuscreen
   * @attribute nodisplay
   * @type {boolean}
   * @readonly
   */
  get nodisplay() {
    if (!this[cache_]['nodisplay']) {
      this[cache_]['nodisplay'] =
          native_sync_call('instapp.nodisplay',
                          {'handle': this[handle_]})['data'];
    }
    return this[cache_]['nodisplay'];
  }

  /**
   * Application was disabled
   * @attribute nodisplay
   * @type {boolean}
   * @readonly
   */
  get disabled() {
    if (!this[cache_]['disabled']) {
      this[cache_]['disabled'] =
          native_sync_call('instapp.disabled',
                          {'handle': this[handle_]})['data'];
    }
    return this[cache_]['disabled'];
  }

  /**
   * Application was running on boot
   * @attribute onboot
   * @type {boolean}
   * @readonly
   */
  get onboot() {
    if (!this[cache_]['onboot']) {
      this[cache_]['onboot'] =
          native_sync_call('instapp.onboot',
                          {'handle': this[handle_]})['data'];
    }
    return this[cache_]['onboot'];
  }

  /**
   * Application was installed in preload time
   * @attribute preloaded
   * @type {boolean}
   * @readonly
   */
  get preloaded() {
    if (this[cache_]['preloaded']) {
      this[cache_]['preloaded'] =
          native_sync_call('instapp.preloaded',
                          {'handle': this[handle_]})['data'];
    }
    return this[cache_]['preloaded'];
  }

  /**
   * The localized name of the application.
   * @param {string} locale Locale
   * @method getLocalizedLabel
   * @return {string}
   */
  getLocalizedLabel(locale) {
    var args = {};
    args['handle'] = this[handle_];
    args['locale'] = locale;
    return native_sync_call('instapp.localizelabel', args)['data'];
  }

};


/**
 * @class RunningApplication
 */
class RunningApplication {
  constructor(appid, pid) {
    /**
     * Application ID
     * @attribute id
     * @type {string}
     * @readonly
     */
    this.id = appid;

    /**
     * Process ID of Running Application
     * @attribute pid
     * @type {Number}
     * @readonly
     */
    this.pid = pid;
    Object.freeze(this);
  }
};


var available_keys = ['id', 'type', 'category', 'nodisplay'];
var convert_key = {'id': 'PACKAGE_INFO_PROP_APP_ID',
                   'type': 'PACKAGE_INFO_PROP_APP_TYPE',
                   'category': 'PACKAGE_INFO_PROP_APP_CATEGORY',
                   'nodisplay': 'PACKAGE_INFO_PROP_APP_NODISPLAY'};

var EE = require('events');
/**
 * @class AppManager
 * @extends Node.EventEmitter
 */
class AppManager extends EE {

  constructor() {
    super();
    registEventHandler(this);
  }

  /**
   * @method getInstalledApps
   *
   * @param {Object} [filter]
   * You can use key in ['id', 'type', 'category', 'nodisplay'(boolean)] to filter out
   *
   * @return {Promise | InstalledApplication[]}
   *
   *
   * ```
   * var app_manager = require('tizen-app-manager');
   * app_manager.getInstalledApps({'type':'jsapp'})
   *   .then(function(apps) {
   *      apps.forEach(function(app) {
   *          console.log('All jsapp type application : '+ app.id);
   *      })
   *    });
   *
   * app_manager.getInstalledApps({'type':'jsapp', 'disabled':true})
   *   .then(function(apps) {
   *      apps.forEach(function(app) {
   *          console.log('All disabled jsapp type application : '+ app.id);
   *      })
   *    });
   * ```
   */
  getInstalledApps(filter) {
    return new Promise(function(resolve, reject) {
      var args = {};
      if (filter) {
        var converted_filter = {};
        for (var key in filter) {
          if (available_keys.indexOf(key) != -1) {
            converted_filter[convert_key[key]] = filter[key];
          }
        }
        args['filter'] = converted_filter;
      }
      native_async_call('manager.instapps', args, function(msg) {
        if (msg['reason']) {
          reject(new Error(msg['reason']));
          return;
        }
        var apps = msg['data'].map(function(handle) {
          return new InstalledApplication(handle);
        });
        resolve(apps);
      });
    });
  }

  /**
   * @method getInstalledApp
   *
   * @param {string} appid
   *
   * @return {InstalledApplication}
   *  If does not existed, undefined will returned
   */
  getInstalledApp(appid) {
    var ret = native_sync_call('manager.instapp', {'appid': appid});
    if (ret['data']) {
      return new InstalledApplication(ret['data']);
    }
    return undefined;
   }

  /**
   * @method getRunningApps
   *
   * @return {Promise | RunningApplication[]}
   */
  getRunningApps() {
    return new Promise(function(resolve, reject) {
      native_async_call('manager.runningapps', undefined, function(msg) {
        if (msg['reason']) {
          reject(new Error(msg['reason']));
          return;
        }
        var apps = msg['data'].map(function(app) {
          return new RunningApplication(app.id, app.pid);
        });
        resolve(apps);
      });
    });
  }

  /**
   * @method getRunningApp
   *
   * @param {string | Number} appid or pid
   *
   * @return {RunningApplication}
   *  If does not existed, undefined will returned
   */
  getRunningApp(appidOrPid) {
    var args = {};
    if (typeof appidOrPid === 'number') {
      args['pid'] = appidOrPid;
    } else {
      args['appid'] = appidOrPid;
    }
    var ret = native_sync_call('manager.runningapp', args);
    if (ret['data']) {
      return new RunningApplication(ret['data'].id, ret['data'].pid);
    }
    return undefined;
  }

  /**
   * @method isRunningApp
   *
   * @param {string | Number} appid or pid
   * @return {boolean}
   */
  isRunningApp(appidOrPid) {
    return this.getRunningApp(appidOrPid) != undefined;
  }

  __event_handle__(data) {
    if (data['event'] != 'launch' && data['event'] != 'terminate') {
      var app = new RunningApplication(data['data'].id, data['data'].pid);
      this.emit(data['event'], app);
    }
  }

  /**
   * The event fired when a application is launched
   * @event launch
   * @param {RunningApplication} launched application
   */

  /**
   * The event fired when a application is terminated
   * @event terminate
   * @param {RunningApplication} terminated application
   */

};

exports = new AppManager();
