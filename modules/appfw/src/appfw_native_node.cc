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


#include <v8.h>
#include <node.h>
#include <appfw.h>
#include <dlog.h>

#include <vector>


#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace {

v8::Persistent<v8::Object> gThis_;
const char* kCreateHandlerKey = "onCreate";
const char* kTerminateHandlerKey = "onTerminate";
const char* kServiceHandlerKey = "onService";
const char* kPauseHandlerKey = "onPause";
const char* kResumeHandlerKey = "onResume";

v8::Handle<v8::Function> GetHandler(const std::string& name) {
  if (gThis_.IsEmpty()) {
    LOGD("this object is undefined");
    return v8::Handle<v8::Function>();
  }
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::EscapableHandleScope handle_scope(isolate);

  v8::Handle<v8::Object> self = v8::Local<v8::Object>::New(isolate, gThis_);
  v8::Local<v8::Value> handler_value =
      self->Get(v8::String::NewFromUtf8(isolate, name.c_str()));

  if (!handler_value->IsFunction()) {
    LOGE("%s handler is undefined", name.c_str());
    return v8::Handle<v8::Function>();
  }
  return handle_scope.Escape(v8::Handle<v8::Function>::Cast(handler_value));
}

void SetCreateHandler() {
  plugins::AppFW* appfw = plugins::AppFW::GetInstance();
  appfw->set_create_handler([](){
    v8::Isolate* isolate = v8::Isolate::GetCurrent();
    v8::HandleScope handle_scope(isolate);
    v8::Handle<v8::Function> handler_function = GetHandler(kCreateHandlerKey);
    if (handler_function.IsEmpty()) {
      return;
    }
    v8::TryCatch try_catch;
    handler_function->Call(v8::Local<v8::Object>::New(isolate, gThis_),
        0, nullptr);
    if (try_catch.HasCaught()) {
      LOGE("Exception when running create handler");
      if (!try_catch.Message().IsEmpty())
        LOGE("%s", *v8::String::Utf8Value(try_catch.Message()->Get()));
      try_catch.ReThrow();
    }
  });
}

void SetTerminateHandler() {
  plugins::AppFW* appfw = plugins::AppFW::GetInstance();
  appfw->set_terminate_handler([](){
    v8::Isolate* isolate = v8::Isolate::GetCurrent();
    v8::HandleScope handle_scope(isolate);
    v8::Handle<v8::Function> handler_function =
        GetHandler(kTerminateHandlerKey);
    if (handler_function.IsEmpty()) {
      return;
    }
    v8::TryCatch try_catch;
    handler_function->Call(v8::Local<v8::Object>::New(isolate, gThis_),
        0, nullptr);
    if (try_catch.HasCaught()) {
      LOGE("Exception when running terminate handler");
      if (!try_catch.Message().IsEmpty())
        LOGE("%s", *v8::String::Utf8Value(try_catch.Message()->Get()));
      try_catch.ReThrow();
    }
  });
}

void SetPauseHandler() {
  plugins::AppFW* appfw = plugins::AppFW::GetInstance();
  appfw->set_pause_handler([](){
    v8::Isolate* isolate = v8::Isolate::GetCurrent();
    v8::HandleScope handle_scope(isolate);
    v8::Handle<v8::Function> handler_function =
        GetHandler(kPauseHandlerKey);
    if (handler_function.IsEmpty()) {
      return;
    }
    v8::TryCatch try_catch;
    handler_function->Call(v8::Local<v8::Object>::New(isolate, gThis_),
        0, nullptr);
    if (try_catch.HasCaught()) {
      LOGE("Exception when running pause handler");
      if (!try_catch.Message().IsEmpty())
        LOGE("%s", *v8::String::Utf8Value(try_catch.Message()->Get()));
      try_catch.ReThrow();
    }
  });
}

void SetResumeHandler() {
  plugins::AppFW* appfw = plugins::AppFW::GetInstance();
  appfw->set_resume_handler([](){
    v8::Isolate* isolate = v8::Isolate::GetCurrent();
    v8::HandleScope handle_scope(isolate);
    v8::Handle<v8::Function> handler_function =
        GetHandler(kResumeHandlerKey);
    if (handler_function.IsEmpty()) {
      return;
    }
    v8::TryCatch try_catch;
    handler_function->Call(v8::Local<v8::Object>::New(isolate, gThis_),
        0, nullptr);
    if (try_catch.HasCaught()) {
      LOGE("Exception when running resume handler");
      if (!try_catch.Message().IsEmpty())
        LOGE("%s", *v8::String::Utf8Value(try_catch.Message()->Get()));
      try_catch.ReThrow();
    }
  });
}

void SetServiceHandler() {
  plugins::AppFW* appfw = plugins::AppFW::GetInstance();
  appfw->set_service_handler([](void* bundle){
    v8::Isolate* isolate = v8::Isolate::GetCurrent();
    v8::HandleScope handle_scope(isolate);
    v8::Handle<v8::Function> handler_function =
        GetHandler(kServiceHandlerKey);
    if (handler_function.IsEmpty()) {
      return;
    }
    v8::TryCatch try_catch;
    handler_function->Call(v8::Local<v8::Object>::New(isolate, gThis_),
        0, nullptr);
    if (try_catch.HasCaught()) {
      LOGE("Exception when running service handler");
      if (!try_catch.Message().IsEmpty())
        LOGE("%s", *v8::String::Utf8Value(try_catch.Message()->Get()));
      try_catch.ReThrow();
    }
  });
}

}  // namespace

static void AppFWInit(const v8::FunctionCallbackInfo<v8::Value>& args) {
  if (args.Length() < 1 || !args[0]->IsArray())
    return;

  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::HandleScope scope(isolate);

  gThis_.Reset(v8::Isolate::GetCurrent(), args.This());

  SetCreateHandler();
  SetTerminateHandler();
  SetPauseHandler();
  SetResumeHandler();
  SetServiceHandler();


  v8::Local<v8::Array> array_args = v8::Local<v8::Array>::Cast(args[0]);
  int argc = array_args->Length();
  std::vector<char*> argv(argc);
  for (int i = 0; i < argc; i++) {
    v8::Local<v8::String> arg = array_args->Get(i)->ToString();
    int nsize = arg->Utf8Length()+1;
    argv[i] = new char[nsize];
    arg->WriteUtf8(argv[i]);
  }
  plugins::AppFW::GetInstance()->Init(argc, argv.data());
  for (int i = 0; i < argc; i++) {
    delete[] argv[i];
  }
}

static void AppFWDeinit(const v8::FunctionCallbackInfo<v8::Value>& args) {
  plugins::AppFW::GetInstance()->Deinit();
}

static void init(v8::Handle<v8::Object> target) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::HandleScope scope(isolate);
  target->Set(v8::String::NewFromUtf8(isolate, "init"),
      v8::FunctionTemplate::New(isolate, AppFWInit)->GetFunction());
  target->Set(v8::String::NewFromUtf8(isolate, "deinit"),
      v8::FunctionTemplate::New(isolate, AppFWDeinit)->GetFunction());
}

NODE_MODULE(appfw_native, init);
