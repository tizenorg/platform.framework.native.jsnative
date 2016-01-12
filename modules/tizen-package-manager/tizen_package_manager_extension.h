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

#ifndef PACKAGE_MANAGER_EXTENSION_H_
#define PACKAGE_MANAGER_EXTENSION_H_

#include <xwalk/xwalk_extension.h>

namespace packagemanager {

class PackageManagerExtension : public xwalk::XWalkExtension {
 public:
  // @override
  xwalk::XWalkExtensionInstance* CreateInstance();
};

class PackageManagerInstance : public xwalk::XWalkExtensionInstance {
 public:
  // @override
  void Initialize();

  // @override
  void HandleMessage(const char* msg);

  // @override
  void HandleSyncMessage(const char* msg);
 private:
  void FireSimpleEvent(const std::string& event,
                       const std::string& data = std::string());

  void HandleGetPackagesInfo(const std::string& asyncid);
  void HandleGetPackageSizeInfo(const std::string& asyncid);
  void HandleGetTotalPackageSizeInfo(const std::string& asyncid);
  void HandleInstall(const std::string& asyncid);
  void HandleUninstall(const std::string& asyncid);
  void HandleMove(const std::string& asyncid);
  void HandleGetAppIdsFromPackage(const std::string& asyncid);
  void HandleGetCertInfo(const std::string& asyncid);
  void HandleGetPrivilegeInfo(const std::string& asyncid);
  void HandleGetPackageInfoFilter(const std::string& asyncid);
};

}  // namespace packagemanager

#endif  // PACKAGE_MANAGER_EXTENSION_H_
