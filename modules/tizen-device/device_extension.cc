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

#include "device_extension.h"

#include <dlog.h>
#include <json/json.h>

#include <device/callback.h>
#include <device/battery.h>
#include <device/display.h>

#include <string>

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace device {

xwalk::XWalkExtensionInstance* DeviceExtension::CreateInstance() {
  return new DeviceInstance();
}

namespace {

const char* GetErrorMessage(int errcode) {
  switch (errcode) {
    case DEVICE_ERROR_INVALID_PARAMETER:
      return "Invalid parameter";
    case DEVICE_ERROR_PERMISSION_DENIED:
      return "Permission denied";
    case DEVICE_ERROR_OPERATION_FAILED:
      return "Operation not permitted";
    case DEVICE_ERROR_ALREADY_IN_PROGRESS:
      return "Operation already in progress";
    case DEVICE_ERROR_NOT_SUPPORTED:
      return "Not supported in this device";
    case DEVICE_ERROR_RESOURCE_BUSY:
      return "Device or resource busy";
    case DEVICE_ERROR_NOT_INITIALIZED:
      return "Not initialized";
    default:
      return "Unknown Error";
  }
}

const char* GetBatteryLevelString(device_battery_level_e level) {
  switch (level) {
    case DEVICE_BATTERY_LEVEL_EMPTY:
      return "empty";
    case DEVICE_BATTERY_LEVEL_CRITICAL:
      return "critical";
    case DEVICE_BATTERY_LEVEL_LOW:
      return "low";
    case DEVICE_BATTERY_LEVEL_HIGH:
      return "high";
    case DEVICE_BATTERY_LEVEL_FULL:
      return "full";
    default:
      return "unknown";
  }
}

const char* GetDisplayStateString(display_state_e state) {
  switch (state) {
    case DISPLAY_STATE_NORMAL:
      return "normal";
    case DISPLAY_STATE_SCREEN_DIM:
      return "screen_dim";
    case DISPLAY_STATE_SCREEN_OFF:
      return "screen_off";
    default:
      return "unknown";
  }
}

display_state_e GetDisplayStateFromString(const std::string& state) {
  if (state == "normal")
    return DISPLAY_STATE_NORMAL;
  else if (state == "screen_dim")
    return DISPLAY_STATE_SCREEN_DIM;
  else if (state == "screen_off")
    return DISPLAY_STATE_SCREEN_OFF;
  else
    return DISPLAY_STATE_NORMAL;
}

void DeviceChangedCallback(device_callback_e type, void* value, void* data) {
  DeviceInstance* self = reinterpret_cast<DeviceInstance*>(data);
  if (self == nullptr) {
    LOGE("Pointer of DeviceInstance has nullptr");
    return;
  }

  Json::Value event;
  Json::FastWriter writer;
  switch (type) {
    case DEVICE_CALLBACK_BATTERY_CAPACITY:
      event["event"] = "battery.capacity";
      event["value"] = reinterpret_cast<int>(value);
      break;
    case DEVICE_CALLBACK_BATTERY_LEVEL:
      event["event"] = "battery.level";
      event["value"] = GetBatteryLevelString(
          static_cast<device_battery_level_e>(reinterpret_cast<int>(value)));
      break;
    case DEVICE_CALLBACK_BATTERY_CHARGING:
      event["event"] = "battery.charging";
      event["value"] = (reinterpret_cast<int>(value) != 0);
      break;
    case DEVICE_CALLBACK_DISPLAY_STATE:
      event["event"] = "display.state";
      event["value"] = GetDisplayStateString(
          static_cast<display_state_e>(reinterpret_cast<int>(value)));
      break;
    default:
      event["event"] = "unknown";
      break;
  }

  if (event["event"].asString() != "unknown") {
    self->PostMessage(writer.write(event).c_str());
  }
}

}  // namespace

void DeviceInstance::Initialize() {
  // Battery
  REGISTER_XWALK_METHOD("battery.isCharging",
      this, &DeviceInstance::HandleBatteryIsCharging);
  REGISTER_XWALK_METHOD("battery.getCapacity",
      this, &DeviceInstance::HandleBatteryGetCapacity);
  REGISTER_XWALK_METHOD("battery.getLevel",
      this, &DeviceInstance::HandleBatteryGetLevel);

  // Display
  REGISTER_XWALK_METHOD("display.getDisplayCount",
      this, &DeviceInstance::HandleDisplayGetCount);
  REGISTER_XWALK_METHOD("display.getState",
      this, &DeviceInstance::HandleDisplayGetState);
  REGISTER_XWALK_METHOD("display.setState",
      this, &DeviceInstance::HandleDisplaySetState);
  REGISTER_XWALK_METHOD("display.getMaxBrightness",
      this, &DeviceInstance::HandleDisplayGetMaxBrightness);
  REGISTER_XWALK_METHOD("display.getBrightness",
      this, &DeviceInstance::HandleDisplayGetBrightness);
  REGISTER_XWALK_METHOD("display.setBrightness",
      this, &DeviceInstance::HandleDisplaySetBrightness);

  InitializeCallbacks();
}

void DeviceInstance::InitializeCallbacks() {
  if (device_add_callback(DEVICE_CALLBACK_BATTERY_CAPACITY,
                          DeviceChangedCallback, this) < 0) {
    LOGE("Failed to add callback for battery.capacity");
  }
  if (device_add_callback(DEVICE_CALLBACK_BATTERY_LEVEL,
                          DeviceChangedCallback, this) < 0) {
    LOGE("Failed to add callback for battery.level");
  }
  if (device_add_callback(DEVICE_CALLBACK_BATTERY_CHARGING,
                          DeviceChangedCallback, this) < 0) {
    LOGE("Failed to add callback for battery.charging");
  }
  if (device_add_callback(DEVICE_CALLBACK_DISPLAY_STATE,
                          DeviceChangedCallback, this) < 0) {
    LOGE("Failed to add callback for display.state");
  }
}

void DeviceInstance::HandleBatteryIsCharging(
    const Json::Value& /*args*/, Json::Value& reply) {
  int ret;
  bool value;
  if ((ret = device_battery_is_charging(&value)) < 0) {
    const char* errmsg = GetErrorMessage(ret);
    LOGE("Failed to get status of battery charging. %s", errmsg);
    reply["error"] = errmsg;
  } else {
    reply["value"] = value;
  }
}

void DeviceInstance::HandleBatteryGetCapacity(
    const Json::Value& /*args*/, Json::Value& reply) {
  int ret;
  int value;
  if ((ret = device_battery_get_percent(&value)) < 0) {
    const char* errmsg = GetErrorMessage(ret);
    LOGE("Failed to get percentage of battery. %s", errmsg);
    reply["error"] = errmsg;
  } else {
    reply["value"] = value;
  }
}

void DeviceInstance::HandleBatteryGetLevel(
    const Json::Value& /*args*/, Json::Value& reply) {
  int ret;
  device_battery_level_e value;
  if ((ret = device_battery_get_level_status(&value)) < 0) {
    const char* errmsg = GetErrorMessage(ret);
    LOGE("Failed to get level status of battery. %s", errmsg);
    reply["error"] = errmsg;
  } else {
    reply["value"] = GetBatteryLevelString(value);
  }
}

void DeviceInstance::HandleDisplayGetCount(
    const Json::Value& /*args*/, Json::Value& reply) {
  int ret;
  int value;
  if ((ret = device_display_get_numbers(&value)) < 0) {
    const char* errmsg = GetErrorMessage(ret);
    LOGE("Failed to get display count. %s", errmsg);
    reply["error"] = errmsg;
  } else {
    reply["value"] = value;
  }
}

void DeviceInstance::HandleDisplayGetState(
    const Json::Value& /*args*/, Json::Value& reply) {
  int ret;
  display_state_e value;
  if ((ret = device_display_get_state(&value)) < 0) {
    const char* errmsg = GetErrorMessage(ret);
    LOGE("Failed to get display state. %s", errmsg);
    reply["error"] = errmsg;
  } else {
    reply["value"] = GetDisplayStateString(value);
  }
}

void DeviceInstance::HandleDisplayGetMaxBrightness(
    const Json::Value& args, Json::Value& reply) {
  int ret;
  int index = args.get("index", 0).asInt();
  int value;
  if ((ret = device_display_get_max_brightness(index, &value)) < 0) {
    const char* errmsg = GetErrorMessage(ret);
    LOGE("Failed to get max brightness. %s", errmsg);
    reply["error"] = errmsg;
  } else {
    reply["value"] = value;
  }
}

void DeviceInstance::HandleDisplayGetBrightness(
    const Json::Value& args, Json::Value& reply) {
  int ret;
  int index = args.get("index", 0).asInt();
  int value;
  if ((ret = device_display_get_brightness(index, &value))< 0) {
    const char* errmsg = GetErrorMessage(ret);
    LOGE("Failed to get brightness. %s", errmsg);
    reply["error"] = errmsg;
  } else {
    reply["value"] = value;
  }
}

void DeviceInstance::HandleDisplaySetBrightness(
    const Json::Value& args, Json::Value& reply) {
  int ret;
  int index = args.get("index", 0).asInt();
  int value = args.get("value", 0).asInt();
  if ((ret = device_display_set_brightness(index, value)) < 0) {
    const char* errmsg = GetErrorMessage(ret);
    LOGE("Failed to set brightness. %s", errmsg);
    reply["error"] = errmsg;
  } else {
    // TODO(WonyoungChoi): return changed value
    reply["value"] = value;
  }
}

void DeviceInstance::HandleDisplaySetState(
    const Json::Value& args, Json::Value& reply) {
  int ret;
  std::string state = args.get("state", "").asString();
  display_state_e state_v = GetDisplayStateFromString(state);
  if ((ret = device_display_change_state(state_v)) < 0) {
    const char* errmsg = GetErrorMessage(ret);
    LOGE("Failed to change display state. %s", errmsg);
    reply["error"] = errmsg;
  } else {
    // TODO(WonyoungChoi): return changed state
    reply["value"] = state;
  }
}

}  // namespace device

EXPORT_XWALK_EXTENSION(tizen_device, device::DeviceExtension);

