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

#include "power_extension.h"

#include <map>
#include <string>
#include <iostream>

// NOTE:
// This example uses picojson to parse JSON object, but this is NOT mandatory.
// The common module for xwalk extensions doesn't provide JSON parser anymore.
#include "picojson.h"

namespace sample {

namespace {
const std::map<std::string, PowerResource> kPowerResourceMap = {
    {"SCREEN", POWER_RESOURCE_SCREEN},
    {"CPU", POWER_RESOURCE_CPU}
};

const std::map<std::string, PowerState> kPowerStateMap = {
    {"SCREEN_OFF", POWER_STATE_SCREEN_OFF},
    {"SCREEN_DIM", POWER_STATE_SCREEN_DIM},
    {"SCREEN_NORMAL", POWER_STATE_SCREEN_NORMAL},
    {"SCREEN_BRIGHT", POWER_STATE_SCREEN_BRIGHT},
    {"CPU_AWAKE", POWER_STATE_CPU_AWAKE}
};

}  // namespace

xwalk::XWalkExtensionInstance* PowerExtension::CreateInstance() {
  return new PowerInstance;
}

void PowerInstance::Initialize() {
  using std::placeholders::_1;
  using std::placeholders::_2;
  PowerManager::GetInstance()->AddListener(
      std::bind(&PowerInstance::OnScreenStateChanged, this, _1, _2));
}

void PowerInstance::HandleMessage(const char* msg) {
  // parse json object
  picojson::value value;
  std::string err;
  picojson::parse(value, msg, msg + strlen(msg), &err);
  if (!err.empty()) {
    std::cerr << "Ignoring message, error: " << err << std::endl;
    return;
  }
  if (!value.is<picojson::object>()) {
    std::cerr << "Ignoring message. It is not an object." << std::endl;
    return;
  }
  // handle messages
  std::string cmd = value.get("cmd").to_str();
  if (cmd == "request") {
    const std::string& resource = value.get("resource").get<std::string>();
    const std::string& state = value.get("state").get<std::string>();
    PowerManager::GetInstance()->Request(kPowerResourceMap.at(resource),
                                         kPowerStateMap.at(state));
  } else if (cmd == "release") {
    const std::string& resource = value.get("resource").get<std::string>();
    PowerManager::GetInstance()->Release(kPowerResourceMap.at(resource));
  } else if (cmd == "setScreenBrightness") {
    double brightness = value.get("brightness").get<double>();
    PowerManager::GetInstance()->SetScreenBrightness(brightness);
  } else if (cmd == "restoreScreenBrightness") {
    PowerManager::GetInstance()->RestoreScreenBrightness();
  } else if (cmd == "turnScreenOn") {
    PowerManager::GetInstance()->SetScreenState(true);
  } else if (cmd == "turnScreenOff") {
    PowerManager::GetInstance()->SetScreenState(false);
  } else {
    std::cerr << "Ignoring message, invalid cmd : " << cmd << std::endl;
    return;
  }
}

void PowerInstance::HandleSyncMessage(const char* msg) {
  // parse json object
  picojson::value value;
  std::string err;
  picojson::parse(value, msg, msg + strlen(msg), &err);
  if (!err.empty()) {
    std::cerr << "Ignoring message, error: " << err << std::endl;
    return;
  }
  if (!value.is<picojson::object>()) {
    std::cerr << "Ignoring message. It is not an object." << std::endl;
    return;
  }
  // handle synchronous messages
  std::string cmd = value.get("cmd").to_str();
  if (cmd == "getScreenBrightness") {
    double brightness;
    int err =
        PowerManager::GetInstance()->GetScreenBrightness(&brightness);
    if (err) {
      SendSyncReply("ERR");
    } else {
      SendSyncReply(std::to_string(brightness).c_str());
    }
  } else if (cmd == "isScreenOn") {
    bool state = false;
    int err = PowerManager::GetInstance()->IsScreenOn(&state);
    if (err) {
      SendSyncReply("ERR");
    } else {
      SendSyncReply(state ? "true" : "false");
    }
  } else {
    std::cerr << "Ignoring message. It is not an object." << std::endl;
    return;
  }
}

void PowerInstance::OnScreenStateChanged(PowerState prev, PowerState current) {
  picojson::value::object obj;
  obj["cmd"] = picojson::value("ScreenStateChanged");

  for (auto it = kPowerStateMap.begin(); it != kPowerStateMap.end(); ++it) {
    if (it->second == prev) {
      obj["prev_state"] = picojson::value(it->first);
    }
    if (it->second == current) {
      obj["new_state"] = picojson::value(it->first);
    }
  }

  picojson::value result = picojson::value(obj);
  PostMessage(result.serialize().c_str());
}

}  // namespace sample

EXPORT_XWALK_EXTENSION(power, sample::PowerExtension);
