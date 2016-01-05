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

#include "ui_app_extension.h"

#include <dlog.h>

#include "picojson.h"
#include "appfw.h"

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace appfw {

xwalk::XWalkExtensionInstance* UiAppExtension::CreateInstance() {
  return new UiAppInstance();
}

UiAppInstance::UiAppInstance() {
}

UiAppInstance::~UiAppInstance() {
  AppFW::GetInstance()->Deinit();
}

void UiAppInstance::Initialize() {
  LOGD("Created tizen-application instance");
  AppFW::GetInstance()->set_terminate_handler([this]() {
    FireSimpleEvent("terminate");
  });
  AppFW::GetInstance()->set_pause_handler([this]() {
    FireSimpleEvent("pause");
  });
  AppFW::GetInstance()->set_resume_handler([this]() {
    FireSimpleEvent("resume");
  });
  AppFW::GetInstance()->set_service_handler([this](const std::string& json) {
    FireSimpleEvent("appcontrol", json);
  });
}

void UiAppInstance::HandleMessage(const char* msg) {
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
  auto found = request.find("asyncid");
  if (found == request.end()) {
    LOGE("asyncid was not existed");
    return;
  }

  auto cmd = request["cmd"].to_str();

  if (cmd == "start") {
    auto& argv = request["argv"];
    std::vector<char*> argv_pointer;
    if (argv.is<picojson::array>()) {
      auto& argv_array = argv.get<picojson::array>();
      for (auto& item : argv_array) {
        argv_pointer.push_back(strdup(item.to_str().c_str()));
      }
    }
    HandleStart(request["asyncid"].to_str(),
                argv_pointer.size(), argv_pointer.data());
    for (auto& item : argv_pointer) {
      free(item);
    }
  }
  // parse json object
}

void UiAppInstance::HandleSyncMessage(const char* msg) {
  // parse json object
}

void UiAppInstance::FireSimpleEvent(const std::string& event,
                                    const std::string& data) {
  picojson::value::object obj;
  obj["event"] = picojson::value(event);
  if (data.length() > 0) {
    obj["data"] = picojson::value(data);
  }
  PostMessage(picojson::value(obj).serialize().c_str());
}

void UiAppInstance::HandleStart(const std::string& async_id,
                                int argc, char** argv) {
  AppFW::GetInstance()->set_create_handler([async_id, this]() {
    picojson::value::object obj;
    obj["asyncid"] = picojson::value(async_id);
    PostMessage(picojson::value(obj).serialize().c_str());
    AppFW::GetInstance()->set_create_handler(nullptr);
  });
  AppFW::GetInstance()->Init(argc, argv);
}

}  // namespace appfw

EXPORT_XWALK_EXTENSION(tizen_application, appfw::UiAppExtension);
