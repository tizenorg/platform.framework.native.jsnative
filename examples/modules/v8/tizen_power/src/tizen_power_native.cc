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

#include "tizen_power_native.h"

#include <node.h>

#include <string>
#include <map>

#include "power_manager.h"

namespace tizen {
namespace power {

namespace {
const std::map<std::string, PowerResource> kPowerResourceMap = {
    {"SCREEN", POWER_RESOURCE_SCREEN},
    {"CPU", POWER_RESOURCE_CPU}
};

const std::map<std::string, PowerState> kPowerStateMap = {
    {"SCREEN_OFF", POWER_STATE_SCREEN_OFF},
    {"SCREEN_DIM", POWER_STATE_SCREEN_DIM},
    {"SCREEN_NORMAL", POWER_STATE_SCREEN_NORMAL},
    {"SCREEN_BRIGHT", POWER_STATE_SCREEN_BRIGHT},
    {"CPU_AWAKE", POWER_STATE_CPU_AWAKE}
};

v8::Persistent<v8::Function> g_listener;

void OnScreenStateChanged(PowerState prev, PowerState current) {
  if (g_listener.IsEmpty()) {
    return;
  }

  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::HandleScope scope(isolate);
  v8::Local<v8::Value> args[2];

  for (auto it = kPowerStateMap.begin(); it != kPowerStateMap.end(); ++it) {
    if (it->second == prev) {
      args[0] = v8::String::NewFromUtf8(isolate, it->first.c_str());
    }
    if (it->second == current) {
      args[1] = v8::String::NewFromUtf8(isolate, it->first.c_str());
    }
  }

  v8::Local<v8::Function> func =
      v8::Local<v8::Function>::New(isolate, g_listener);
  func->Call(v8::Null(isolate), 2, args);
}

}  // namespace

// static
void NativeBinding::Init(v8::Handle<v8::Object> target) {
  NODE_SET_METHOD(target, "request", Request);
  NODE_SET_METHOD(target, "release", Release);
  NODE_SET_METHOD(target, "setScreenStateChangeListener",
                  SetScreenStateChangeListener);
  NODE_SET_METHOD(target, "getScreenBrightness", GetScreenBrightness);
  NODE_SET_METHOD(target, "setScreenBrightness", SetScreenBrightness);
  NODE_SET_METHOD(target, "isScreenOn", IsScreenOn);
  NODE_SET_METHOD(target, "restoreScreenBrightness", RestoreScreenBrightness);
  NODE_SET_METHOD(target, "setScreenState", SetScreenState);

  PowerManager::GetInstance()->AddListener(OnScreenStateChanged);
}

// static
void NativeBinding::Request(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  if (args.Length() < 2 || !args[0]->IsString() || !args[1]->IsString()) {
    result.Set(v8::Boolean::New(isolate, false));
    return;
  }

  v8::String::Utf8Value resource(args[0]->ToString());
  v8::String::Utf8Value state(args[1]->ToString());

  int err =
      PowerManager::GetInstance()->Request(
          kPowerResourceMap.at(std::string(*resource)),
          kPowerStateMap.at(std::string(*state)));
  if (err) {
    result.Set(v8::Boolean::New(isolate, false));
  } else {
    result.Set(v8::Boolean::New(isolate, true));
  }
}

// static
void NativeBinding::Release(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  if (args.Length() < 1 || !args[0]->IsString()) {
    result.Set(v8::Boolean::New(isolate, false));
    return;
  }

  v8::String::Utf8Value resource(args[0]->ToString());

  int err =
      PowerManager::GetInstance()->Release(
          kPowerResourceMap.at(std::string(*resource)));
  if (err) {
    result.Set(v8::Boolean::New(isolate, false));
  } else {
    result.Set(v8::Boolean::New(isolate, true));
  }
}

// static
void NativeBinding::SetScreenStateChangeListener(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  if (args.Length() < 1 || !args[0]->IsFunction()) {
    result.Set(v8::Boolean::New(isolate, false));
    return;
  }

  g_listener.Reset(
      isolate, v8::Handle<v8::Function>::Cast(args[0]));

  result.Set(v8::Boolean::New(isolate, true));
}

// static
void NativeBinding::GetScreenBrightness(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  double brightness;
  int err =
      PowerManager::GetInstance()->GetScreenBrightness(&brightness);
  if (err) {
    result.Set(v8::Boolean::New(isolate, false));
  } else {
    result.Set(v8::Number::New(isolate, brightness));
  }
}

// static
void NativeBinding::SetScreenBrightness(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  if (args.Length() < 1 || !args[0]->IsNumber()) {
    result.Set(v8::Boolean::New(isolate, false));
  }

  double brightness = args[0]->NumberValue();
  int err =
      PowerManager::GetInstance()->SetScreenBrightness(brightness);
  if (err) {
    result.Set(v8::Boolean::New(isolate, false));
  } else {
    result.Set(v8::Boolean::New(isolate, true));
  }
}

// static
void NativeBinding::IsScreenOn(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  bool state = false;
  int err = PowerManager::GetInstance()->IsScreenOn(&state);
  if (err) {
    result.Set(v8::Boolean::New(isolate, false));
  } else {
    result.Set(v8::Boolean::New(isolate, state));
  }
}

// static
void NativeBinding::RestoreScreenBrightness(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  int err =
      PowerManager::GetInstance()->RestoreScreenBrightness();
  if (err) {
    result.Set(v8::Boolean::New(isolate, false));
  } else {
    result.Set(v8::Boolean::New(isolate, true));
  }
}

// static
void NativeBinding::SetScreenState(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  if (args.Length() < 1 || !args[0]->IsBoolean()) {
    result.Set(v8::Boolean::New(isolate, false));
  }

  bool state = args[0]->BooleanValue();

  int err = PowerManager::GetInstance()->SetScreenState(state);
  if (err) {
    result.Set(v8::Boolean::New(isolate, false));
  } else {
    result.Set(v8::Boolean::New(isolate, true));
  }
}

}  // namespace power
}  // namespace tizen

extern "C" {
  static void NodeInit(v8::Handle<v8::Object> target) {
    tizen::power::NativeBinding::Init(target);
  }
  NODE_MODULE(tizen_power_native, NodeInit);
}
