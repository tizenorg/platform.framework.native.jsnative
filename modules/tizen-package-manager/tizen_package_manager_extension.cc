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

#include "tizen_package_manager_extension.h"

#include <dlog.h>

#include "picojson.h"

#include <stdio.h>
#include <package-manager.h>
#include <package_manager.h>
#include <pkgmgr-info.h>

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace packagemanager {

namespace {

void ErrorHandle(int ret, picojson::object* data) {
  picojson::object& result = *data;
  if (ret == PACKAGE_MANAGER_ERROR_INVALID_PARAMETER) {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("TypeError");
  } else if (ret == PACKAGE_MANAGER_ERROR_NO_SUCH_PACKAGE) {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("NotFoundError");
  } else if (ret == PACKAGE_MANAGER_ERROR_PERMISSION_DENIED) {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("NotPermittedError");
  } else if (ret == PACKAGE_MANAGER_ERROR_OUT_OF_MEMORY) {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("QuotaExceededError");
  } else if (ret == PACKAGE_MANAGER_ERROR_IO_ERROR) {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("NotReadableError");
  } else if (ret == PACKAGE_MANAGER_ERROR_SYSTEM_ERROR) {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("SystemError");
  } else {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("Fail");
  }
}

}

xwalk::XWalkExtensionInstance* PackageManagerExtension::CreateInstance() {
  return new PackageManagerInstance();
}

void PackageManagerInstance::Initialize() {
  LOGD("Created tizen-package-manager instance");
}

void PackageManagerInstance::HandleMessage(const char* msg) { //async
  LOGD("Enter HandleMessage()");
  // parse json object
  picojson::value value;
  std::string err;
  picojson::parse(value, msg, msg + strlen(msg), &err);
  if (!err.empty()) {
    LOGE("Ignoring message. Can't parse msessage : %s", err.c_str());
    return;
  }
  if (!value.is<picojson::object>()) {
    LOGE("Ignoring message. It is not an object.");
    return;
  }

  auto& request = value.get<picojson::object>();
  auto found = request.find("asyncid");
  if (found == request.end()) {
    LOGE("asyncid was not existed");
    return;
  }

  auto cmd = request["cmd"].to_str();
  if (cmd == "getPackagesInfo") {
    //LOGD("Enter getPackagesInfo()");
    HandleGetPackagesInfo(request["asyncid"].to_str());
  } else if (cmd == "getPackageSizeInfo") {
    //LOGD("Enter getPackageSizeInfo()");
    HandleGetPackageSizeInfo(request["asyncid"].to_str());
  } else if (cmd == "getAppIdsFromPackage") {
    //LOGD("Enter getAppIdsFromPackage()");
    HandleGetAppIdsFromPackage(request["asyncid"].to_str());
  } else if (cmd == "getCertInfo") {
    //LOGD("Enter getCertInfo()");
    HandleGetCertInfo(request["asyncid"].to_str());
  } else if (cmd == "getPrivilegeInfo") {
    //LOGD("Enter getPrivilegeInfo()");
    HandleGetPrivilegeInfo(request["asyncid"].to_str());
  } else {
    LOGW("Ignoring message. It is not an object.");
    return;
  }
  //PostMessage(picojson::value(obj).serialize().c_str());
}

void PackageManagerInstance::HandleSyncMessage(const char* msg) {
  LOGD("Enter HandleSyncMessage()");
  // parse json object
  picojson::value value;
  std::string err;
  picojson::parse(value, msg, msg + strlen(msg), &err);
  if (!err.empty()) {
    LOGE("Ignoring message. Can't parse msessage : %s", err.c_str());
    return;
  }
  if (!value.is<picojson::object>()) {
    LOGE("Ignoring message. It is not an object.");
    return;
  }

  auto& request = value.get<picojson::object>();
  auto cmd = request["cmd"].to_str();
  picojson::object result;
  if (cmd == "getPackageInfo") {
    LOGD("Enter getPackageInfo()");
    std::string pkgId = request["packageId"].to_str();
    HandleGetPackageInfo(pkgId);
  } else if (cmd == "getPackageIdByAppId") {
    LOGD("Enter getPackageIdByAppId()");
    std::string appId = request["appId"].to_str();
    HandleGetPackageIdByAppId(appId);
  } else if (cmd == "comparePackageCertInfo") {
    LOGD("Enter comparePackageCertInfo()");
    std::string lhsPkgId = request["lhsPackageId"].to_str();
    std::string rhsPkgId = request["rhsPackageId"].to_str();
    HandlecomparePackageCertInfo(lhsPkgId, rhsPkgId);
  } else if (cmd == "compareAppCertInfo") {
    LOGD("Enter compareAppCertInfo()");
    std::string lhsAppId = request["lhsAppId"].to_str();
    std::string rhsAppId = request["rhsAppId"].to_str();
    HandlecompareAppCertInfo(lhsAppId, rhsAppId);
  } else if (cmd == "isPreloadPackageByAppId") {
    LOGD("Enter isPreloadPackageByAppId()");
    std::string appId = request["appId"].to_str();
    HandleIsPreloadPackageByAppId(appId);
  } else if (cmd == "getPermissionType") {
    LOGD("Enter getPermissionType()");
    std::string appId = request["appId"].to_str();
    HandleGetPermissionType(appId);
  } else if (cmd == "clearCacheDir") {
    LOGD("Enter clearCacheDir()");
    HandleClearCacheDir();
  } else {
    LOGW("Ignoring message. It is not an object.");
    return;
  }
  //SendSyncReply(picojson::value(result).serialize().c_str());
}

// async handle
void PackageManagerInstance::FireSimpleEvent(const std::string& event,
                                             const std::string& data) {
  picojson::value::object obj;
  obj["event"] = picojson::value(event);
  if (data.length() > 0) {
    obj["data"] = picojson::value(data);
  }
  PostMessage(picojson::value(obj).serialize().c_str());
}


void PackageManagerInstance::HandleGetPackagesInfo(const std::string& asyncid) {
  LOGD("Enter HandleGetPackagesInfo()");

  picojson::object result;
  picojson::array array;
  result["asyncid"] = picojson::value(asyncid);

  //int ret = check_privilege(PRIVILEGE_PACKAGE_MANAGER_INFO);

/*
  int ret = pkgmgrinfo_pkginfo_get_usr_list([](, void* user_data, uid_t uid) {

  }, &array);

  if (ret == 0) {
    result["packageinfoArray"] = picojson::value(array);
  } else {
    ErrorHandle(ret, &result);
  }*/
}

void PackageManagerInstance::HandleGetPackageSizeInfo(const std::string& asyncid) {
  LOGD("Enter HandleGetPackageSizeInfo()");

}

void PackageManagerInstance::HandleGetAppIdsFromPackage(const std::string& asyncid) {
  LOGD("Enter HandleGetAppIdsFromPackage()");

}

void PackageManagerInstance::HandleGetCertInfo(const std::string& asyncid) {
  LOGD("Enter HandleGetCertInfo()");

}

void PackageManagerInstance::HandleGetPrivilegeInfo(const std::string& asyncid) {
  LOGD("Enter HandleGetPrivilegeInfo()");

}


// sync handle
bool PackageManagerInstance::ConvertToPackageToObject(const pkgmgrinfo_pkginfo_h info, picojson::object& result) {

  int ret = 0;

  char* id = NULL;
  ret = pkgmgrinfo_pkginfo_get_pkgid(info, &id);
  if ((ret != PMINFO_R_OK) || (id == NULL)) {
    LOGE("Failed to get package id");
    return false;
  }
  result["id"] = picojson::value(id);

  char* name = NULL;
  ret = pkgmgrinfo_pkginfo_get_label(info, &name);
  if ((ret != PMINFO_R_OK) || (name == NULL)) {
    LOGE("[%s] Failed to get package name", id);
    return false;
  }
  result["name"] = picojson::value(name);

  char* iconPath = NULL;
  ret = pkgmgrinfo_pkginfo_get_icon(info, &iconPath);
  if ((ret != PMINFO_R_OK) || (iconPath == NULL)) {
    LOGE("[%s] Failed to get package iconPath", id);
    return false;
  }
  result["iconPath"] = picojson::value(iconPath);

  char* version = NULL;
  ret = pkgmgrinfo_pkginfo_get_version(info, &version);
  if ((ret != PMINFO_R_OK) || (version == NULL)) {
    LOGE("[%s] Failed to get package version", id);
    return false;
  }
  result["version"] = picojson::value(version);

  char* type = NULL;
  ret = pkgmgrinfo_pkginfo_get_type(info, &type);
  if ((ret != PMINFO_R_OK) || (type == NULL)) {
    LOGE("[%s] Failed to get package type", id);
    return false;
  }
  result["type"] = picojson::value(type);

  char* storage = NULL;
  pkgmgrinfo_installed_storage value;
  ret = pkgmgrinfo_pkginfo_get_installed_storage(info, &value);
  if ((ret != PMINFO_R_OK)) {
    LOGE("[%s] Failed to get package storage", id);
    return false;
  }
  if (value == PMINFO_INTERNAL_STORAGE)
    storage = "internal";
  else if (value == PMINFO_EXTERNAL_STORAGE)
    storage = "external";
  result["installedStorage"] = picojson::value(storage);

  char* rootPath = NULL;
  ret = pkgmgrinfo_pkginfo_get_root_path(info, &rootPath);
  if ((ret != PMINFO_R_OK) || (rootPath == NULL)) {
    LOGE("[%s] Failed to get package rootPath", id);
    return false;
  }
  result["rootPath"] = picojson::value(rootPath);

  bool system = false;
  ret = pkgmgrinfo_pkginfo_is_preload(info, &system);
  if ((ret != PMINFO_R_OK)) {
    LOGE("[%s] Failed to get package system", id);
    return false;
  }
  result["isSystemPackage"] = picojson::value(system);

  bool removable = false;
  ret = pkgmgrinfo_pkginfo_is_removable(info, &removable);
  if ((ret != PMINFO_R_OK)) {
    LOGE("[%s] Failed to get package removable", id);
    return false;
  }
  result["isRemovablePackage"] = picojson::value(removable);

  bool preload = false;
  ret = pkgmgrinfo_pkginfo_is_preload(info, &preload);
  if ((ret != PMINFO_R_OK)) {
    LOGE("[%s] Failed to get package preload", id);
    return false;
  }
  result["isPreloadPackage"] = picojson::value(preload);

  bool accessible = false;
  ret = pkgmgrinfo_pkginfo_is_accessible(info, &accessible);
  if ((ret != PMINFO_R_OK)) {
    LOGE("[%s] Failed to get package accessible", id);
    return false;
  }
  result["isAccessible"] = picojson::value(accessible);
/*
  int lastModified = 0;
  ret = pkgmgrinfo_pkginfo_get_installed_time(info, &lastModified);
  if ((ret != PMINFO_R_OK)) {
    LOGE("[%s] Failed to get package lastModified", id);
    return false;
  }
  // This value will be converted into JavaScript Date object
  double lastModified_double = lastModified * 1000.0;
  result["lastModified"] = picojson::value(lastModified_double);

  char* author = NULL;
  ret = pkgmgrinfo_pkginfo_get_author_name(info, &author);
  if ((ret != PMINFO_R_OK) || (author == NULL)) {
    LOGE("[%s] Failed to get package author", id);
    return false;
  }
  result["author"] = picojson::value(author);

  char* description = NULL;
  ret = pkgmgrinfo_pkginfo_get_description(info, &description);
  if ((ret != PMINFO_R_OK) || (description == NULL)) {
    LOGE("[%s] Failed to get package description", id);
    return false;
  }
  result["description"] = picojson::value(description);
*/
/*
  package_info_h package_info;
  ret = package_info_create(id, &package_info);
  if (ret != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to create package info");
    return false;
  }

  if (PACKAGE_MANAGER_ERROR_NONE != package_info_destroy(package_info)) {
    LOGE("Failed to destroy package info");
  }

  picojson::array array_data;
  ret = package_info_foreach_app_from_package(package_info,
      PACKAGE_INFO_ALLAPP, PackageAppInfoCb, &array_data);
  if (ret != PACKAGE_MANAGER_ERROR_NONE ) {
    LOGE("Failed to get app info");
    return false;
  }
  result["appIds"] = picojson::value(array_data);
*/

  return true;
}

void PackageManagerInstance::HandleGetPackageInfo(const std::string& pkgId) {
  LOGD("Enter HandleGetPackageInfo()");

  picojson::object result;
  picojson::array array;

  //int ret = check_privilege(PRIVILEGE_PACKAGE_MANAGER_INFO);

  if (strlen(pkgId.c_str()) <= 0) {
    LOGE("Wrong Package ID");
    return;
  }

  pkgmgrinfo_pkginfo_h pkginfo;
  if (pkgmgrinfo_pkginfo_get_usr_pkginfo(pkgId.c_str(), getuid(), &pkginfo) != PMINFO_R_OK) {
    LOGE("Failed to get pkginfo");
    return;
  }

  picojson::object object;
  if (!ConvertToPackageToObject(pkginfo, object)) {
    LOGE("Failed to convert pkginfo to object");
    return;
  }

  result["result"] = picojson::value("OK");
  result["packageinfo"] = picojson::value(object);

  SendSyncReply(picojson::value(result).serialize().c_str());
  pkgmgrinfo_pkginfo_destroy_pkginfo(pkginfo);
}

void PackageManagerInstance::HandleGetPackageIdByAppId(const std::string& appid) {
  LOGD("Enter HandleGetPackageIdByAppId()");

  picojson::object result;
  picojson::array array;

  //int ret = check_privilege(PRIVILEGE_PACKAGE_MANAGER_INFO);

  if (strlen(appid.c_str()) <= 0) {
    LOGE("Wrong App ID");
    return;
  }

  pkgmgrinfo_appinfo_h appinfo;
  if (pkgmgrinfo_appinfo_get_usr_appinfo(appid.c_str(), getuid(), &appinfo) != PMINFO_R_OK) {
    LOGE("Failed to get appinfo");
    return;
  }

  char* packageId = NULL;
  if (pkgmgrinfo_appinfo_get_pkgname(appinfo, &packageId) != PMINFO_R_OK) {
    LOGE("Failed to get packageId");
    return;
  }

  result["result"] = picojson::value("OK");
  result["packageId"] = picojson::value(packageId);

  SendSyncReply(picojson::value(result).serialize().c_str());
  pkgmgrinfo_appinfo_destroy_appinfo(appinfo);
}

void PackageManagerInstance::HandlecomparePackageCertInfo(const std::string& lhsPkgId, const std::string& rhsPkgId) {

}

void PackageManagerInstance::HandlecompareAppCertInfo(const std::string& lhsAppId, const std::string& rhsAppId) {

}

void PackageManagerInstance::HandleIsPreloadPackageByAppId(const std::string& appId) {

}

void PackageManagerInstance::HandleGetPermissionType(const std::string& appId){

}

void PackageManagerInstance::HandleClearCacheDir() {

}

}  // namespace packagemanager

EXPORT_XWALK_EXTENSION(tizen_package_manager, packagemanager::PackageManagerExtension);
