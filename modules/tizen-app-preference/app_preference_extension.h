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

#ifndef APP_PREFERENCE_EXTENSION_H_
#define APP_PREFERENCE_EXTENSION_H_

#include <xwalk/xwalk_extension.h>
#include <string>

namespace appfw {

class AppPreferenceExtension : public xwalk::XWalkExtension {
 public:
  // @override
  xwalk::XWalkExtensionInstance* CreateInstance();
};

class AppPreferenceInstance : public xwalk::XWalkExtensionInstance {
 public:
  // @override
  void Initialize();

  // @override
  void HandleMessage(const char* msg);

  // @override
  void HandleSyncMessage(const char* msg);
 private:
  void GetHandler(const std::string& key);
  void SetHandler(const std::string& key, const std::string& value);
  void RemoveHandler(const std::string& key);
  void HasHandler(const std::string& key);
  void KeysHandler();
  void ClearHandler();
};

}  // namespace appfw

#endif  // APP_PREFERENCE_EXTENSION_H_

