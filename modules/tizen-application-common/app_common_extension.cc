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

#include "app_common_extension.h"

#include <dlog.h>
#include <app_control.h>
#include <app_control_internal.h>
#include <app_common.h>
#include <bundle.h>
#include <bundle_internal.h>

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace appfw {

xwalk::XWalkExtensionInstance* AppCommonExtension::CreateInstance() {
  return new AppCommonInstance();
}

void AppCommonInstance::Initialize() {
  LOGD("Created tizen-application-common instance");
}

void AppCommonInstance::HandleMessage(const char* /*msg*/) {
  // parse json object
}

void AppCommonInstance::HandleSyncMessage(const char* msg) {
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

  // handle synchronous messages
  std::string cmd = value.get("cmd").to_str();
  picojson::object result;
  if (cmd == "id") {
    char* id = nullptr;
    app_get_id(&id);
    if (id) {
      result["data"] = picojson::value(id);
      free(id);
    }
  } else if (cmd == "name") {
    char* name = nullptr;
    app_get_name(&name);
    if (name) {
      result["data"] = picojson::value(name);
      free(name);
    }
  } else if (cmd == "version") {
    char* version = nullptr;
    app_get_name(&version);
    if (version) {
      result["data"] = picojson::value(version);
      free(version);
    }
  } else if (cmd == "datapath") {
    char* datapath = app_get_data_path();
    if (datapath) {
      result["data"] = picojson::value(datapath);
      free(datapath);
    }
  } else if (cmd == "respath") {
    char* respath = app_get_resource_path();
    if (respath) {
      result["data"] = picojson::value(respath);
      free(respath);
    }
  } else if (cmd == "cachepath") {
    char* cachepath = app_get_cache_path();
    if (cachepath) {
      result["data"] = picojson::value(cachepath);
      free(cachepath);
    }
  } else if (cmd == "sharedrespath") {
    char* sharedrespath = app_get_shared_resource_path();
    if (sharedrespath) {
      result["data"] = picojson::value(sharedrespath);
      free(sharedrespath);
    }
  } else if (cmd == "appcontrol_response") {
    HandleAppcontrolResponse(value, &result);
  } else {
    LOGW("Ignoring message. It is not an object.");
    return;
  }
  SendSyncReply(picojson::value(result).serialize().c_str());
}

void AppCommonInstance::HandleAppcontrolResponse(const picojson::value& value,
                                                 picojson::object* result) {
  if (!value.get("appcontrol").is<std::string>() ||
      !value.get("data").is<picojson::object>()) {
    LOGE("Ignoring message. Wrong arguments were passed");
    return;
  }
  std::string appcontrol_json = value.get("appcontrol").to_str();

  app_control_h request = nullptr;

  app_control_create(&request);

  if (appcontrol_json.length() > 0) {
    bundle *b = nullptr;
    bundle_from_json(appcontrol_json.c_str(), &b);
    app_control_import_from_bundle(request, b);
    bundle_free(b);
  }

  auto extra_data = value.get("data").get<picojson::object>();
  app_control_h response;
  app_control_create(&response);
  for (auto& item : extra_data) {
    auto& key = item.first;
    auto& value = item.second;
    if (value.is<picojson::array>()) {
      auto& array_value = value.get<picojson::array>();
      std::vector<std::string> data_store;
      std::vector<const char*> pointer_store;
      for (auto& array_item : array_value) {
        data_store.push_back(array_item.to_str());
        pointer_store.push_back(data_store.back().c_str());
      }
      app_control_add_extra_data_array(response,
          key.c_str(),
          pointer_store.data(),
          pointer_store.size());
    } else {
      app_control_add_extra_data(response,
          key.c_str(),
          value.to_str().c_str());
    }
  }

  int ret = app_control_reply_to_launch_request(response,
                                                request,
                                                APP_CONTROL_RESULT_SUCCEEDED);
  app_control_destroy(request);
  app_control_destroy(response);
  if (ret == 0) {
    result->insert(std::make_pair("result", picojson::value("OK")));
  } else {
    result->insert(std::make_pair("result", picojson::value("Fail")));
    result->insert(
        std::make_pair("reason", picojson::value("Invalid Appcontrol")));
  }
}

}  // namespace appfw

EXPORT_XWALK_EXTENSION(tizen_application_common, appfw::AppCommonExtension);
