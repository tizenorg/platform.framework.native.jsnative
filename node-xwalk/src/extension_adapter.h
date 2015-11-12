// Copyright (c) 2013 Intel Corporation. All rights reserved.
// Copyright (c) 2015 Samsung Electronics Co., Ltd. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef NODE_XWALK_EXTENSIONS_EXTENSION_ADAPTER_H_
#define NODE_XWALK_EXTENSIONS_EXTENSION_ADAPTER_H_

#include <map>

#include "xwalk/extensions/public/XW_Extension.h"
#include "xwalk/extensions/public/XW_Extension_Message_2.h"
#include "xwalk/extensions/public/XW_Extension_SyncMessage.h"
#include "xwalk/extensions/public/XW_Extension_EntryPoints.h"
#include "xwalk/extensions/public/XW_Extension_Runtime.h"
#include "xwalk/extensions/public/XW_Extension_Permissions.h"

#include "extension.h"

namespace xwalk {
namespace extensions {

class ExtensionAdapter {
 public:
  static ExtensionAdapter* GetInstance();

  static Extension* GetExtension(XW_Extension xw_extension);
  static ExtensionInstance* GetExtensionInstance(XW_Instance xw_instance);

  XW_Extension GetNextXWExtension();
  XW_Instance GetNextXWInstance();

  void RegisterExtension(Extension* extension);
  void UnregisterExtension(Extension* extension);

  void RegisterInstance(ExtensionInstance* instance);
  void UnregisterInstance(ExtensionInstance* instance);

  // Returns the correct struct according to interface asked. This is
  // passed to external extensions in XW_Initialize() call.
  static const void* GetInterface(const char* name);

 private:
  ExtensionAdapter();
  virtual ~ExtensionAdapter();

  // Core Interface
  static void CoreSetExtensionName(
      XW_Extension xw_extension, const char* name);
  static void CoreSetJavaScriptAPI(
      XW_Extension xw_extension, const char* javascript_api);
  static void CoreRegisterInstanceCallbacks(
      XW_Extension xw_extension,
      XW_CreatedInstanceCallback created,
      XW_DestroyedInstanceCallback destroyed);
  static void CoreRegisterShutdownCallback(
      XW_Extension xw_extension, XW_ShutdownCallback shutdown);
  static void CoreSetInstanceData(
      XW_Instance xw_instance, void* data);
  static void* CoreGetInstanceData(XW_Instance xw_instance);
  // Messaging Interface
  static void MessagingRegister(
      XW_Extension xw_extension, XW_HandleMessageCallback handle_message);
  static void MessagingPostMessage(
      XW_Instance xw_instance, const char* message);
  static void MessagingRegisterBinaryMessageCallback(
      XW_Extension extension, XW_HandleBinaryMessageCallback handle_message);
  static void MessagingPostBinaryMessage(
      XW_Instance instance, const char* message, size_t size);
  // SyncMessage Interface
  static void SyncMessagingRegister(
      XW_Extension xw_extension,
      XW_HandleSyncMessageCallback handle_sync_message);
  static void SyncMessagingSetSyncReply(
      XW_Instance xw_instance, const char* reply);
  // EntryPoints Interface
  static void EntryPointsSetExtraJSEntryPoints(
      XW_Extension xw_extension, const char** entry_points);
  // Runtime Interface
  static void RuntimeGetStringVariable(
      XW_Extension xw_extension,
      const char* key, char* value, unsigned int value_len);
  // Permission Interface
  static int PermissionsCheckAPIAccessControl(
      XW_Extension xw_extension, const char* api_name);
  static int PermissionsRegisterPermissions(
      XW_Extension xw_extension, const char* perm_table);

  typedef std::map<XW_Extension, Extension*> ExtensionMap;
  ExtensionMap extension_map_;

  typedef std::map<XW_Instance, ExtensionInstance*> InstanceMap;
  InstanceMap instance_map_;

  XW_Extension next_xw_extension_;
  XW_Instance next_xw_instance_;
};

}  // namespace extensions
}  // namespace xwalk

#endif  // NODE_XWALK_EXTENSIONS_EXTENSION_ADAPTER_H_
