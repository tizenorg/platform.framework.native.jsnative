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

#ifndef EXAMPLES_TIZEN_POWER_POWER_PLATFORM_PROXY_H_
#define EXAMPLES_TIZEN_POWER_POWER_PLATFORM_PROXY_H_

#include "dbus_operation.h"

namespace tizen {
namespace power {

class PowerPlatformProxy {
 public:
  int LockState(int* result);
  int UnlockState(int* result);
  int SetBrightnessFromSettings(int* result);
  int SetBrightness(int val, int* result);

  int GetBrightness(int* result);
  int IsCustomBrightness(int* result);

  static PowerPlatformProxy& GetInstance();

 private:
  PowerPlatformProxy();
  virtual ~PowerPlatformProxy();

  DBusOperation dbus_op_;
};

}  // namespace power
}  // namespace tizen

#endif // EXAMPLES_TIZEN_POWER_POWER_PLATFORM_PROXY_H_
