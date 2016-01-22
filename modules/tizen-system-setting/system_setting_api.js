/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd All Rights Reserved
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
* The Tizen Native JS SystemSetting Module.<br>
* The 'tizen-system-setting' module exports an instance of SystemSetting class.
* See the [SystemSetting](../classes/SystemSetting.html) class description.
* @example
*     var setting = require('tizen-system-setting');
* @module tizen-system-setting
*/
'use strict';
// 'strict mode' allows you to place a program, or a function,
// in a “strict” operating context

var EE = require('events');  // for events

var settingKeyTypes = {
  'incoming-call-ringtone' : 'string',
  'wallpaper-home-screen' : 'string',
  'wallpaper-lock-screen' : 'string',
  'font-size' : 'enum',
  'font-type' : 'string',
  'motion-activation' : 'bool',
  'email-alert-ringtone' : 'string',
  'usb-debugging-enabled' : 'bool',
  '3g-data-network-enabled' : 'bool',
  'lockscreen-app' : 'string',
  'default-font-type' : 'string',
  'locale-country' : 'string',
  'locale-language' : 'string',
  'locale-timeformat-24hour' : 'bool',
  'locale-timezone' : 'string',
  'time-changed' : 'int',
  'sound-lock' : 'bool',
  'sound-silent-mode' : 'bool',
  'sound-touch' : 'bool',
  'display-screen-rotation-auto' : 'bool',
  'device-name' : 'string',
  'motion-enabled' : 'bool',
  'network-wifi-notification' : 'bool',
  'network-flight-mode' : 'bool',
  'screen-backlight-time' : 'int',
  'sound-notification' : 'string',
  'sound-notification-repetition-period' : 'int',
   'lock-state' : 'enum',
};

function native_call_sync(cmd, args) {
  var request = JSON.stringify({
    cmd: cmd,
    args: args || {}
  });

  return JSON.parse(extension.internal.sendSyncMessage(request));
}

function registerEventHandler(manager) {
  var handler = (function(self) {
    return function(json) {
      var msg = JSON.parse(json);
      self.__event_handle__(msg);
    };
  })(manager);
  extension.setMessageListener(handler);
}

/**
 * SystemSetting Class provides functions for
 * getting the system configuration related to user preferences.<br>
 * The main features of the System Settings API include
 * accessing system-wide configurations, such as ringtones and wallpapers.<br>
 * The instance of this class will be returned
 * when require('tizen-system-setting') is called.
### System Setting Keys <a name="key_table"></a>
| Key | Available Values |
|-----|------------------|
| incoming-call-ringtone | Any string for the file path |
| wallpaper-home-screen | Any string for the file path |
| wallpaper-lock-screen | Any string for the file path |
| font-size |"small", "normal", "large", "huge", "giant" |
| font-type | Any string for the system font type |
| motion-activation |  A Boolean value |
| email-alert-ringtone | Any string for the file path |
| usb-debugging-enabled | A Boolean value |
| 3g-data-network-enabled | A Boolean value |
| lockscreen-app | Any string for the application package name |
| default-font-type | Any string for the system default font type |
| locale-country | Any string for the current country setting
in the LANGUAGE_REGION syntax (e.g. en_US_US) |
| locale-language | Any string for the current language setting
in the LANGUAGE_REGION syntax (e.g. en_US_US) |
| locale-timeformat-24hour | A Boolean value |
| locale-timezone | Any string for the current time zone |
| time-changed | Any string for the time value |
| sound-lock | A Boolean value |
| sound-silent-mode | A Boolean value |
| sound-touch | A Boolean value |
| display-screen-rotation-auto | A Boolean value |
| device-name | Any string for the device name |
| motion-enabled | A Boolean value |
| network-wifi-notification | A Boolean value |
| network-flight-mode | A Boolean value |
| screen-backlight-time | A number value |
| sound-notification | Any string for the file path |
| sound-notification-repetition-period | A number value |
| lock-state |"unlock", "lock", "launching-lock". |
 *
 * @class SystemSetting
 * @extends Node.EventEmitter
 */
class SystemSetting extends EE {
  constructor() {
    super();
    registerEventHandler(this);
  }

