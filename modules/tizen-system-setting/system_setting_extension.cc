#include "system_setting_extension.h"

#include <dlog.h>
#include <unordered_map>

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

xwalk::XWalkExtensionInstance* SystemSettingExtension::CreateInstance() {
  return new SystemSettingInstance;
}

static void onSettingChanged(system_settings_key_e key, void* user_data) {
  LOGD("Enter");

  std::string keyStr;
  for (auto iter = settingKeys.begin(); iter !=  settingKeys.end(); iter++) {
    system_settings_key_e eKey = iter->second;
    if (key == eKey) {
      keyStr = iter->first;
      break;
    }
  }

  SystemSettingInstance* instance = static_cast<SystemSettingInstance*>(user_data);
  instance->FireSimpleEvent(keyStr);

}

SystemSettingInstance::SystemSettingInstance() {
  LOGD("Enter");

  for (auto iter = settingKeys.begin(); iter !=  settingKeys.end(); iter++) {
    system_settings_key_e eKey = iter->second;
    int ret = system_settings_set_changed_cb(eKey, onSettingChanged, static_cast<void*>(this));
    if (ret != SYSTEM_SETTINGS_ERROR_NONE) {
      std::string keyStr = iter->first;
      LOGE("Is is failed to register listener: %s (%d)", keyStr.c_str(), ret);
    } else {
      std::string keyStr = iter->first;
    }
  }
}

SystemSettingInstance::~SystemSettingInstance() {
  LOGD("Enter");

  for (auto iter = settingKeys.begin(); iter !=  settingKeys.end(); iter++) {
    system_settings_key_e eKey = iter->second;
    int ret = system_settings_unset_changed_cb(eKey);
    if (ret != SYSTEM_SETTINGS_ERROR_NONE) {
      std::string keyStr = iter->first;
      LOGE("Is is failed to remove listener: %s (%d)", keyStr.c_str(), ret);
    } else {
      std::string keyStr = iter->first;
    }
  }
}

void SystemSettingInstance::HandleMessage(const char* msg) {
  LOGD("Enter");
  HandleMessage(msg, false);
}

void SystemSettingInstance::HandleSyncMessage(const char* msg) {
  LOGD("Enter");
  HandleMessage(msg, true);
}

void SystemSettingInstance::HandleMessage(const char* msg, bool is_sync) {
  LOGD("Enter");

  picojson::value value;
  std::string err;
  picojson::parse(value, msg, msg + strlen(msg), &err);
  if (!err.empty()) {
    LOGE("Ignoring message, error: %s", err.c_str());
    return;
  }

  if (!value.is<picojson::object>()) {
    LOGE("Ignoring message. It is not an object.");
    return;
  }

  std::string cmd = value.get("cmd").get<std::string>();
  picojson::value result = picojson::value(picojson::object());

  const picojson::value& args = value.get("args");
  if (!args.is<picojson::object>()) {
    LOGE("No \"args\" field in message");
    return;
  }

  if (cmd == SYSTEMSETTING_SET) {
    setValue(args, result.get<picojson::object>());
  } else if (cmd == SYSTEMSETTING_GET) {
    getValue(args, result.get<picojson::object>());
  } else {
    LOGE("Ignoring message, Invalid command - %s", cmd.c_str());
    return;
  }

  if (is_sync)
    SendSyncReply(result.serialize().c_str());
}

void SystemSettingInstance::FireSimpleEvent(const std::string& event, const std::string& data) {
  LOGD("Enter");

  picojson::value::object obj;
  obj["event"] = picojson::value(event);
  if (data.length() > 0) {
    obj["data"] = picojson::value(data);
  }

  PostMessage(picojson::value(obj).serialize().c_str());
}

void SystemSettingInstance::setValue(const picojson::value& args, picojson::object& out) {
  LOGD("Enter");

  std::string key = args.get("key").get<std::string>();
  std::string type = args.get("type").get<std::string>();
  std::string value = args.get("value").get<std::string>();

  LOGD("[DEBUG_NATIVE] key: %s(%s), value: %s", key.c_str(), type.c_str(), value.c_str());

  system_settings_key_e eKey;
  auto iter = settingKeys.find(key);
  if (iter == settingKeys.end()) {
    LOGE("NotFound key");
    ReportError("NotFound Key", out);
    return;
  }
  eKey = iter->second;

  int ret;
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
    ReportError("Platform Error: Invalid type", out);
    return;
  }

  if (ret == SYSTEM_SETTINGS_ERROR_NONE) {
    ReportSuccess(out);
  } else {
    LOGE("Is is failed to set system setting value: %s - %d", key.c_str(), ret);
    std::string errMsg = "It is failed to set system setting value - " + key;
    ReportError(errMsg, out);
  }

}

void SystemSettingInstance::getValue(const picojson::value& args, picojson::object& out) {
  LOGD("Enter");

  std::string key = args.get("key").get<std::string>();
  std::string type = args.get("type").get<std::string>();

  LOGD("[DEBUG_NATIVE] key: %s(%s)", key.c_str(), type.c_str());

  system_settings_key_e eKey;
  auto iter = settingKeys.find(key);
  if (iter == settingKeys.end()) {
    LOGE("NotFound key");
    ReportError(out);
    return;
  }
  eKey = iter->second;

  int ret;
  std::string retVal;
  if(type == TYPE_INT) {
    int val;
    ret = system_settings_get_value_int(eKey, &val);
    if (ret == SYSTEM_SETTINGS_ERROR_NONE) {
      retVal = std::to_string(val);
      ReportSuccess(picojson::value(retVal), out);
      return;
    }
  } else if (type == TYPE_STRING) {
    char* val;
    ret = system_settings_get_value_string(eKey, &val);
    if (ret == SYSTEM_SETTINGS_ERROR_NONE) {
      retVal = std::string(val);
      ReportSuccess(picojson::value(retVal), out);
      return;
    }
  } else if (type == TYPE_BOOL) {
    bool val;
    ret = system_settings_get_value_bool(eKey, &val);
    if (ret == SYSTEM_SETTINGS_ERROR_NONE) {
      retVal = val ? "true" : "false" ;
      ReportSuccess(picojson::value(retVal), out);
      return;
    }
  } else {
    LOGE("Invalid Type");
  }

  LOGE("Is is failed to get system setting value: %s - %d", key.c_str(), ret);
  std::string errMsg = "It is failed to get system setting value - " + key;
  ReportError(errMsg, out);
}

void SystemSettingInstance::ReportSuccess(picojson::object& out) {
  LOGD("Enter");
  out.insert(std::make_pair("status", picojson::value("success")));
}

void SystemSettingInstance::ReportSuccess(const picojson::value& result, picojson::object& out) {
  LOGD("Enter");
  out.insert(std::make_pair("status", picojson::value("success")));
  out.insert(std::make_pair("result", result));
}

void SystemSettingInstance::ReportError(picojson::object& out) {
  LOGD("Enter");
  out.insert(std::make_pair("status", picojson::value("error")));
}

void SystemSettingInstance::ReportError(const std::string errMessage, picojson::object& out) {
  LOGD("Enter");
  out.insert(std::make_pair("status", picojson::value("error")));
  out.insert(std::make_pair("errorMessage", picojson::value(errMessage)));
}

}  // namespace systemsetting

EXPORT_XWALK_EXTENSION(system_setting, systemsetting::SystemSettingExtension);
