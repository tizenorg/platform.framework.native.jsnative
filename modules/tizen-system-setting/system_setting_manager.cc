#include "system_setting_extension.h"

#include <dlog.h>
#include <unordered_map>

#include <system_settings_manager.h>

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace systemsetting {

const std::string SYSTEMSETTING_SET = "SystemSetting_set";
const std::string SYSTEMSETTING_GET = "SystemSetting_get";

const std::string TYPE_INT = "int";
const std::string TYPE_STRING = "string";
const std::string TYPE_BOOL = "bool";

static const std::unordered_map<std::string, system_settings_key_e> settingKeys = {
    {"incoming_call_ringtone", SYSTEM_SETTINGS_KEY_INCOMING_CALL_RINGTONE},
    {"wallpaper_home_screen", SYSTEM_SETTINGS_KEY_WALLPAPER_HOME_SCREEN},
    {"wallpaper_lock_screen", SYSTEM_SETTINGS_KEY_WALLPAPER_LOCK_SCREEN},
    {"font_size", SYSTEM_SETTINGS_KEY_FONT_SIZE},
    {"font_type", SYSTEM_SETTINGS_KEY_FONT_TYPE},
    {"motion_activation", SYSTEM_SETTINGS_KEY_MOTION_ACTIVATION},
    {"email_alert_ringtone", SYSTEM_SETTINGS_KEY_EMAIL_ALERT_RINGTONE},
    {"usb_debugging_enabled", SYSTEM_SETTINGS_KEY_USB_DEBUGGING_ENABLED},
    {"3g_data_network_enabled", SYSTEM_SETTINGS_KEY_3G_DATA_NETWORK_ENABLED},
    {"lockscreen_app", SYSTEM_SETTINGS_KEY_LOCKSCREEN_APP},
    {"default_font_type", SYSTEM_SETTINGS_KEY_DEFAULT_FONT_TYPE},
    {"locale_country", SYSTEM_SETTINGS_KEY_LOCALE_COUNTRY},
    {"locale_language", SYSTEM_SETTINGS_KEY_LOCALE_LANGUAGE},
    {"locale_timeformat_24hour", SYSTEM_SETTINGS_KEY_LOCALE_TIMEFORMAT_24HOUR},
    {"locale_timezone", SYSTEM_SETTINGS_KEY_LOCALE_TIMEZONE},
    {"time_changed", SYSTEM_SETTINGS_KEY_TIME_CHANGED},
    {"sound_lock", SYSTEM_SETTINGS_KEY_SOUND_LOCK},
    {"sound_silent_mode", SYSTEM_SETTINGS_KEY_SOUND_SILENT_MODE},
    {"sound_touch", SYSTEM_SETTINGS_KEY_SOUND_TOUCH},
    {"display_screen_rotation_auto", SYSTEM_SETTINGS_KEY_DISPLAY_SCREEN_ROTATION_AUTO},
    {"device_name", SYSTEM_SETTINGS_KEY_DEVICE_NAME},
    {"motion_enabled", SYSTEM_SETTINGS_KEY_MOTION_ENABLED},
    {"network_wifi_notification", SYSTEM_SETTINGS_KEY_NETWORK_WIFI_NOTIFICATION},
    {"network_flight_mode", SYSTEM_SETTINGS_KEY_NETWORK_FLIGHT_MODE},
    {"screen_backlight_time", SYSTEM_SETTINGS_KEY_SCREEN_BACKLIGHT_TIME},
    {"sound_notification", SYSTEM_SETTINGS_KEY_SOUND_NOTIFICATION},
    {"sound_notification_repetition_period", SYSTEM_SETTINGS_KEY_SOUND_NOTIFICATION_REPETITION_PERIOD},
    {"lock_state", SYSTEM_SETTINGS_KEY_LOCK_STATE},
};

SystemSettingManager::SystemSettingManager() {
  LOGD("Enter");
}
SystemSettingManager::~SystemSettingManager() {
  LOGD("Enter");
}

PlatformResult SystemSettingManager::setValue(std::string key, std::string type, std::string value) {
  LOGD("Enter");

  system_settings_key_e eKey;
    auto iter = settingKeys.find(key);
    if (iter == settingKeys.end()) {
      LOGE("NotFound key");
      return;
    }
    eKey = iter->second;

    int ret = 0;
    if(type == TYPE_INT) {
      int val = std::stoi(value);
      ret = system_settings_set_value_int(eKey, val);
    } else if (type == TYPE_STRING) {
      const char* val = value.c_str();
      ret = system_settings_set_value_string(eKey, val);
    } else if (type == TYPE_BOOL) {
      bool val;
      if(value == "true") {
        val = true;
      } else {
        val = false;
      }
      ret = system_settings_set_value_bool(eKey, val);
    } else {
      LOGE("Invalid Type");
      return;
    }
}

std::string SystemSettingManager::getValue(std::string key, std::string type) {

}

}  // namespace systemsetting
