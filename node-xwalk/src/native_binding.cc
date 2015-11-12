// Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "native_binding.h"

#include <map>
#include <string>

#include "extension.h"
#include "extension_adapter.h"
#include "log.h"

namespace xwalk {
namespace extensions {

namespace {

// Cached function callbackes for each instance id
static std::map<int, v8::Persistent<v8::Function>> g_listeners;

// Cached runtime variables
static std::map<std::string, std::string> g_runtime_variables;

}  // namespace

// static
void NativeBinding::Init(v8::Handle<v8::Object> target) {
  NODE_SET_METHOD(target, "getExtensionInfo", GetExtensionInfo);
  NODE_SET_METHOD(target, "createInstance", CreateInstance);
  NODE_SET_METHOD(target, "destroyInstance", DestroyInstance);
  NODE_SET_METHOD(target, "postMessage", PostMessage);
  NODE_SET_METHOD(target, "sendSyncMessage", SendSyncMessage);
  NODE_SET_METHOD(target, "setMessageListener", SetMessageListener);
  NODE_SET_METHOD(target, "setRuntimeVariable", SetRuntimeVariable);
}

// static
void NativeBinding::GetExtensionInfo(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  if (args.Length() < 1 || !args[0]->IsString()) {
    result.Set(v8::Undefined(isolate));
    return;
  }

  v8::String::Utf8Value ext_path(args[0]->ToString());

  Extension* ext = new Extension(std::string(*ext_path));
  if (ext && ext->Initialize()) {
    auto rv_cb = [](const std::string& key) -> std::string {
      auto it = g_runtime_variables.find(key);
      if (it == g_runtime_variables.end()) {
        return std::string("");
      } else {
        return it->second;
      }
    };
    ext->set_runtime_variable_callback(rv_cb);
    v8::Local<v8::Object> obj = v8::Object::New(isolate);
    obj->Set(v8::String::NewFromUtf8(isolate, "extension_id"),
             v8::Integer::New(isolate, ext->xw_extension()));
    obj->Set(v8::String::NewFromUtf8(isolate, "name"),
             v8::String::NewFromUtf8(isolate, ext->name().c_str()));
    obj->Set(v8::String::NewFromUtf8(isolate, "jsapi"),
             v8::String::NewFromUtf8(isolate, ext->javascript_api().c_str()));
    result.Set(obj);
  } else {
    LOGE("Failed to create extension, path=%s", *ext_path);
    result.Set(v8::Undefined(isolate));
    return;
  }
}

// static
void NativeBinding::CreateInstance(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  if (args.Length() < 1 || !args[0]->IsNumber()) {
    result.Set(v8::Undefined(isolate));
    return;
  }

  int ext_id = args[0]->Int32Value();
  Extension* ext = ExtensionAdapter::GetInstance()->GetExtension(ext_id);
  if (!ext) {
    LOGE("Can't find extension. extension_id=%d", ext_id);
    result.Set(v8::Undefined(isolate));
    return;
  }

  ExtensionInstance* instance = ext->CreateInstance();
  if (!instance) {
    LOGE("Failed to create instance. extension_id=%d", ext_id);
    result.Set(v8::Undefined(isolate));
    return;
  }

  using std::placeholders::_1;
  using std::placeholders::_2;
  using std::placeholders::_3;
  instance->set_post_message_listener(
      std::bind(NativeBinding::PostMessageToJSCallback,
                _1, _2, _3, instance->xw_instance()));

  result.Set(v8::Integer::New(isolate, instance->xw_instance()));
}

// static
void NativeBinding::DestroyInstance(
    const v8::FunctionCallbackInfo<v8::Value>& /*args*/) {
  // Nothing to do.
  // Destroy Instance callbacks will be called when each extension is freed.
}

// static
void NativeBinding::PostMessage(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  if (args.Length() < 2 || !args[0]->IsNumber()) {
    result.Set(v8::Undefined(isolate));
    return;
  }

  int instance_id = args[0]->Int32Value();
  ExtensionAdapter* adapter = ExtensionAdapter::GetInstance();
  ExtensionInstance* instance = adapter->GetExtensionInstance(instance_id);
  if (!instance) {
    LOGE("Can't find instance. instance_id=%d", instance_id);
    result.Set(v8::Undefined(isolate));
    return;
  }

  if (args[1]->IsString()) {
    v8::String::Utf8Value msg(args[1]->ToString());
    instance->HandleMessage(std::string(*msg));
  } else if (args[1]->IsArrayBuffer()) {
    v8::Handle<v8::ArrayBuffer> buffer =
        v8::Handle<v8::ArrayBuffer>::Cast(args[1]);
    v8::ArrayBuffer::Contents contents = buffer->Externalize();
    void* ptr = contents.Data();
    instance->HandleMessage(static_cast<char*>(ptr),
                            contents.ByteLength());
    std::free(ptr);
  }
}

// static
void NativeBinding::SendSyncMessage(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  if (args.Length() < 2 || !args[0]->IsNumber()) {
    result.Set(v8::Undefined(isolate));
    return;
  }

  int instance_id = args[0]->Int32Value();
  ExtensionAdapter* adapter = ExtensionAdapter::GetInstance();
  ExtensionInstance* instance = adapter->GetExtensionInstance(instance_id);
  if (!instance) {
    LOGE("Can't find instance. instance_id=%d", instance_id);
    result.Set(v8::Undefined(isolate));
    return;
  }

  auto sync_cb = [](const char* reply, const size_t /*size*/,
                    const bool /*binary*/,
                    const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();
    v8::ReturnValue<v8::Value> result(args.GetReturnValue());
    result.Set(v8::String::NewFromUtf8(isolate, reply));
  };
  using std::placeholders::_1;
  using std::placeholders::_2;
  using std::placeholders::_3;
  instance->set_send_sync_message_listener(
      std::bind(sync_cb, _1, _2, _3, args));
  v8::String::Utf8Value msg(args[1]->ToString());
  instance->HandleSyncMessage(std::string(*msg));
}

// static
void NativeBinding::SetMessageListener(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  if (args.Length() < 2 || !args[0]->IsNumber()) {
    result.Set(v8::Undefined(isolate));
    return;
  }

  int instance_id = args[0]->Int32Value();
  g_listeners[instance_id].Reset(
      isolate, v8::Handle<v8::Function>::Cast(args[1]));
}

// static
void NativeBinding::SetRuntimeVariable(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsString()) {
    result.Set(v8::Undefined(isolate));
    return;
  }

