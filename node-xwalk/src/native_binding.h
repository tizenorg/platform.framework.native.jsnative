// Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef NODE_XWALK_EXTENSIONS_NATIVE_BINDING_H_
#define NODE_XWALK_EXTENSIONS_NATIVE_BINDING_H_

#include <node.h>
#include <node_object_wrap.h>
#include <v8.h>

namespace xwalk {
namespace extensions {

class NativeBinding {
 public:
  static void Init(v8::Handle<v8::Object> target);

  static void GetExtensionInfo(
      const v8::FunctionCallbackInfo<v8::Value>& args);
  static void CreateInstance(
      const v8::FunctionCallbackInfo<v8::Value>& args);
  static void DestroyInstance(
      const v8::FunctionCallbackInfo<v8::Value>& args);
  static void PostMessage(
      const v8::FunctionCallbackInfo<v8::Value>& args);
  static void SendSyncMessage(
      const v8::FunctionCallbackInfo<v8::Value>& args);
  static void SetMessageListener(
      const v8::FunctionCallbackInfo<v8::Value>& args);
  static void SetRuntimeVariable(
      const v8::FunctionCallbackInfo<v8::Value>& args);

  static void PostMessageToJSCallback(
      const char* msg, const size_t size, const bool binary,
      int instance_id);
};

}  // namespace extensions
}  // namespace xwalk

#endif  // NODE_XWALK_EXTENSIONS_NATIVE_BINDING_H_