  /**
   * Fired when the system setting value changed.
   * For the available values for each key,
   * please see the [System Setting Keys table](#key_table).
   * @example
   *     var setting = require('tizen-system-setting');
   *     setting.on("change", function(key){
   *       console.log(key + " value is changed to " + setting.getValue(key));
   *     }
   * @event change
   * @param {String} key The key name of the system settings.
   * @value 3g-data-network-enabled
   * @value incoming-call-ringtone
   * @value wallpaper-home-screen
   * @value wallpaper-lock-screen
   * @value font-size
   * @value font-type
   * @value motion-activation
   * @value email-alert-ringtone
   * @value usb-debugging-enabled
   * @value lockscreen-app
   * @value default-font-type
   * @value locale-country
   * @value locale-language
   * @value locale-timeformat-24hour
   * @value locale-timezone
   * @value time-changed
   * @value sound-lock
   * @value sound-silent-mode
   * @value sound-touch
   * @value display-screen-rotation-auto
   * @value device-name
   * @value motion-enabled
   * @value network-wifi-notification
   * @value network-flight-mode
   * @value screen-backlight-time
   * @value sound-notification
   * @value sound-notification-repetition-period
   * @value lock-state
   */
  __event_handle__(msg) {
    this.emit(msg.event, msg.data);
  }

  /**
   * Sets the system settings value associated with the given key.
   * @example
   *     var setting = require('tizen-system-setting');
   *     setting.setValue("display-screen-rotation-auto", "false");
   *
   * @method setValue
   * @param {String} key The key name of the system settings.
   * @value 'incoming-call-ringtone'
   * @value 'wallpaper-home-screen'
   * @value 'wallpaper-lock-screen'
   * @value 'font-size'
   * @value 'font-type'
   * @value 'motion-activation'
   * @value 'email-alert-ringtone'
   * @value 'usb-debugging-enabled'
   * @value '3g-data-network-enabled'
   * @value 'lockscreen-app'
   * @value 'locale-country'
   * @value 'locale-language'
   * @value 'locale-timeformat-24hour'
   * @value 'locale-timezone'
   * @value 'time-changed'
   * @value 'sound-lock'
   * @value 'sound-silent-mode'
   * @value 'sound-touch'
   * @value 'display-screen-rotation-auto'
   * @value 'device-name'
   * @value 'motion-enabled'
   * @value 'network-wifi-notification'
   * @value 'network-flight-mode'
   * @value 'screen-backlight-time'
   * @value 'sound-notification'
   * @value 'sound-notification-repetition-period'
   * @value 'lock-state'
   * @param {String|Number|Boolean} value
   * The new system settings value of the given key.<br>
   * For the available values for each key,
   * please see the [System Setting Keys table](#key_table).
   * @throws
   * * InvalidValueError - If the parameter is invalid
   */
  setValue(key, value) {
    var keyType = settingKeyTypes[key];
    if (!keyType) {
      throw new Error("Undefined key");
    }

    var args = {
      key: String(key),
      value: String(value),
      type: keyType
    };

    var ret = native_call_sync('SystemSetting_set', args);

    if (ret['status'] !== 'success') {
      throw new Error(ret['errorMessage']);
    }
  }

  /**
   * Gets the system settings value associated with the given key.<br>
   * @example
   *     var setting = require('tizen-system-setting');
   *     var ret = setting.getValue("display-screen-rotation-auto");
   *     console.log("device rotation auto: " + ret);
   *
   * @method getValue
   * @param {String} key The key name of the system settings.
   * @value 'incoming-call-ringtone'
   * @value 'wallpaper-home-screen'
   * @value 'wallpaper-lock-screen'
   * @value 'font-size'
   * @value 'font-type'
   * @value 'motion-activation'
   * @value 'email-alert-ringtone'
   * @value 'usb-debugging-enabled'
   * @value '3g-data-network-enabled'
   * @value 'lockscreen-app'
   * @value 'default-font-type'
   * @value 'locale-country'
   * @value 'locale-language'
   * @value 'locale-timeformat-24hour'
   * @value 'locale-timezone'
   * @value 'time-changed'
   * @value 'sound-lock'
   * @value 'sound-silent-mode'
   * @value 'sound-touch'
   * @value 'display-screen-rotation-auto'
   * @value 'device-name'
   * @value 'motion-enabled'
   * @value 'network-wifi-notification'
   * @value 'network-flight-mode'
   * @value 'screen-backlight-time'
   * @value 'sound-notification'
   * @value 'sound-notification-repetition-period'
   * @value 'lock-state'
   * @return {String|Number|Boolean}
   * The current system settings value of the given key. <br>
   * If it is failed to get system setting value,
   * this method will return undefined.<br>
   * For the available values for each key,
   * please see the [System Setting Keys table](#key_table).
   */
  getValue(key) {
    var keyType = settingKeyTypes[key];
    if (!keyType) {
      return;
    }

    var args = {
      key: String(key),
      type: keyType
    };

    var ret = native_call_sync('SystemSetting_get', args);
    if (ret['status'] === 'success') {
      return ret['result'];
    }
  }

};

exports = new SystemSetting();
// crosswalk extension style for exporting one module;
// NOT module.exports BUT exports
