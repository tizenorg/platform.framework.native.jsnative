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
 * The Tizen Native JS Device Module provides functions for to control devices
 * or to get status of devices.
 * ```
 * var device = require('tizen-device');
 * ```
 * @module tizen-device
 */

'use strict';

var EE = require('events');

function callSync(cmd, args) {
  var obj = {};
  obj['cmd'] = cmd;
  obj = Object.assign(obj, args);
  try {
    return JSON.parse(extension.internal.sendSyncMessage(JSON.stringify(obj)));
  } catch (e) {
    console.err(e.message);
    return {};
  }
}

var battery_state = Symbol();
var battery_percent = Symbol();
var battery_level = Symbol();

extension.setMessageListener(function(msg) {
  console.log('listener is called. ' + msg);
  var ev = JSON.parse(msg);
  if (exports.battery && ev['event'].startsWith('battery.')) {
    exports.battery.__event_handle__(ev);
  }
});

/**
 * @class Battery
 * @namespace tizen-device
 * @extends Node.EventEmmitter
 */
class Battery extends EE {

  constructor() {
    super();
  }

  __event_handle__(ev) {
    if (ev['event'] == 'battery.charging') {
      console.log('event state!');
      this[battery_state] = ev['value'];
      this.emit('state', this[battery_state]);
    } else if (ev['event'] == 'battery.capacity') {
      console.log('event percent!');
      this[battery_percent] = ev['value'];
      this.emit('percent', this[battery_percent]);
    } else if (ev['event'] == 'battery.level') {
      console.log('event level!');
      this[battery_level] = ev['value'];
      this.emit('level', this[battery_level]);
    }
  }

  /**
   * Gets the charging state.
   *
   * @attribute isCharging
   * @type {Boolean}
   * @readOnly
   */
  get isCharging() {
    if (!this[battery_state]) {
      this[battery_state] = callSync('battery.isCharging')['value'];
    }
    return this[battery_state];
  }

  /**
   * Gets the battery level status.
   *
   * @attribute level
   * @type {String}
   * @readOnly
   */
  get level() {
    if (!this[battery_level]) {
      this[battery_level] = callSync('battery.getLevel')['value'];
    }
    return this[battery_level];
  }

  /**
   * Gets the remaining battery charge percentage (0 ~ 100).
   *
   * @attribute percent
   * @type {Number}
   * @readOnly
   */
  get percent() {
    if (!this[battery_percent]) {
      this[battery_percent] = callSync('battery.getCapacity')['value'];
    }
    return this[battery_percent];
  }

  /**
   * Emitted when a battery charge percentage is changed.
   * ```
   * var device = require('tizen-device');
   * device.battery.on('percent', function(percent) {
   *   console.log('battery charge percentage is changed : ' + percent);
   * });
   * ```
   * @event percent
   * @param {Number} percent The changed battery percentage
   */

  /**
   * Emitted when a battery level is changed.
   * ```
   * var device = require('tizen-device');
   * device.battery.on('level', function(level) {
   *   console.log('battery level is changed : ' + level);
   * });
   * ```
   * @event level
   * @param {String} level The changed battery level
   */

  /**
   * Emitted when a battery charging state is changed.
   * ```
   * var device = require('tizen-device');
   * device.battery.on('state', function(isCharging) {
   *   console.log('battery is '+ (isCharging ? 'charging' : 'not charging'));
   * });
   * ```
   * @event state
   * @param {Boolean} isCharging true if the battery is charging, else false
   */

};

exports.battery = new Battery();
