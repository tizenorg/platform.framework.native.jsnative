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

#include "power_platform_proxy.h"

namespace tizen {
namespace power {

PowerPlatformProxy::PowerPlatformProxy() :
    dbus_op_("org.tizen.system.deviced",
             "/Org/Tizen/System/DeviceD/Display",
             "org.tizen.system.deviced.display")
{
}

PowerPlatformProxy::~PowerPlatformProxy()
{
}

PowerPlatformProxy& PowerPlatformProxy::GetInstance()
{
  static PowerPlatformProxy instance;
  return instance;
}

int PowerPlatformProxy::LockState(int* result)
{
  DBusOperationArguments args;
  args.AddArgumentString("lcddim");
  args.AddArgumentString("staycurstate");
  args.AddArgumentString("NULL");
  args.AddArgumentInt32(0);

  return dbus_op_.InvokeSyncGetInt("lockstate", &args, result);
}

int PowerPlatformProxy::UnlockState(int* result)
{
  DBusOperationArguments args;
  args.AddArgumentString("lcddim");
  args.AddArgumentString("keeptimer");

  return dbus_op_.InvokeSyncGetInt("unlockstate", &args, result);
}

int PowerPlatformProxy::SetBrightnessFromSettings(int* result)
{
  return dbus_op_.InvokeSyncGetInt("ReleaseBrightness", nullptr, result);
}

int PowerPlatformProxy::SetBrightness(int val, int* result)
{
  DBusOperationArguments args;
  args.AddArgumentInt32(val);

  return dbus_op_.InvokeSyncGetInt("HoldBrightness", &args, result);
}

int PowerPlatformProxy::GetBrightness(int* result) {
  return dbus_op_.InvokeSyncGetInt("CurrentBrightness", nullptr, result);
}

int PowerPlatformProxy::IsCustomBrightness(int* result) {
  return dbus_op_.InvokeSyncGetInt("CustomBrightness", nullptr, result);
}

}  // namespace power
}  // namespace tizen
