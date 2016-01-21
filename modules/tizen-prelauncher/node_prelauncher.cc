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


#include "prelauncher.h"

#include <node.h>

namespace runtime {

static void Ready(const v8::FunctionCallbackInfo<v8::Value>& args) {
  if (args.Length() < 1)
    return;

  if (!args[0]->IsArray())
    return;

  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::HandleScope scope(isolate);
  std::string realpath;


  auto array_args = v8::Local<v8::Array>::Cast(args[0]);
  int argc = array_args->Length();
  size_t totalsize = 0;
  for (int i = 0; i < argc; i++) {
    auto arg = array_args->Get(i)->ToString();
    size_t nsize = arg->Utf8Length()+1;
    totalsize += nsize;
  }

  std::vector<char*> argv;
  char* origindata = new char[totalsize + 1];
  size_t cur = 0;
  for (int i = 0; i < argc; i++) {
    auto arg = array_args->Get(i)->ToString();
    size_t nsize = arg->Utf8Length()+1;
    arg->WriteUtf8(origindata + cur);
    argv.push_back(origindata + cur);
    cur += nsize;
  }

  auto preload = [](){};
  auto didstart = [&realpath](const std::string& app_path) {
    realpath = app_path;
  };
  auto realmain = [](int, char**){
    return 0;
  };

  PreLauncher::Prelaunch(argc, argv.data(),
                         preload,
                         didstart,
                         realmain);
  delete[] origindata;
  args.GetReturnValue().Set(v8::String::NewFromUtf8(isolate, realpath.c_str()));
}

static void init(v8::Handle<v8::Object> target) {
  v8::Isolate* isolate = v8::Isolate::GetCurrent();
  v8::HandleScope scope(isolate);
  target->Set(v8::String::NewFromUtf8(isolate, "ready"),
      v8::FunctionTemplate::New(isolate, Ready)->GetFunction());
}

}  // namespace runtime

NODE_MODULE(prelauncher, runtime::init);
