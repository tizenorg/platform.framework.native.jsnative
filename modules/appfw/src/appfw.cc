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

#include "appfw.h"

#include <dlog.h>
#include <appcore-common.h>
#include <appcore-efl.h>
#include <aul.h>
#include <uv.h>

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JS_BINDING"

namespace plugins {
AppFW* AppFW::GetInstance() {
  static AppFW instance;
  return &instance;
}

AppFW::AppFW() : initialized_(false),
    create_handler_(nullptr),
    service_handler_(nullptr),
    terminate_handler_(nullptr),
    pause_handler_(nullptr),
    resume_handler_(nullptr) {
}

AppFW::~AppFW() {
}

bool AppFW::Init(int argc, char* argv[]) {
  if (initialized_)
    return false;

  initialized_ = true;
  static struct appcore_ops ops;

  ops.create = [](void* data) {
    AppFW* appfw = static_cast<AppFW*>(data);
    if (appfw->create_handler_)
      appfw->create_handler_();
    return 0;
  };

  ops.terminate = [](void* data) {
    AppFW* appfw = static_cast<AppFW*>(data);
    if (appfw->terminate_handler_)
      appfw->terminate_handler_();
    return 0;
  };

  ops.pause = [](void* data) {
    AppFW* appfw = static_cast<AppFW*>(data);
    if (appfw->pause_handler_)
      appfw->pause_handler_();
    return 0;
  };

  ops.resume = [](void* data) {
    AppFW* appfw = static_cast<AppFW*>(data);
    if (appfw->resume_handler_)
      appfw->resume_handler_();
    return 0;
  };

  ops.reset = [](bundle* b, void* data) {
    AppFW* appfw = static_cast<AppFW*>(data);
    if (appfw->service_handler_)
      appfw->service_handler_(b);
    return 0;
  };

  ops.data = this;

  // TODO(sngn.lee) : Delete me, Temporary code to hack app terminate
  auto status_cb = [](int status, void* data){
    AppFW* appfw = static_cast<AppFW*>(data);
    if (status == STATUS_DYING) {
      uv_stop(uv_default_loop());
      appfw->Deinit();
    }
    return 0;
  };
  aul_add_status_local_cb(status_cb, this);
  // end of TODO

  appcore_efl_init("js-binding", &argc, &argv, &ops);

  return true;
}

void AppFW::Deinit() {
  LOGE("AppFW Deinit was called..");
  if (initialized_) {
    initialized_ = false;
    appcore_efl_fini();
  }
}

void AppFW::set_create_handler(std::function<void(void)> handler) {
  create_handler_ = handler;
}
void AppFW::set_service_handler(std::function<void(void*)> handler) {
  service_handler_ = handler;
}
void AppFW::set_terminate_handler(std::function<void(void)> handler) {
  terminate_handler_ = handler;
}
void AppFW::set_pause_handler(std::function<void(void)> handler) {
  pause_handler_ = handler;
}
void AppFW::set_resume_handler(std::function<void(void)> handler) {
  resume_handler_ = handler;
}

}  // namespace plugins
