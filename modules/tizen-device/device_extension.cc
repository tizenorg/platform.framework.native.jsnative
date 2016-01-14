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

#include <device/battery.h>
#include <device/callback.h>

#include <string>

#define LOG_TAG "JSNative"

namespace device {

xwalk::XWalkExtensionInstance* DeviceExtension::CreateInstance() {
  return new DeviceInstance();
}

namespace {

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
      event["value"] = reinterpret_cast<int>(value);
      break;
    case DEVICE_CALLBACK_BATTERY_CHARGING:
      event["event"] = "battery.charging";
      event["value"] = static_cast<bool>(reinterpret_cast<int>(value));
      break;
    case DEVICE_CALLBACK_DISPLAY_STATE:
      event["event"] = "display.state";
      event["value"] = reinterpret_cast<int>(value);
      break;
    default:
      event["event"] = "unknown";
      break;
  }

  if (event["event"].asString() != "unknown") {
    self->PostMessage(writer.write(event).c_str());
  }
}

const char* GetErrorMessage(int errcode) {
  switch (errcode) {
    case DEVICE_ERROR_INVALID_PARAMETER:
      return "Invalid parameter";
      break;
    case DEVICE_ERROR_PERMISSION_DENIED:
      return "Permission denied";
      break;
    case DEVICE_ERROR_OPERATION_FAILED:
      return "Operation not permitted";
      break;
    case DEVICE_ERROR_ALREADY_IN_PROGRESS:
      return "Operation already in progress";
      break;
    case DEVICE_ERROR_NOT_SUPPORTED:
      return "Not supported in this device";
      break;
    case DEVICE_ERROR_RESOURCE_BUSY:
      return "Device or resource busy";
      break;
    case DEVICE_ERROR_NOT_INITIALIZED:
      return "Not initialized";
      break;
    default:
      return "Unknown Error";
      break;
  }
}

const char* GetBatteryLevelString(device_battery_level_e level) {
  const char* str;
  switch (level) {
    case DEVICE_BATTERY_LEVEL_EMPTY:
      str = "empty";
      break;
    case DEVICE_BATTERY_LEVEL_CRITICAL:
      str = "critical";
      break;
    case DEVICE_BATTERY_LEVEL_LOW:
      str = "low";
      break;
    case DEVICE_BATTERY_LEVEL_HIGH:
      str = "high";
      break;
    case DEVICE_BATTERY_LEVEL_FULL:
      str = "full";
      break;
    default:
      str = "unknown";
      break;
  }
  return str;
}

}  // namespace

void DeviceInstance::Initialize() {
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

void DeviceInstance::HandleMessage(const char* msg) {
}

void DeviceInstance::HandleSyncMessage(const char* msg) {
  Json::Value args;
  Json::Reader reader;
  if (!reader.parse(msg, msg + strlen(msg), args)) {
    LOGE("Ignoring message. Can't parse msessage : %s",
         reader.getFormattedErrorMessages().c_str());
    return;
  }

  int ret;
  Json::Value reply;
  std::string cmd = args.get("cmd", "").asString();
  if (cmd == "battery.isCharging") {
    bool value;
    if ((ret = device_battery_is_charging(&value)) < 0) {
      const char* errmsg = GetErrorMessage(ret);
      LOGE("Failed to get status of battery charging. %s", errmsg);
      reply["error"] = errmsg;
    } else {
      reply["value"] = value;
    }
  } else if (cmd == "battery.getCapacity") {
    int value;
    if ((ret = device_battery_get_percent(&value)) < 0) {
      const char* errmsg = GetErrorMessage(ret);
      LOGE("Failed to get percentage of battery. %s", errmsg);
      reply["error"] = errmsg;
    } else {
      reply["value"] = value;
    }
  } else if (cmd == "battery.getLevel") {
    device_battery_level_e value;
    if ((ret = device_battery_get_level_status(&value)) < 0) {
      const char* errmsg = GetErrorMessage(ret);
      LOGE("Failed to get level status of battery. %s", errmsg);
      reply["error"] = errmsg;
    } else {
      reply["value"] = GetBatteryLevelString(value);
    }
  } else {
    reply["error"] = "Unknown message";
  }

  Json::FastWriter writer;
  SendSyncReply(writer.write(reply).c_str());
}

}  // namespace device

EXPORT_XWALK_EXTENSION(tizen_device, device::DeviceExtension);

