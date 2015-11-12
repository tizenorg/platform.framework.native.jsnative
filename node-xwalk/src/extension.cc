// Copyright (c) 2013 Intel Corporation. All rights reserved.
// Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#include "extension.h"

#include <dlfcn.h>
#include <string.h>

#include "extension_adapter.h"
#include "log.h"

namespace xwalk {
namespace extensions {

Extension::Extension(const std::string& path)
  : initialized_(false),
    library_path_(path),
    xw_extension_(0),
    created_instance_callback_(NULL),
    destroyed_instance_callback_(NULL),
    shutdown_callback_(NULL),
    handle_msg_callback_(NULL),
    handle_sync_msg_callback_(NULL),
    handle_binary_msg_callback_(NULL) {
}

Extension::~Extension() {
  if (!initialized_)
    return;

  if (shutdown_callback_)
    shutdown_callback_(xw_extension_);
  ExtensionAdapter::GetInstance()->UnregisterExtension(this);
}

bool Extension::Initialize() {
  if (initialized_)
    return true;

  void* handle = dlopen(library_path_.c_str(), RTLD_LAZY);
  if (!handle) {
    LOGE("Error loading extension '%s' : %s",
         library_path_.c_str(), dlerror());
    return false;
  }

  XW_Initialize_Func initialize = reinterpret_cast<XW_Initialize_Func>(
      dlsym(handle, "XW_Initialize"));
  if (!initialize) {
    LOGE("Error loading extension '%s' : "
         "couldn't get XW_Initialize function",
         library_path_.c_str());
    dlclose(handle);
    return false;
  }

  ExtensionAdapter* adapter = ExtensionAdapter::GetInstance();
  xw_extension_ = adapter->GetNextXWExtension();
  adapter->RegisterExtension(this);

  int ret = initialize(xw_extension_, ExtensionAdapter::GetInterface);
  if (ret != XW_OK) {
    LOGE("Error loading extension '%s' : "
         "XW_Initialize function returned error value.",
         library_path_.c_str());
    dlclose(handle);
    return false;
  }

  initialized_ = true;
  return true;
}

ExtensionInstance* Extension::CreateInstance() {
  ExtensionAdapter* adapter = ExtensionAdapter::GetInstance();
  XW_Instance xw_instance = adapter->GetNextXWInstance();
  return new ExtensionInstance(this, xw_instance);
}

void Extension::GetRuntimeVariable(const char* key,
                                   char* value,
                                   size_t value_len) {
  if (runtime_variable_callback_) {
    std::string ret = runtime_variable_callback_(key);
    strncpy(value, ret.data(), value_len);
  }
}

int Extension::CheckAPIAccessControl(const char* /*api_name*/) {
  // Not Supported
  return XW_OK;
}

int Extension::RegisterPermissions(const char* /*perm_table*/) {
  // Not Supported
  return XW_OK;
}

ExtensionInstance::ExtensionInstance(Extension* extension,
                                     XW_Instance xw_instance)
  : extension_(extension),
    xw_instance_(xw_instance),
    instance_data_(NULL) {
  ExtensionAdapter::GetInstance()->RegisterInstance(this);
  XW_CreatedInstanceCallback callback =
      extension_->created_instance_callback_;
  if (callback)
    callback(xw_instance_);
}

ExtensionInstance::~ExtensionInstance() {
  XW_DestroyedInstanceCallback callback =
      extension_->destroyed_instance_callback_;
  if (callback)
    callback(xw_instance_);
  ExtensionAdapter::GetInstance()->UnregisterInstance(this);
}

void ExtensionInstance::HandleMessage(const std::string& msg) {
  XW_HandleMessageCallback callback =
      extension_->handle_msg_callback_;
  if (callback)
    callback(xw_instance_, msg.c_str());
}

void ExtensionInstance::HandleMessage(const char* msg, const size_t size) {
  XW_HandleBinaryMessageCallback callback =
      extension_->handle_binary_msg_callback_;
  if (callback)
    callback(xw_instance_, msg, size);
}

void ExtensionInstance::HandleSyncMessage(const std::string& msg) {
  XW_HandleSyncMessageCallback callback =
      extension_->handle_sync_msg_callback_;
  if (callback) {
    callback(xw_instance_, msg.c_str());
  }
}

void ExtensionInstance::PostMessageToJS(const std::string& msg) {
  if (post_message_callback_) {
    post_message_callback_(msg.c_str(), 0, false);
  }
}

void ExtensionInstance::PostMessageToJS(const char* msg, size_t size) {
  if (post_message_callback_) {
    post_message_callback_(msg, size, true);
  }
}

void ExtensionInstance::SyncReplyToJS(const std::string& reply) {
  if (send_sync_reply_callback_) {
    send_sync_reply_callback_(reply.c_str(), 0, false);
  }
}

}  // namespace extensions
}  // namespace xwalk
