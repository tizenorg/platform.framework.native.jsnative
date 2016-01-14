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
 * The Device module provides functions for to control devices
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

function callAsync(cmd, args) {
  var obj = {};
  obj['cmd'] = cmd;
  obj = Object.assign(obj, args);
  try {
    extension.postMessage(JSON.stringify(obj));
  } catch (e) {
    console.err(e.message);
  }
}

extension.setMessageListener(function(msg) {
  var ev = JSON.parse(msg);
  if (exports.battery && ev['event'].startsWith('battery.')) {
    exports.battery.__event_handle__(ev);
  } else if (exports.display && ev['event'].startsWith('display')) {
    exports.display.__event_handle__(ev);
  }
});

/**
 * ```
 * var device = require('tizen-device');
 * ```
 * @class Device
 * @since 3.0
 * @public
 */
var DEVICE_BATTERY = new Symbol();
var DEVICE_DISPLAY = new Symbol();

class Device {
  /**
   * @attribute battery
   * @type Device.Battery
   * @readOnly
   */
  get battery() {
    if (!this[DEVICE_BATTERY]) {
      this[DEVICE_BATTERY] = new Battery();
    }
    return this[DEVICE_BATTERY];
  }

  /**
   * @attribute display
   * @type Device.display
   * @readOnly
   */
  get display() {
    if (!this[DEVICE_DISPLAY]) {
      this[DEVICE_DISPLAY] = new Display();
    }
    return this[DEVICE_DISPLAY];
  }
};


/**
 * The Battery class provides functions to get information about the battery.
 *
 * @class Battery
 * @since 3.0
 * @namespace Device
 * @extends Node.EventEmmitter
 */
var BATTERY_STATE = Symbol();
var BATTERY_CAPACITY = Symbol();
var BATTERY_LEVEL = Symbol();

class Battery extends EE {

  constructor() {
    super();
  }

  /**
   * Gets the charging state.
   *
   * @attribute isCharging
   * @type {Boolean}
   * @readOnly
   */
  get isCharging() {
    if (!this[BATTERY_STATE]) {
      this[BATTERY_STATE] = callSync('battery.isCharging')['value'];
    }
    return this[BATTERY_STATE];
  }

  /**
   * Gets the battery level status.
   *
   * @attribute level
   * @value 'empty' The battery goes empty
   * @value 'critical' The battery charge is at a critical state
   * @value 'low' The battery has little charge left
   * @value 'high' The battery is charged
   * @value 'full' The battery status is full
   * @type {String}
   * @readOnly
   */
  get level() {
    if (!this[BATTERY_LEVEL]) {
      this[BATTERY_LEVEL] = callSync('battery.getLevel')['value'];
    }
    return this[BATTERY_LEVEL];
  }

  /**
   * Gets the remaining battery charge percentage (0 ~ 100).
   *
   * @attribute capacity
   * @type {Number}
   * @readOnly
   */
  get capacity() {
    if (!this[BATTERY_CAPACITY]) {
      this[BATTERY_CAPACITY] = callSync('battery.getCapacity')['value'];
    }
    return this[BATTERY_CAPACITY];
  }

  /**
   * Emitted when a battery status is changed.
   * ```
   * var device = require('tizen-device');
   * device.battery.on('changed', function(isCharging, level, capacity) {
   *   console.log('battery status is changed');
   *   console.log('  state : ' + (isCharging ? 'charging' : 'not charging'));
   *   console.log('  level : ' + level);
   *   console.log('  capacity : ' + capacity);
   * });
   * ```
   * @event changed
   * @param {Boolean} isCharging true if the battery is charging, else false
   * @param {String} level The changed battery level
   * @value 'empty' The battery goes empty
   * @value 'critical' The battery charge is at a critical state
   * @value 'low' The battery has little charge left
   * @value 'high' The battery is charged
   * @value 'full' The battery status is full
   * @param {Number} The changed battery percentage
   */
  __event_handle__(ev) {
    var changed = false;
    if (ev['event'] == 'battery.charging') {
      this[BATTERY_STATE] = ev['value'];
      changed = true;
    } else if (ev['event'] == 'battery.capacity') {
      this[BATTERY_CAPACITY] = ev['value'];
      changed = true;
    } else if (ev['event'] == 'battery.level') {
      this[BATTERY_LEVEL] = ev['value'];
      changed = true;
    }
    if (changed) {
      this.emit('changed',
          this[BATTERY_STATE], this[BATTERY_LEVEL], this[BATTERY_CAPACITY]);
    }
  }
};


/**
 * The Display class provides functions to control the display status.
 *
 * @class Display
 * @namespace Device
 * @extends Node.EventEmmitter
 */
var DISPLAY_STATE = new Symbol();

class Display extends EE {

  constructor() {
    super();
  }

  /**
   * Gets the number of display devices.
   *
   * @attribute count
   * @type {Number}
   * @readOnly
   * @privilege http://tizen.org/privilege/display
   */
  get count() {
    return callSync('display.getDisplayCount')['value'];
  }

  /**
   * Gets and Sets the current display state.
   *
   * @attribute state
   * @type {String}
   * @value 'normal' Normal state
   * @value 'screen_dim' Screen dim state
   * @value 'screen_off' Screen off state
   * @privilege http://tizen.org/privilege/display
   */
  get state() {
    if (!this[DISPLAY_STATE]) {
      this[DISPLAY_STATE] = callSync('display.getState')['value'];
    }
    return this[DISPLAY_STATE];
  }

  set state(value) {
    if (['normal', 'screen_dim', 'screen_off'].indexOf(value) >= 0) {
      var ret = callSync('display.setState', {'state', state})['value'];
      if (ret) {
        this[DISPLAY_STATE] = ret;
      }
    }
  }

  /**
   * Gets the maximum brightness value that can be set.
   *
   * @method getMaxBrightness
   * @param {Number} index The index of the display
   * @return {Number} The maximum brightness value of the display
   * @privilege http://tizen.org/privilege/display
   */
  getMaxBrightness(index) {
    var ret = callSync('display.getMaxBrightness', {'index': index});
    return ret['value'];
  }

  /**
   * Gets the display brightness value.
   *
   * @method getBrightness
   * @param {Number} index The index of the display
   * @return {Number} The current brightness value of the display
   * @privilege http://tizen.org/privilege/display
   */
  getBrightness(index) {
    var ret = callSync('display.getBrightness', {'index': index});
    return ret['value'];
  }

  /**
   * Sets the display brightness value.
   *
   * @method setBrightness
   * @param {Number} index The index of the display
   * @param {Number} value The new brightness value to set
   * @privilege http://tizen.org/privilege/display
   */
  setBrightness(index, value) {
    callsync('display.setBrightness', {'index': index, 'value': value});
  }

  /**
   * Emitted when a display state is changed.
   * ```
   * var device = require('tizen-device');
   * device.display.on('state', function(state) {
   *   console.log('display state is '+ state);
   * });
   * ```
   * @event state
   * @param {String} state The changed display state
   */
  __event_handle__(ev) {
    if (ev['event'] == 'dispaly.state') {
      this[DISPLAY_STATE] = ev['value'];
      this.emit('state', this[DISPLAY_STATE]);
    }
  }

};

exports = new Device();
