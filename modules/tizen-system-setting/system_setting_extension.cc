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
const std::string TYPE_ENUM = "enum";

static const std::unordered_map<std::string, system_settings_key_e> settingKeys = {
    {"incoming-call-ringtone", SYSTEM_SETTINGS_KEY_INCOMING_CALL_RINGTONE},
    {"wallpaper-home-screen", SYSTEM_SETTINGS_KEY_WALLPAPER_HOME_SCREEN},
    {"wallpaper-lock-screen", SYSTEM_SETTINGS_KEY_WALLPAPER_LOCK_SCREEN},
    {"font-size", SYSTEM_SETTINGS_KEY_FONT_SIZE},
    {"font-type", SYSTEM_SETTINGS_KEY_FONT_TYPE},
    {"motion-activation", SYSTEM_SETTINGS_KEY_MOTION_ACTIVATION},
    {"email-alert-ringtone", SYSTEM_SETTINGS_KEY_EMAIL_ALERT_RINGTONE},
    {"usb-debugging-enabled", SYSTEM_SETTINGS_KEY_USB_DEBUGGING_ENABLED},
    {"3g-data-network-enabled", SYSTEM_SETTINGS_KEY_3G_DATA_NETWORK_ENABLED},
    {"lockscreen-app", SYSTEM_SETTINGS_KEY_LOCKSCREEN_APP},
    {"default-font-type", SYSTEM_SETTINGS_KEY_DEFAULT_FONT_TYPE},
    {"locale-country", SYSTEM_SETTINGS_KEY_LOCALE_COUNTRY},
    {"locale-language", SYSTEM_SETTINGS_KEY_LOCALE_LANGUAGE},
    {"locale-timeformat-24hour", SYSTEM_SETTINGS_KEY_LOCALE_TIMEFORMAT_24HOUR},
    {"locale-timezone", SYSTEM_SETTINGS_KEY_LOCALE_TIMEZONE},
    {"time-changed", SYSTEM_SETTINGS_KEY_TIME_CHANGED},
    {"sound-lock", SYSTEM_SETTINGS_KEY_SOUND_LOCK},
    {"sound-silent-mode", SYSTEM_SETTINGS_KEY_SOUND_SILENT_MODE},
    {"sound-touch", SYSTEM_SETTINGS_KEY_SOUND_TOUCH},
    {"display-screen-rotation-auto", SYSTEM_SETTINGS_KEY_DISPLAY_SCREEN_ROTATION_AUTO},
    {"device-name", SYSTEM_SETTINGS_KEY_DEVICE_NAME},
    {"motion-enabled", SYSTEM_SETTINGS_KEY_MOTION_ENABLED},
    {"network-wifi-notification", SYSTEM_SETTINGS_KEY_NETWORK_WIFI_NOTIFICATION},
    {"network-flight-mode", SYSTEM_SETTINGS_KEY_NETWORK_FLIGHT_MODE},
    {"screen-backlight-time", SYSTEM_SETTINGS_KEY_SCREEN_BACKLIGHT_TIME},
    {"sound-notification", SYSTEM_SETTINGS_KEY_SOUND_NOTIFICATION},
    {"sound-notification-repetition-period", SYSTEM_SETTINGS_KEY_SOUND_NOTIFICATION_REPETITION_PERIOD},
    {"lock-state", SYSTEM_SETTINGS_KEY_LOCK_STATE},
};

static const std::unordered_map<std::string, system_settings_font_size_e> fontSizeValues = {
    {"small", SYSTEM_SETTINGS_FONT_SIZE_SMALL},
    {"normal", SYSTEM_SETTINGS_FONT_SIZE_NORMAL},
    {"large", SYSTEM_SETTINGS_FONT_SIZE_LARGE},
    {"huge", SYSTEM_SETTINGS_FONT_SIZE_HUGE},
    {"giant", SYSTEM_SETTINGS_FONT_SIZE_GIANT}
};

static const std::unordered_map<std::string, system_settings_idle_lock_state_e> lockStateValues = {
    {"unlock", SYSTEM_SETTINGS_LOCK_STATE_UNLOCK},
    {"lock", SYSTEM_SETTINGS_LOCK_STATE_LOCK},
    {"launching-lock", SYSTEM_SETTINGS_LOCK_STATE_LAUNCHING_LOCK}
};

xwalk::XWalkExtensionInstance* SystemSettingExtension::CreateInstance() {
  return new SystemSettingInstance;
}

static void onSettingChanged(system_settings_key_e key, void* user_data) {
  LOGD("Enter");

  std::string keyStr;
  for (auto it = settingKeys.begin(); it != settingKeys.end(); ++it) {
    system_settings_key_e eKey = it->second;
    if (key == eKey) {
      keyStr = it->first;
      break;
    }
  }

  SystemSettingInstance* instance =
      static_cast<SystemSettingInstance*>(user_data);
  instance->FireSimpleEvent("change", keyStr);

}

