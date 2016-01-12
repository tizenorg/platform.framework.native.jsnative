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

#include "picojson.h"

#include <package_manager.h>
#include <pkgmgr-info.h>

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

  //static bool ConvertToPackageToObject(const package_info_h info,
  static bool ConvertToPackageToObject(const pkgmgrinfo_pkginfo_h info,
                                       picojson::object& result);

 private:
  void FireSimpleEvent(const std::string& event,
                       const std::string& data = std::string());

  // async handle
  void HandleGetPackagesInfo(const std::string& asyncId);
  void HandleGetPackageSizeInfo(const std::string& asyncId, const std::string& pkgId);
  void HandleGetAppIdsFromPackage(const std::string& asyncId, const std::string& pkgId, const std::string& componentType);
  void HandleGetCertInfo(const std::string& asyncId, const std::string& pkgId);
  void HandleGetPrivilegeInfo(const std::string& asyncId, const std::string& pkgId);

  // sync handle
  void HandleGetPackageInfo(const std::string& pkgId);
  void HandleGetPackageIdByAppId(const std::string& appId);
  void HandlecomparePackageCertInfo(const std::string& lhsPkgId, const std::string& rhsPkgId);
  void HandlecompareAppCertInfo(const std::string& lhsAppId, const std::string& rhsAppId);
  void HandleIsPreloadPackageByAppId(const std::string& appId);
  void HandleGetPermissionType(const std::string& appId);
  void HandleClearCacheDir(const std::string& pkgId);
};

}  // namespace packagemanager

#endif  // PACKAGE_MANAGER_EXTENSION_H_
