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

#ifndef PRIVILEGES_PRIVILEGES_NATIVE_H_
#define PRIVILEGES_PRIVILEGES_NATIVE_H_

#include <node.h>
#include <node_object_wrap.h>
#include <v8.h>

namespace privileges {

class NativeBinding {
 public:
  static void Init(v8::Handle<v8::Object> target);

  static void GetPkgApiVersion(
      const v8::FunctionCallbackInfo<v8::Value>& args);
  static void CheckPrivilegeAccess(
      const v8::FunctionCallbackInfo<v8::Value>& args);
};

}  // namespace privileges

#endif  // PRIVILEGES_PRIVILEGES_NATIVE_H_
