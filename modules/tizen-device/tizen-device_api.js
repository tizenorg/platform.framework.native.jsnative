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
//var AV = require('')

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
var DEVICE_BATTERY = Symbol();
var DEVICE_DISPLAY = Symbol();
var DEVICE_HAPTIC = Symbol();
var DEVICE_FLASH = Symbol();
var DEVICE_LED = Symbol();
var DEVICE_POWER = Symbol();

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
   * @type Device.Display
   * @readOnly
   */
  get display() {
    if (!this[DEVICE_DISPLAY]) {
      this[DEVICE_DISPLAY] = new Display();
    }
    return this[DEVICE_DISPLAY];
  }

  /**
   * @attribute haptic
   * @type Device.Haptic
   * @readOnly
   */
  get haptic() {
    if (!this[DEVICE_HAPTIC]) {
      this[DEVICE_HAPTIC] = new Haptic();
    }
    return this[DEVICE_HAPTIC];
  }

  /**
   * @attribute flash
   * @type Device.Flash
   * @readOnly
   */
  get flash() {
    if (!this[DEVICE_FLASH]) {
      this[DEVICE_FLASH] = new Flash();
    }
    return this[DEVICE_FLASH];
  }

  /**
   * @attribute led
   * @type Device.Led
   * @readOnly
   */
  get led() {
    if (!this[DEVICE_LED]) {
      this[DEVICE_LED] = new Led();
    }
    return this[DEVICE_LED];
  }

  /**
   * @attribute power
   * @type Device.Power
   * @readOnly
   */
  get power() {
    if (!this[DEVICE_POWER]) {
      this[DEVICE_POWER] = new Power();
    }
    return this[DEVICE_POWER];
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
    if (ev['event'] === 'battery.charging') {
      this[BATTERY_STATE] = ev['value'];
      changed = true;
    } else if (ev['event'] === 'battery.capacity') {
      this[BATTERY_CAPACITY] = ev['value'];
      changed = true;
    } else if (ev['event'] === 'battery.level') {
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
 * @since 3.0
 * @namespace Device
 * @extends Node.EventEmmitter
 */
var DISPLAY_STATE = Symbol();

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
    return callSync('display.getCount')['value'];
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
    var value_v = String(value).toLowerCase();
    if (['normal', 'screen_dim', 'screen_off'].indexOf(value_v) >= 0) {
      var ret = callSync('display.setState', {'state': value_v})['value'];
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
    var ret = callSync('display.getMaxBrightness',
                       {'index': Number(index)});
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
    var ret = callSync('display.getBrightness',
                       {'index': Number(index)});
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
    callSync('display.setBrightness',
             {'index': Number(index),
              'value': Number(value)});
  }

  /**
   * Emitted when a display state is changed.
   * ```
   * var device = require('tizen-device');
   * device.display.on('changed', function(state) {
   *   console.log('display state is '+ state);
   * });
   * ```
   * @event changed
   * @param {String} state The changed display state
   */
  __event_handle__(ev) {
    if (ev['event'] === 'dispaly.state') {
      this[DISPLAY_STATE] = ev['value'];
      this.emit('changed', this[DISPLAY_STATE]);
    }
  }
};

/**
 * The Haptic class provides functions to control a vibrator.
 *
 * @class Haptic
 * @since 3.0
 * @namespace Device
 */
class Haptic {
  /**
   * Vibrates during the specified time with a constant intensity.
   *
   * @method vibrate
   * @param {Number} duration The play duration in milliseconds
   * @param {Number} intensity The amount of the intensity variation (0 ~ 100)
   * @privilege http://tizen.org/privilege/haptic
   */
  vibrate(duration, intensity) {
    callAsync('haptic.vibrate',
              {'duration': Number(duration),
               'intensity': Number(intensity)});
  }

  /**
   * Cancels all vibration effects which are being played.
   *
   * @method cancel
   * @privilege http://tizen.org/privilege/haptic
   */
  cancel() {
    callAsync('haptic.cancel');
  }
};

/**
 * The Flash class provides functions to control a flash device that is located
 * next to the camera.
 *
 * @class Flash
 * @since 3.0
 * @namespace Device
 * @extends Node.EventEmmitter
 */
var FLASH_BRIGHTNESS = Symbol();

class Flash extends EE {
  constructor() {
    super();
  }

  /**
   * Gets the maximum brightness value of a flash device.
   *
   * @attribute maxBrightness
   * @type {Number}
   * @readOnly
   * @privilege http://tizen.org/privilege/led
   */
  get maxBrightness() {
    return callSync('flash.getMaxBrightness')['value'];
  }

  /**
   * Gets and Sets the brightness value of a flash device.
   *
   * @attribute brightness
   * @type {Number}
   * @readOnly
   * @privilege http://tizen.org/privilege/led
   */
  get brightness() {
    if (!this[FLASH_BRIGHTNESS]) {
      this[FLASH_BRIGHTNESS] = callSync('flash.getBrightness')['value'];
    }
    return this[FLASH_BRIGHTNESS];
  }

  set brightness(value) {
    var ret = callSync('flash.setBrightness',
                       {'value': Number(value)})['value'];
    if (ret) {
      this[FLASH_BRIGHTNESS] = ret;
    }
  }

  /**
   * Emitted when a flash brightness is changed.
   * ```
   * var device = require('tizen-device');
   * device.flash.on('changed', function(brightness) {
   *   console.log('changed flash brightness is '+ brightness);
   * });
   * ```
   * @event changed
   * @param {String} brightness The changed brightness value
   */
  __event_handle__(ev) {
    if (ev['event'] === 'flash.brightness') {
      this[FLASH_BRIGHTNESS] = ev['value'];
      this.emit('changed', this[FLASH_BRIGHTNESS]);
    }
  }
};

/**
 * The Led class provides functions to control a LED that is located
 * to the front of a device.
 *
 * @class Led
 * @since 3.0
 * @namespace Device
 */
class Led {
  /**
   * Plays the custom effect of the service LED.
   *
   * @method play
   * @param {Number} timeOn Turn on time in milliseconds
   * @param {Number} timeOff Turn off time in milliseconds
   * @param {Object} options
   * @param {String} options.color The Color value, RGB in hex, eg '#00FF00'
   * @param {Boolean} options.dutyOn
   * @privilege http://tizen.org/privilege/led
   */
  play(timeOn, timeOff, options) {
    var color;
    var dutyOn;
    if (options) {
      if (typeof options.color === 'string' && options.color[0] === '#') {
        color = parseInt(options.color.substring(1, options.color.length), 16);
      }
      dutyOn = options.dutyOn;
    }

    callAsync('led.play', {
        'timeOn': Number(timeOn),
        'timeOff': Number(timeOff),
        'color': color,
        'dutyOn': options.dutyOn
    });
  }

  /**
   * Stops the custom effect of the service LED.
   *
   * @method stop
   * @privilege http://tizen.org/privilege/led
   */
  stop() {
    callAsync('led.stop');
  }
};


/**
 * The Power class provides functions to control the power service.
 * It can be made to hold the specific state to avoid changing display
 * and CPI state internally.
 *
 * @class Power
 * @since 3.0
 * @namespace Device
 */
var POWER_STATES = ['cpu', 'normal', 'dim'];
class Power {
  /**
   * Locks the given lock state for a specified time.
   *
   * @method request
   * @param {String} state The power state to request lock
   * @value 'cpu' The CPU state is set to awake and it does not go to SLEEP
   *              state automatically.
   * @value 'normal' The minimal screen state is set to NORMAL and device does
   *                 not change to DIM state automatically.
   * @value 'dim' The minimal screen state is set to DIM and device does not
   *              change to OFF state automatically.
   * @param {Number} timeout The positive number in milliseconds
   *                 or 0 for permanent lock
   * @privilege http://tizen.org/privilege/display
   */
  request(state, timeout) {
    var state_v = String(state).toLowerCase();
    if (POWER_STATES.indexOf(state_v) >= 0) {
      callAsync('power.request',
                {'state': state_v,
                 'timeout': Number(timeout)});
    }
  }

  /**
   * Releases the given lock state locked before.
   *
   * @method release
   * @param {String} state The power state to release lock
   * @value 'cpu' The CPU state is set to awake and it does not go to SLEEP
   *              state automatically.
   * @value 'normal' The minimal screen state is set to NORMAL and device does
   *                 not change to DIM state automatically.
   * @value 'dim' The minimal screen state is set to DIM and device does not
   *              change to OFF state automatically.
   * @privilege http://tizen.org/privilege/display
   */
  release(state) {
    var state_v = String(state).toLowerCase();
    if (POWER_STATES.indexOf(state_v) >= 0) {
      callAsync('power.release', {'state': state_v});
    }
  }

  /**
   * Reboots the device.
   *
   * @method reboot
   * @param {String} reason Pass to the platform and kernel to request special
   *                 reboot reason
   * @privilege http://tizen.org/privilege/reboot
   */
  reboot(reason) {
    callAsync('power.reboot', {'reason': reason});
  }
};

exports = new Device();
