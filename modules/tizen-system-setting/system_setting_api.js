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

/*
 * The Tizen Native JS MediaContent Module.<br>
 * ## Example
	var setting = require('tizen-system-setting');
 *
 * @module tizen-system-setting
 */
'use strict';  // 'strict mode' allows you to place a program, or a function, in a “strict” operating context

var EE = require('events');  // for events
var validator_ = require("arguments-validator");
var types_ = validator_.Types;

var settingKeyTypes = {
  "incoming_call_ringtone" : "string",
  "wallpaper_home_screen" : "string",
  "wallpaper_lock_screen" : "string",
  "font_size" : "int",
  "font_type" : "string",
  "motion_activation" : "bool",
  "email_alert_ringtone" : "string",
  "usb_debugging_enabled" : "bool",
  "3g_data_network_enabled" : "bool",
  "lockscreen_app" : "string",
  "default_font_type" : "string",
  "locale_country" : "string",
  "locale_language" : "string",
  "locale_timeformat_24hour" : "bool",
  "locale_timezone" : "string",
  "time_changed" : "int",
  "sound_lock" : "bool",
  "sound_silent_mode" : "bool",
  "sound_touch" : "bool",
  "display_screen_rotation_auto" : "bool",
  "device_name" : "bool",
  "motion_enabled" : "bool",
  "network_wifi_notification" : "bool",
  "network_flight_mode" : "bool",
  "screen_backlight_time" : "int",
  "sound_notification" : "string",
  "sound_notification_repetition_period" : "int",
   "lock_state" : "int",
};

function native_call_sync(cmd, args) {
  var request = JSON.stringify({
    cmd: cmd,
    args: args || {}
  });

  return JSON.parse(extension.internal.sendSyncMessage(request));
}

function registerEventHandler(app) {
  var handler = (function(self) {
    return function(json) {
      var msg = JSON.parse(json);
      self.__event_handle__(msg);
    };
  })(app);
  extension.setMessageListener(handler);
}

/*
 * System Settings API provides functions for getting the system configuration related to user preferences.<br>
 * The main features of the System Settings API include accessing system-wide configurations, such as ringtones, wallpapers, and etc.
 *
 * @class SystemSetting
 */
class SystemSetting extends EE {
  constructor() {
    super();
    registerEventHandler(this);
  }

  /*
   * Fired when the system setting value changed.
   * ## Example
   var setting = require('tizen-system-setting');
   setting.on(key, function(key){
     console.log(key + " value is changed");
   }
   *
   * @event incoming_call_ringtone
   * @event wallpaper_home_screen
   * @event wallpaper_lock_screen
   * @event font_size
   * @event font_type
   * @event motion_activation
   * @event email_alert_ringtone
   * @event usb_debugging_enabled
   * @event 3g_data_network_enabled
   * @event lockscreen_app
   * @event default_font_type
   * @event locale_country
   * @event locale_language
   * @event locale_timeformat_24hour
   * @event locale_timezone
   * @event time_changed
   * @event sound_lock
   * @event sound_silent_mode
   * @event sound_touch
   * @event display_screen_rotation_auto
   * @event device_name
   * @event motion_enabled
   * @event network_wifi_notification
   * @event network_flight_mode
   * @event screen_backlight_time
   * @event sound_notification
   * @event sound_notification_repetition_period
   * @event lock_state
   */
  __event_handle__(msg) {
    this.emit(msg.event, msg.event);
  }

  /*
   * Sets the system settings value associated with the given key
   * ## Example
   var setting = require('tizen-system-setting');
   setting.setValue("display_screen_rotation_auto", "false");
   *
   * @method setValue
   * @param {String} key The key name of the system settings.
   * @value 'incoming_call_ringtone'
   * @value 'wallpaper_home_screen'
   * @value 'wallpaper_lock_screen'
   * @value 'font_size'
   * @value 'font_type'
   * @value 'motion_activation'
   * @value 'email_alert_ringtone'
   * @value 'usb_debugging_enabled'
   * @value '3g_data_network_enabled'
   * @value 'lockscreen_app'
   * @value 'default_font_type'
   * @value 'locale_country'
   * @value 'locale_language'
   * @value 'locale_timeformat_24hour'
   * @value 'locale_timezone'
   * @value 'time_changed'
   * @value 'sound_lock'
   * @value 'sound_silent_mode'
   * @value 'sound_touch'
   * @value 'display_screen_rotation_auto'
   * @value 'device_name'
   * @value 'motion_enabled'
   * @value 'network_wifi_notification'
   * @value 'network_flight_mode'
   * @value 'screen_backlight_time'
   * @value 'sound_notification'
   * @value 'sound_notification_repetition_period'
   * @value 'lock_state'
   * @param {String} value The new system settings value of the given key.
   * @throw
   * * Error with specific messages.
   */
  setValue() {
    var args = validator_.validateArgs(arguments, [{
      name : 'key',
      type : types_.STRING
    },{
      name : 'value',
      type : types_.STRING
    } ]);

    args.type = settingKeyTypes[args.key];
    if(args.type == undefined) {
      throw new Error("Undefined key");
    }

    var ret = native_call_sync('SystemSetting_set', args);

    if (ret['status'] != 'success') {
      throw new Error(ret['errorMessage']);
    }
  }

  /*
   * Gets the system settings value associated with the given key
   * ## Example
   var setting = require('tizen-system-setting');
   var ret = setting.getValue("display_screen_rotation_auto");
   console.log("device rotation auto: " + ret);
   *
   * @method setValue
   * @param {String} key The key name of the system settings.
   * @value 'incoming_call_ringtone'
   * @value 'wallpaper_home_screen'
   * @value 'wallpaper_lock_screen'
   * @value 'font_size'
   * @value 'font_type'
   * @value 'motion_activation'
   * @value 'email_alert_ringtone'
   * @value 'usb_debugging_enabled'
   * @value '3g_data_network_enabled'
   * @value 'lockscreen_app'
   * @value 'default_font_type'
   * @value 'locale_country'
   * @value 'locale_language'
   * @value 'locale_timeformat_24hour'
   * @value 'locale_timezone'
   * @value 'time_changed'
   * @value 'sound_lock'
   * @value 'sound_silent_mode'
   * @value 'sound_touch'
   * @value 'display_screen_rotation_auto'
   * @value 'device_name'
   * @value 'motion_enabled'
   * @value 'network_wifi_notification'
   * @value 'network_flight_mode'
   * @value 'screen_backlight_time'
   * @value 'sound_notification'
   * @value 'sound_notification_repetition_period'
   * @value 'lock_state'
   * @return {String} value he current system settings value of the given key.
   * @throw
   * * Error with specific messages.
   */
  getValue() {
    var args = validator_.validateArgs(arguments, [{
      name : 'key',
      type : types_.STRING
    } ]);

    args.type = settingKeyTypes[args.key];
    if(args.type == undefined) {
      throw new Error("Undefined key");
    }

    var ret = native_call_sync('SystemSetting_get', args);
    if (ret['status'] != 'success') {
      throw new Error(ret['errorMessage']);
    } else {
      return ret['result'];
    }
  }

};

exports = new SystemSetting();  // crosswalk extension style for exporting one module; NOT module.exports BUT exports