SystemSettingInstance::SystemSettingInstance() {
  LOGD("Enter");

  for (auto it = settingKeys.begin(); it != settingKeys.end(); ++it) {
    system_settings_key_e eKey = it->second;
    int ret = system_settings_set_changed_cb(eKey, onSettingChanged,
                                             static_cast<void*>(this));
    if (ret != SYSTEM_SETTINGS_ERROR_NONE) {
      std::string keyStr = it->first;
      LOGE("It is failed to register listener: %s (%s)", keyStr.c_str(),
           (getErrorMessage(ret)).c_str());
    }
  }
}

SystemSettingInstance::~SystemSettingInstance() {
  LOGD("Enter");

  for (auto it = settingKeys.begin(); it != settingKeys.end(); ++it) {
    system_settings_key_e eKey = it->second;
    int ret = system_settings_unset_changed_cb(eKey);
    if (ret != SYSTEM_SETTINGS_ERROR_NONE) {
      std::string keyStr = it->first;
      LOGE("It is failed to remove listener: %s (%s)",
           keyStr.c_str(), (getErrorMessage(ret)).c_str());
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

void SystemSettingInstance::FireSimpleEvent(const std::string& event,
                                            const std::string& data) {
  LOGD("Enter");

  picojson::value::object obj;
  obj["event"] = picojson::value(event);
  if (data.length() > 0) {
    obj["data"] = picojson::value(data);
  }

  PostMessage(picojson::value(obj).serialize().c_str());
}

void SystemSettingInstance::setValue(const picojson::value& args,
                                     picojson::object& out) {
  LOGD("Enter");

  std::string key = args.get("key").get<std::string>();
  std::string type = args.get("type").get<std::string>();
  std::string value = args.get("value").get<std::string>();

  LOGD("[DEBUG_NATIVE] SET key: %s(%s), value: %s", key.c_str(), type.c_str(),
       value.c_str());

  system_settings_key_e eKey;
  auto iter = settingKeys.find(key);
  if (iter == settingKeys.end()) {
    LOGE("NotFound key");
    ReportError("NotFound Key", out);
    return;
  }
  eKey = iter->second;

  int ret;
  if (type == TYPE_INT) {
    int val = std::stoi(value);
    ret = system_settings_set_value_int(eKey, val);
  } else if (type == TYPE_STRING) {
    const char* val = value.c_str();
    ret = system_settings_set_value_string(eKey, val);
  } else if (type == TYPE_BOOL) {
    bool val;
    if (value == "true") {
      val = true;
    } else {
      val = false;
    }
    ret = system_settings_set_value_bool(eKey, val);
  } else if (type == TYPE_ENUM) {
    setEnumValue(eKey, value, out);
    return;
  } else {
    LOGE("Invalid Type");
    ReportError("Platform Error: Invalid type", out);
    return;
  }

  if (ret != SYSTEM_SETTINGS_ERROR_NONE) {
    std::string errMsg = "It is failed to set system setting value - "+ key
        + "(" + getErrorMessage(ret) + ")";
    LOGE("%s", errMsg.c_str());
    ReportError(errMsg, out);
  } else {
    ReportSuccess(out);
  }
}

void SystemSettingInstance::getValue(const picojson::value& args,
                                     picojson::object& out) {
  LOGD("Enter");

  std::string key = args.get("key").get<std::string>();
  std::string type = args.get("type").get<std::string>();

  LOGD("[DEBUG_NATIVE] GET key: %s(%s)", key.c_str(), type.c_str());

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
  if (type == TYPE_INT) {
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
  } else if (type == TYPE_ENUM) {
    getEnumValue(eKey, out);
    return;
  } else if (type == TYPE_BOOL) {
    bool val;
    ret = system_settings_get_value_bool(eKey, &val);
    if (ret == SYSTEM_SETTINGS_ERROR_NONE) {
      retVal = val ? "true" : "false";
      ReportSuccess(picojson::value(retVal), out);
      return;
    }
  } else {
    LOGE("Invalid Type");
  }

  std::string errMsg = "It is failed to get system setting value - " + key
      + "(" + getErrorMessage(ret) + ")";
  LOGE("%s", errMsg.c_str());
  ReportError(errMsg, out);
}

void SystemSettingInstance::setEnumValue(const system_settings_key_e eKey,
                                         const std::string value,
                                         picojson::object& out) {
  LOGD("Enter");

  int val;

  if (eKey == SYSTEM_SETTINGS_KEY_FONT_SIZE) {
    auto it = fontSizeValues.find(value);
    if (it == fontSizeValues.end()) {
      LOGE("Input value is wrong- %s", value.c_str());
      ReportError("Input value is wrong", out);
      return;
    }
    val = static_cast<int>(it->second);
  } else if (eKey == SYSTEM_SETTINGS_KEY_LOCK_STATE) {
    auto it = lockStateValues.find(value);
    if (it == lockStateValues.end()) {
      LOGE("Input value is wrong- %s", value.c_str());
      ReportError("Input value is wrong", out);
      return;
    }
    val = static_cast<int>(it->second);
  }

  LOGD("[DEBUG_NATIVE] SET key: %d(%d)", eKey, val);
  int ret = system_settings_set_value_int(eKey, val);
  if (ret != SYSTEM_SETTINGS_ERROR_NONE) {
    std::string errMsg = "It is failed to set system setting value - ("
        + getErrorMessage(ret) + ")";
    LOGE("%s", errMsg.c_str());
    ReportError(errMsg, out);
  } else {
    ReportSuccess(out);
  }
}

void SystemSettingInstance::getEnumValue(const system_settings_key_e eKey,
                                         picojson::object& out) {
  LOGD("Enter");

  int val;
  std::string retVal;

  int ret = system_settings_get_value_int(eKey, &val);
  if (ret != SYSTEM_SETTINGS_ERROR_NONE) {
    std::string errMsg = "It is failed to get system setting value - ("
        + getErrorMessage(ret) + ")";
    LOGE("%s", errMsg.c_str());
    ReportError(errMsg, out);
  }
  LOGD("[DEBUG_NATIVE] GET key: %d(%d)", eKey, val);

  if (eKey == SYSTEM_SETTINGS_KEY_FONT_SIZE) {
    for (auto it = fontSizeValues.begin(); it != fontSizeValues.end(); ++it) {
      system_settings_font_size_e eVal = it->second;
      if (val == (int) eVal) {
        retVal = it->first;
        break;
      }
    }
  } else if (eKey == SYSTEM_SETTINGS_KEY_LOCK_STATE) {
    for (auto it = lockStateValues.begin(); it != lockStateValues.end(); ++it) {
      system_settings_idle_lock_state_e eVal = it->second;
      if (val == (int) eVal) {
        retVal = it->first;
        break;
      }
    }
  }

  ReportSuccess(picojson::value(retVal), out);
}

void SystemSettingInstance::ReportSuccess(picojson::object& out) {
  LOGD("Enter");
  out.insert(std::make_pair("status", picojson::value("success")));
}

void SystemSettingInstance::ReportSuccess(const picojson::value& result,
                                          picojson::object& out) {
  LOGD("Enter");
  out.insert(std::make_pair("status", picojson::value("success")));
  out.insert(std::make_pair("result", result));
}

void SystemSettingInstance::ReportError(picojson::object& out) {
  LOGD("Enter");
  out.insert(std::make_pair("status", picojson::value("error")));
}

void SystemSettingInstance::ReportError(const std::string errMessage,
                                        picojson::object& out) {
  LOGD("Enter");
  out.insert(std::make_pair("status", picojson::value("error")));
  out.insert(std::make_pair("errorMessage", picojson::value(errMessage)));
}

std::string SystemSettingInstance::getErrorMessage(int err) {
  switch (err) {
    case SYSTEM_SETTINGS_ERROR_NONE:
      return "SYSTEM_SETTINGS_ERROR_NONE";
    case SYSTEM_SETTINGS_ERROR_INVALID_PARAMETER:
      return "SYSTEM_SETTINGS_ERROR_INVALID_PARAMETER";
    case SYSTEM_SETTINGS_ERROR_OUT_OF_MEMORY:
      return "SYSTEM_SETTINGS_ERROR_OUT_OF_MEMORY";
    case SYSTEM_SETTINGS_ERROR_IO_ERROR:
      return "SYSTEM_SETTINGS_ERROR_IO_ERROR";
    case SYSTEM_SETTINGS_ERROR_PERMISSION_DENIED:
      return "SYSTEM_SETTINGS_ERROR_PERMISSION_DENIED";
    case SYSTEM_SETTINGS_ERROR_NOT_SUPPORTED:
      return "SYSTEM_SETTINGS_ERROR_NOT_SUPPORTED";
    case SYSTEM_SETTINGS_ERROR_LOCKSCREEN_APP_PASSWORD_MODE:
      return "SYSTEM_SETTINGS_ERROR_LOCKSCREEN_APP_PASSWORD_MODE";
    default:
      return "Unknown Error from F/W";
  }
}

}  // namespace systemsetting

EXPORT_XWALK_EXTENSION(system_setting, systemsetting::SystemSettingExtension);
