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

#include "app_manager_extension.h"

#include <dlog.h>
#include <app_manager.h>
#include <json/json.h>
#include <glib.h>

#include <thread>

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace appfw {

namespace {

static bool StartsWith(const std::string& str, const std::string& sub) {
  if (sub.size() > str.size()) return false;
  return std::equal(sub.begin(), sub.end(), str.begin());
}

}  // namespace

xwalk::XWalkExtensionInstance* AppManagerExtension::CreateInstance() {
  return new AppManagerInstance();
}

AppManagerInstance::AppManagerInstance():handle_key_(1) {
}

AppManagerInstance::~AppManagerInstance() {
  app_manager_unset_app_context_event_cb();
  {
    std::lock_guard<std::mutex> guard(handle_lock_);
    handle_map_.clear();
  }
}

void AppManagerInstance::Initialize() {
  LOGD("Created tizen-app-manager instance");
  app_manager_set_app_context_event_cb(
    [](app_context_h app_context, app_context_event_e event, void *user_data) {
      AppManagerInstance* self = static_cast<AppManagerInstance*>(user_data);
      Json::Value result;
      if (event == APP_CONTEXT_EVENT_LAUNCHED) {
        result["event"] = "launch";
      } else {
        result["event"] = "terminate";
      }
      int pid;
      app_context_get_pid(app_context, &pid);
      result["data"]["pid"] = pid;
      char* id = nullptr;
      app_context_get_app_id(app_context, &id);
      if (id) {
        result["data"]["id"] = id;
        free(id);
      }
      Json::FastWriter writer;
      self->PostMessage(writer.write(result).c_str());
    }, this);
}

void AppManagerInstance::HandleMessage(const char* msg) {
  // parse json object
  Json::Value args;
  Json::Reader reader;
  if (!reader.parse(msg, msg + strlen(msg), args)) {
    LOGE("Ignoring message. Can't parse msessage : %s",
         reader.getFormattedErrorMessages().c_str());
    return;
  }

  Json::Value result;
  result["result"] = "FAIL";
  std::string cmd = args.get("cmd", "").asString();
  std::string asyncid = args.get("asyncid", "").asString();
  if (asyncid.empty()) {
    LOGE("Ignoring message. asyncid is empty");
    return;
  }
  if (cmd == "manager.instapp") {
    HandleManagerInstalledApps(args["filter"], asyncid);
  } else if (cmd == "manager.runningapps") {
    HandleManagerRunningApps(asyncid);
  }
}

void AppManagerInstance::HandleSyncMessage(const char* msg) {
  // parse json object
  Json::Value args;
  Json::Reader reader;
  if (!reader.parse(msg, msg + strlen(msg), args)) {
    LOGE("Ignoring message. Can't parse msessage : %s",
         reader.getFormattedErrorMessages().c_str());
    return;
  }

  Json::Value result;
  result["result"] = "FAIL";
  std::string cmd = args.get("cmd", "").asString();


  if (cmd == "instapp.delete") {
    int key = args.get("handle", 0).asInt();
    if (handle_map_.erase(key) > 0)
      result["result"] = "OK";
  } else if (StartsWith(cmd, "instapp.")) {
    int key = args.get("handle", 0).asInt();
    auto found = handle_map_.find(key);
    if (found != handle_map_.end()) {
      found->second->HandleMessage(args, &result);
    } else {
      LOGE("Invalid handle was used");
    }
  } else if (cmd == "manager.instapp") {
    std::string appid = args.get("appid", "").asString();
    HandleManagerInstalledApp(appid, &result);
  } else if (cmd == "manager.runningapp") {
    int pid = args.get("pid", -1).asInt();
    std::string appid = args.get("appid", "").asString();
    HandleManagerRunningApp(pid, appid, &result);
  }

  Json::FastWriter writer;
  SendSyncReply(writer.write(result).c_str());
}


void AppManagerInstance::HandleManagerInstalledApp(const std::string& appid,
                                                   Json::Value* data) {
  app_info_h handle = nullptr;
  Json::Value& result = *data;
  if (app_manager_get_app_info(appid.c_str(), &handle) == 0) {
    std::shared_ptr<AppInfo> appinfo(new AppInfo(handle));
    {
      std::lock_guard<std::mutex> guard(handle_lock_);
      auto key = handle_key_++;
      handle_map_[key] = appinfo;
      result["result"] = "OK";
      result["data"] = key;
    }
  }
}

void AppManagerInstance::HandleManagerRunningApp(int pid,
                                                 const std::string& appid,
                                                 Json::Value* data) {
  Json::Value& result = *data;
  std::string id = appid;
  if (pid != -1) {
    char* ptr = nullptr;
    app_manager_get_app_id(pid, &ptr);
    if (ptr != nullptr) {
      id = ptr;
      free(ptr);
    }
  }

  app_context_h context = nullptr;
  app_manager_get_app_context(id.c_str(), &context);
  if (context != nullptr) {
    int pid = 0;
    app_context_get_pid(context, &pid);
    result["result"] = "OK";
    result["data"]["id"] = id;
    result["data"]["pid"] = pid;
    app_context_destroy(context);
  }
}

struct CallbackData {
  AppManagerInstance* self;
  Json::Value result;
  std::string json;
};

void AppManagerInstance::HandleManagerInstalledApps(
    const Json::Value& filter, const std::string& asyncid) {
  std::thread task([filter, asyncid, this]() {
    CallbackData* data = new CallbackData();
    data->self = this;
    data->result["asyncid"] = asyncid;
    app_info_filter_h filter_h = nullptr;
    if (filter != Json::Value::nullRef) {
      app_info_filter_create(&filter_h);
      auto keys = filter.getMemberNames();
      for (auto& key : keys) {
        if (filter[key].isBool()) {
          app_info_filter_add_bool(filter_h, key.c_str(), filter[key].asBool());
        } else {
          app_info_filter_add_string(filter_h,
                                     key.c_str(),
                                     filter[key].asString().c_str());
        }
      }
    }

    auto callback = [](app_info_h app, void* user_data) {
      CallbackData* data = static_cast<CallbackData*>(user_data);
      app_info_h tostore;
      app_info_clone(&tostore, app);
      std::shared_ptr<AppInfo> appinfo(new AppInfo(tostore));
      {
        std::lock_guard<std::mutex> guard(data->self->handle_lock_);
        auto key = data->self->handle_key_++;
        data->self->handle_map_[key] = appinfo;
        data->result["data"].append(key);
      }
      return true;
    };

    if (filter_h != nullptr) {
      app_info_filter_foreach_appinfo(filter_h, callback, data);
    } else {
      app_manager_foreach_app_info(callback, data);
    }

    Json::FastWriter writer;
    data->json = writer.write(data->result);
    g_idle_add([](void* user_data) {
      CallbackData* data = static_cast<CallbackData*>(user_data);
      data->self->PostMessage(data->json.c_str());
      delete data;
      return 0;
    }, data);
  });
  task.detach();
}

void AppManagerInstance::HandleManagerRunningApps(const std::string& asyncid) {
  std::thread task([asyncid, this]() {
    CallbackData* data = new CallbackData();
    data->self = this;
    data->result["asyncid"] = asyncid;
    app_manager_foreach_app_context([](app_context_h app_context,
                                       void *user_data) {
      CallbackData* data = static_cast<CallbackData*>(user_data);
      Json::Value app;
      {
        int pid;
        char* id = nullptr;
        app_context_get_pid(app_context, &pid);
        app_context_get_app_id(app_context, &id);
        app["pid"] = pid;
        app["id"] = id ? id : "";
        free(id);
      }
      data->result["data"].append(app);
      return true;
    }, data);

    Json::FastWriter writer;
    data->json = writer.write(data->result);
    g_idle_add([](void* user_data) {
      CallbackData* data = static_cast<CallbackData*>(user_data);
      data->self->PostMessage(data->json.c_str());
      delete data;
      return 0;
    }, data);
  });
  task.detach();
}

AppInfo::AppInfo(app_info_h handle):handle_(handle) {
}

AppInfo::~AppInfo() {
  app_info_destroy(handle_);
  handle_ = nullptr;
}

std::string AppInfo::GetStringAttribute(int(*capi)(app_info_h, char**)) {
  char* ptr = nullptr;
  if (capi)
    capi(handle_, &ptr);
  if (ptr) {
    std::string id = ptr;
    free(ptr);
    return id;
  }
  return std::string();
}

bool AppInfo::GetBooleanAttribute(int(*capi)(app_info_h, bool*)) {
  bool result = false;
  capi(handle_, &result);
  return result;
}

std::string AppInfo::id() {
  return GetStringAttribute(app_info_get_app_id);
}

std::string AppInfo::exe() {
  return GetStringAttribute(app_info_get_exec);
}

std::string AppInfo::label() {
  return GetStringAttribute(app_info_get_label);
}

std::string AppInfo::icon() {
  return GetStringAttribute(app_info_get_icon);
}

std::string AppInfo::package() {
  return GetStringAttribute(app_info_get_package);
}

std::string AppInfo::type() {
  return GetStringAttribute(app_info_get_type);
}

bool AppInfo::nodisplay() {
  return GetBooleanAttribute(app_info_is_nodisplay);
}

bool AppInfo::disabled() {
  return !GetBooleanAttribute(app_info_is_enabled);
}

bool AppInfo::onboot() {
  return GetBooleanAttribute(app_info_is_onboot);
}

bool AppInfo::preloaded() {
  return GetBooleanAttribute(app_info_is_preload);
}

std::string AppInfo::GetLocalizedLabel(const std::string& locale) {
  char* label = nullptr;
  app_info_get_localed_label(id().c_str(), locale.c_str(), &label);
  if (label) {
    std::string result = label;
    free(label);
    return result;
  }
  return std::string();
}

void AppInfo::HandleMetadata(Json::Value* data) {
  app_info_foreach_metadata(handle_,
      [](const char* key, const char* value, void* user_data) {
    Json::Value& result = *(static_cast<Json::Value*>(user_data));
    result[key] = value;
    return true;
  }, data);
}

void AppInfo::HandleMessage(const Json::Value& args, Json::Value* data) {
  Json::Value& result = *data;
  std::string cmd = args.get("cmd", "").asString();
  result["result"] = "OK";
  if (cmd == "instapp.id") {
    result["data"] = id();
  } else if (cmd == "instapp.exe") {
    result["data"] = exe();
  } else if (cmd == "instapp.label") {
    result["data"] = label();
  } else if (cmd == "instapp.iconpath") {
    result["data"] = icon();
  } else if (cmd == "instapp.package") {
    result["data"] = package();
  } else if (cmd == "instapp.type") {
    result["data"] = type();
  } else if (cmd == "instapp.nodisplay") {
    result["data"] = nodisplay();
  } else if (cmd == "instapp.disabled") {
    result["data"] = disabled();
  } else if (cmd == "instapp.onboot") {
    result["data"] = onboot();
  } else if (cmd == "instapp.preloaded") {
    result["data"] = preloaded();
  } else if (cmd == "instapp.localizelabel") {
    std::string locale = args.get("locale", "").asString();
    result["data"] = GetLocalizedLabel(locale);
  } else if (cmd == "instapp.metadata") {
    AppInfo::HandleMetadata(&(result["data"]));
  } else {
    result["result"] = "FAIL";
  }
}

}  // namespace appfw

EXPORT_XWALK_EXTENSION(tizen_app_manager, appfw::AppManagerExtension);
