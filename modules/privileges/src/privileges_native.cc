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

#include "privileges_native.h"

#include <unistd.h>

#include <app_manager.h>
#include <dlog.h>
#include <pkgmgr-info.h>
#include <sys/smack.h>
#include <cynara/cynara-client.h>

#include <string>

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace privileges {

namespace {

class AccessControl {
 public:
  static AccessControl* GetInstance() {
    static AccessControl* self = nullptr;
    if (!self) {
      self = new AccessControl();
    }
    return self;
  }

  ~AccessControl() {
    if (cynara_) {
      auto ret = cynara_finish(cynara_);
      if (CYNARA_API_SUCCESS != ret) {
        LOGE("Failed to finalize Cynara");
      }
      cynara_ = nullptr;
    }
  }

  bool CheckAccess(const std::string privilege) {
    if (cynara_) {
      if (CYNARA_API_ACCESS_ALLOWED !=
          cynara_simple_check(cynara_, smack_label_.c_str(), "",
                              uid_.c_str(), privilege.c_str())) {
        return false;
      }
      return true;
    } else {
      return false;
    }
  }

 private:
  AccessControl() : cynara_(nullptr) {
    char* smack_label = nullptr;
    int len = smack_new_label_from_self(&smack_label);

    if (0 < len && nullptr != smack_label) {
      auto uid = getuid();
      uid_ = std::to_string(uid);
      smack_label_ = smack_label;
      free(smack_label);
    } else {
      LOGE("Failed to get smack label");
      return;
    }

    int ret = cynara_initialize(&cynara_, nullptr);
    if (CYNARA_API_SUCCESS != ret) {
      LOGE("Failed to initialize Cynara");
      cynara_ = nullptr;
    }
  }

  cynara* cynara_;
  std::string uid_;
  std::string smack_label_;
};

}  // namespace

#define THROW_EXCEPTION(isolate, msg) \
  isolate->ThrowException(v8::String::NewFromUtf8(isolate, msg));

// static
void NativeBinding::Init(v8::Handle<v8::Object> target) {
  NODE_SET_METHOD(target, "getPkgApiVersion", GetPkgApiVersion);
  NODE_SET_METHOD(target, "checkPrivilegeAccess", CheckPrivilegeAccess);
}

// static
void NativeBinding::GetPkgApiVersion(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  char* app_id = nullptr;
  char* pkgid = nullptr;
  app_info_h app_handle = nullptr;
  pkgmgrinfo_pkginfo_h pkginfo_handle = nullptr;
  char *api_version = nullptr;

  pid_t pid = getpid();
  int ret = app_manager_get_app_id(pid, &app_id);
  if (ret != APP_MANAGER_ERROR_NONE) {
    result.Set(v8::Undefined(isolate));
    THROW_EXCEPTION(isolate, "Failed to get app id");
    goto CLEANUP;
  }

  ret = app_info_create(app_id, &app_handle);
  if (ret != APP_MANAGER_ERROR_NONE) {
    result.Set(v8::Undefined(isolate));
    THROW_EXCEPTION(isolate, "Fail to get app info");
    goto CLEANUP;
  }

  ret = app_info_get_package(app_handle, &pkgid);
  if ((ret != APP_MANAGER_ERROR_NONE) || (pkgid == nullptr)) {
    result.Set(v8::Undefined(isolate));
    THROW_EXCEPTION(isolate, "Fail to get pkg id");
    goto CLEANUP;
  }

  ret = pkgmgrinfo_pkginfo_get_usr_pkginfo(pkgid, getuid(), &pkginfo_handle);
  if (ret != PMINFO_R_OK) {
    result.Set(v8::Undefined(isolate));
    THROW_EXCEPTION(isolate, "Fail to get pkginfo_h");
    goto CLEANUP;
  }

  ret = pkgmgrinfo_pkginfo_get_version(pkginfo_handle, &api_version);
  if (ret != PMINFO_R_OK) {
    result.Set(v8::Undefined(isolate));
    THROW_EXCEPTION(isolate, "Fail to get api version");
    goto CLEANUP;
  }

  result.Set(v8::String::NewFromUtf8(isolate, api_version));

CLEANUP:
    if (app_id) {
      free(app_id);
    }
    if (pkgid) {
      free(pkgid);
    }
    if (app_handle) {
      app_info_destroy(app_handle);
    }
    if (pkginfo_handle) {
      pkgmgrinfo_pkginfo_destroy_pkginfo(pkginfo_handle);
    }
}

// static
void NativeBinding::CheckPrivilegeAccess(
    const v8::FunctionCallbackInfo<v8::Value>& args) {
  v8::Isolate* isolate = args.GetIsolate();
  v8::HandleScope handle_scope(isolate);
  v8::ReturnValue<v8::Value> result(args.GetReturnValue());

  if (args.Length() < 1 || !args[0]->IsString()) {
    result.Set(v8::Undefined(isolate));
    return;
  }

  v8::String::Utf8Value privilege(args[0]->ToString());

  AccessControl* ctrl = AccessControl::GetInstance();
  bool ret = ctrl->CheckAccess(std::string(*privilege));

  result.Set(v8::Boolean::New(isolate, ret));
}

}  // namespace privileges

extern "C" {
  static void NodeInit(v8::Handle<v8::Object> target) {
    privileges::NativeBinding::Init(target);
  }
  NODE_MODULE(privileges_native, NodeInit);
}