  v8::String::Utf8Value key(args[0]->ToString());
  v8::String::Utf8Value value(args[1]->ToString());

  g_runtime_variables[std::string(*key)] = std::string(*value);

  result.Set(v8::Boolean::New(isolate, true));
}

// static
// TODO(WonyoungChoi): Make this function thread-safety.
void NativeBinding::PostMessageToJSCallback(
    const char* msg, const size_t size, const bool binary, int instance_id) {
  auto listener = g_listeners.find(instance_id);
  if (listener == g_listeners.end()) {
    LOGW("Can't find callback. instance_id=%d", instance_id);
    return;
  }

  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::HandleScope scope(isolate);
  v8::Local<v8::Value> args[1];

  if (binary) {
    args[0] = v8::ArrayBuffer::New(isolate, (void*)(msg), size);
  } else {
    args[0] = v8::String::NewFromUtf8(isolate, msg);
  }

  v8::Local<v8::Function> func =
      v8::Local<v8::Function>::New(isolate, listener->second);
  func->Call(v8::Null(isolate), 1, args);
}

}  // namespace extensions
}  // namespace xwalk

extern "C" {
  static void NodeInit(v8::Handle<v8::Object> target) {
    xwalk::extensions::NativeBinding::Init(target);
  }
  NODE_MODULE(native, NodeInit);
}
