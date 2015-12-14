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
#include <dlog.h>

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace {
static void WeakCallback(const v8::WeakCallbackData<v8::Object,
                         v8::Persistent<v8::Object> >& data) {
  v8::Isolate* isolate = data.GetIsolate();
  v8::HandleScope handle_scope(isolate);

  v8::Local<v8::Object> target = data.GetValue();
  v8::Handle<v8::Value> function =
      target->Get(v8::String::NewFromUtf8(isolate, "__grim_reaper"));

  if (function.IsEmpty() || !function->IsFunction()) {
    LOGW("grim reaper function not set");
    data.GetParameter()->Reset();
    delete data.GetParameter();
    return;
  }

  v8::Handle<v8::Context> context = v8::Context::New(isolate);

  v8::TryCatch try_catch;
  v8::Handle<v8::Value> args[] = { target };
  v8::Handle<v8::Function>::Cast(function)->Call(context->Global(), 1, args);
  if (try_catch.HasCaught()) {
    LOGE("Exception when running callback");
  }

  data.GetParameter()->Reset();
  delete data.GetParameter();
}

}  // namespace

static void SetReaper(const v8::FunctionCallbackInfo<v8::Value>& args) {
  if (args.Length() < 2) {
    LOGE("2 argument should be passed");
    return;
  }

  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::HandleScope scope(isolate);

  if (!args[0]->IsObject() || !args[1]->IsFunction()) {
    LOGE("The first argument should be Object and "
         "second argumnet should be function");
    return;
  }

  v8::Local<v8::Object> target = v8::Local<v8::Object>::Cast(args[0]);
  v8::Local<v8::Function> callback = v8::Local<v8::Function>::Cast(args[1]);


  v8::Handle<v8::Value> oldFunction =
      target->Get(v8::String::NewFromUtf8(isolate, "__grim_reaper"));
  target->Set(v8::String::NewFromUtf8(isolate, "__grim_reaper"), callback);

  if (!oldFunction.IsEmpty() && oldFunction->IsFunction()) {
    LOGW("Reaper can be set only one, callback was updated");
    return;
  }

  v8::Persistent<v8::Object>* tracker =
      new v8::Persistent<v8::Object>(isolate, target);
  tracker->SetWeak(tracker, &WeakCallback);
}

static void init(v8::Handle<v8::Object> target) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::HandleScope scope(isolate);
  target->Set(v8::String::NewFromUtf8(isolate, "setReaper"),
      v8::FunctionTemplate::New(isolate, SetReaper)->GetFunction());
}

NODE_MODULE(reaper, init);
