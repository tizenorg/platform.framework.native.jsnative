// Copyright (c) 2013 Intel Corporation. All rights reserved.
// Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef NODE_XWALK_EXTENSIONS_EXTENSION_H_
#define NODE_XWALK_EXTENSIONS_EXTENSION_H_

#include <functional>
#include <map>
#include <string>
#include <vector>

#include "xwalk/extensions/public/XW_Extension.h"
#include "xwalk/extensions/public/XW_Extension_Message_2.h"
#include "xwalk/extensions/public/XW_Extension_SyncMessage.h"

namespace xwalk {
namespace extensions {

class ExtensionAdapter;
class ExtensionInstance;

class Extension {
 public:
  typedef std::function<std::string(const std::string&)>
      RuntimeVariableCallback;

  explicit Extension(const std::string& path);
  virtual ~Extension();

  bool Initialize();
  ExtensionInstance* CreateInstance();

  XW_Extension xw_extension() const {
    return xw_extension_;
  }

  std::string name() const {
    return name_;
  }

  std::string javascript_api() const {
    return javascript_api_;
  }

  std::vector<std::string>& entry_points() {
    return entry_points_;
  }

  void set_name(const std::string& name) {
    name_ = name;
  }

  void set_javascript_api(const std::string& javascript_api) {
    javascript_api_ = javascript_api;
  }

  void set_runtime_variable_callback(RuntimeVariableCallback callback) {
    runtime_variable_callback_ = callback;
  }

 private:
  friend class ExtensionAdapter;
  friend class ExtensionInstance;

  void GetRuntimeVariable(const char* key, char* value, size_t value_len);
  int CheckAPIAccessControl(const char* api_name);
  int RegisterPermissions(const char* perm_table);

  bool initialized_;
  std::string library_path_;
  XW_Extension xw_extension_;
  std::string name_;
  std::string javascript_api_;
  std::vector<std::string> entry_points_;

  RuntimeVariableCallback runtime_variable_callback_;

  XW_CreatedInstanceCallback created_instance_callback_;
  XW_DestroyedInstanceCallback destroyed_instance_callback_;
  XW_ShutdownCallback shutdown_callback_;
  XW_HandleMessageCallback handle_msg_callback_;
  XW_HandleSyncMessageCallback handle_sync_msg_callback_;
  XW_HandleBinaryMessageCallback handle_binary_msg_callback_;
};

class ExtensionInstance {
 public:
  typedef std::function<void(
      const char* msg, const size_t size, const bool binary)>
      MessageCallback;

  ExtensionInstance(Extension* extension, XW_Instance xw_instance);
  virtual ~ExtensionInstance();

  void HandleMessage(const std::string& msg);
  void HandleMessage(const char* msg, const size_t size);
  void HandleSyncMessage(const std::string& msg);

  XW_Instance xw_instance() const {
    return xw_instance_;
  }

  void set_post_message_listener(MessageCallback callback) {
    post_message_callback_ = callback;
  }

  void set_send_sync_message_listener(MessageCallback callback) {
    send_sync_reply_callback_ = callback;
  }

 private:
  friend class ExtensionAdapter;

  void PostMessageToJS(const std::string& msg);
  void PostMessageToJS(const char* msg, size_t size);
  void SyncReplyToJS(const std::string& reply);

  Extension* extension_;
  XW_Instance xw_instance_;
  void* instance_data_;

  MessageCallback post_message_callback_;
  MessageCallback send_sync_reply_callback_;
};

}  // namespace extensions
}  // namespace xwalk


#endif  // NODE_XWALK_EXTENSIONS_EXTENSION_H_
