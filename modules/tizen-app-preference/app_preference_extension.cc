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

#include "app_preference_extension.h"

#include <dlog.h>
#include <app_preference.h>
#include <vector>
#include <memory>

#include "picojson.h"

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace appfw {

xwalk::XWalkExtensionInstance* AppPreferenceExtension::CreateInstance() {
  return new AppPreferenceInstance();
}

void AppPreferenceInstance::Initialize() {
  LOGD("Created tizen-app-preference instance");
}

void AppPreferenceInstance::HandleMessage(const char* msg) {
}

void AppPreferenceInstance::HandleSyncMessage(const char* msg) {
  // parse json object
  picojson::value value;
  std::string err;
  picojson::parse(value, msg, msg + strlen(msg), &err);
  if (!err.empty()) {
    LOGE("Ignoring message. Can't parse msessage : %s", err.c_str());
    return;
  }
  if (!value.is<picojson::object>()) {
    LOGE("Ignoring message. It is not an object.");
    return;
  }

  auto& request = value.get<picojson::object>();

  auto cmd = request["cmd"].to_str();

  if (cmd == "get") {
    auto& key = request["key"];
    GetHandler(key.to_str());
  } else if (cmd == "set") {
    auto& key = request["key"];
    auto& value = request["value"];
    SetHandler(key.to_str(), value.to_str());
  } else if (cmd == "remove") {
    auto& key = request["key"];
    RemoveHandler(key.to_str());
  } else if (cmd == "keys") {
    KeysHandler();
  } else if (cmd == "clear") {
    ClearHandler();
  } else if (cmd == "has") {
    auto& key = request["key"];
    HasHandler(key.to_str());
  }
}


void AppPreferenceInstance::GetHandler(const std::string& key) {
  picojson::value::object obj;
  char* value = nullptr;
  preference_get_string(key.c_str(), &value);
  if (value != nullptr) {
    std::unique_ptr<char, decltype(std::free)*> ptr {value, std::free};
    obj["data"] = picojson::value(value);
  }
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

void AppPreferenceInstance::SetHandler(const std::string& key,
                                       const std::string& value) {
  preference_set_string(key.c_str(), value.c_str());
  SendSyncReply("{}");
}

void AppPreferenceInstance::RemoveHandler(const std::string& key) {
  preference_remove(key.c_str());
  SendSyncReply("{}");
}

void AppPreferenceInstance::KeysHandler() {
  picojson::value::object obj;
  picojson::array array = picojson::array();
  preference_foreach_item([](const char* key, void* user_data){
    picojson::array* array =
        static_cast<picojson::array*>(user_data);
    array->push_back(picojson::value(key));
    return true;
  }, &array);
  obj["data"] = picojson::value(array);
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

void AppPreferenceInstance::ClearHandler() {
  preference_remove_all();
  SendSyncReply("{}");
}

void AppPreferenceInstance::HasHandler(const std::string& key) {
  bool existed = false;
  preference_is_existing(key.c_str(), &existed);
  picojson::value::object obj;
  obj["data"] = picojson::value(existed);
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

}  // namespace appfw

EXPORT_XWALK_EXTENSION(tizen_application, appfw::AppPreferenceExtension);
