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

#ifndef JS_DEVICE_EXTENSION_H_
#define JS_DEVICE_EXTENSION_H_

#include <xwalk/xwalk_extension.h>

namespace device {

class DeviceExtension : public xwalk::XWalkExtension {
 public:
  // @override
  xwalk::XWalkExtensionInstance* CreateInstance();
};

class DeviceInstance : public xwalk::XWalkExtensionInstance {
 public:
  // @override
  void Initialize();
 private:
  void InitializeCallbacks();

  void HandleBatteryIsCharging(const Json::Value& args, Json::Value& reply);
  void HandleBatteryGetCapacity(const Json::Value& args, Json::Value& reply);
  void HandleBatteryGetLevel(const Json::Value& args, Json::Value& reply);

  void HandleDisplayGetCount(const Json::Value& args, Json::Value& reply);
  void HandleDisplayGetMaxBrightness(
      const Json::Value& args, Json::Value& reply);
  void HandleDisplayGetState(const Json::Value& args, Json::Value& reply);
  void HandleDisplaySetState(const Json::Value& args, Json::Value& reply);
  void HandleDisplayGetBrightness(const Json::Value& args, Json::Value& reply);
  void HandleDisplaySetBrightness(const Json::Value& args, Json::Value& reply);

};

}  // namespace device

#endif  // JS_DEVICE_EXTENSION_H_

