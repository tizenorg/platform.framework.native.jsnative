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

class SystemSetting extends EE {
  constructor() {
    super();
    registerEventHandler(this);
  }

  __event_handle__(msg) {
    this.emit(msg.event, msg.event);
  }

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
