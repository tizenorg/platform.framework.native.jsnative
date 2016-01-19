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

#ifndef APP_MANAGER_EXTENSION_H_
#define APP_MANAGER_EXTENSION_H_

#include <app_info.h>
#include <json/json.h>
#include <xwalk/xwalk_extension.h>

#include <string>
#include <map>
#include <memory> // NOLINT
#include <mutex>


namespace appfw {

class AppInfo {
 public:
  explicit AppInfo(app_info_h handle);
  ~AppInfo();

  std::string id();
  std::string exe();
  std::string label();
  std::string icon();
  std::string package();
  std::string type();
  bool nodisplay();
  bool disabled();
  bool onboot();
  bool preloaded();
  std::string GetLocalizedLabel(const std::string& locale);

  void HandleMessage(const Json::Value& args, Json::Value* data);
 private:
  std::string GetStringAttribute(int(*capi)(app_info_h, char**));
  bool GetBooleanAttribute(int(*capi)(app_info_h, bool*));
  void HandleMetadata(Json::Value* data);
  app_info_h handle_;
};

class AppManagerExtension : public xwalk::XWalkExtension {
 public:
  // @override
  xwalk::XWalkExtensionInstance* CreateInstance();
};

class AppManagerInstance : public xwalk::XWalkExtensionInstance {
 public:
  AppManagerInstance();
  ~AppManagerInstance();
  // @override
  void Initialize();

  // @override
  void HandleMessage(const char* msg);

  // @override
  void HandleSyncMessage(const char* msg);
 private:
  std::shared_ptr<AppInfo> GetHandle(int key);
  void HandleManagerInstalledApp(const std::string& appid, Json::Value* data);
  void HandleManagerRunningApp(int pid,
                               const std::string& appid,
                               Json::Value* data);
  void HandleManagerInstalledApps(
      const Json::Value& filter, const std::string& asyncid);
  void HandleManagerRunningApps(const std::string& asyncid);
  int handle_key_;
  std::map<int, std::shared_ptr<AppInfo> > handle_map_;
  std::mutex handle_lock_;
};

}  // namespace appfw

#endif  // APP_MANAGER_EXTENSION_H_

