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
#include <package_info.h>
#include <pkgmgr-info.h>
#include <glib.h>
#include <vector>

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

//static GHashTable *__cb_table = NULL;

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
  auto found = request.find("asyncId");
  if (found == request.end()) {
    LOGE("asyncId was not existed");
    return;
  }

  auto cmd = request["cmd"].to_str();
  auto asyncId = request["asyncId"].to_str();
  if (cmd == "getPackagesInfo") {
    LOGD("Enter getPackagesInfo()");
    HandleGetPackagesInfo(asyncId);
  } else if (cmd == "getPackageSizeInfo") {
    LOGD("Enter getPackageSizeInfo()");
    std::string pkgId = request["packageId"].to_str();
    HandleGetPackageSizeInfo(asyncId, pkgId);
  } else if (cmd == "getAppIdsFromPackage") {
    LOGD("Enter getAppIdsFromPackage()");
    std::string pkgId = request["packageId"].to_str();
    std::string componentType = request["componentType"].to_str();
    HandleGetAppIdsFromPackage(asyncId, pkgId, componentType);
  } else if (cmd == "getCertInfo") {
    LOGD("Enter getCertInfo()");
    std::string pkgId = request["packageId"].to_str();
    HandleGetCertInfo(asyncId, pkgId);
  } else if (cmd == "getPrivilegeInfo") {
    LOGD("Enter getPrivilegeInfo()");
    std::string pkgId = request["packageId"].to_str();
    HandleGetPrivilegeInfo(asyncId, pkgId);
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
    std::string pkgId = request["packageId"].to_str();
    HandleClearCacheDir(pkgId);
  } else if (cmd == "event") {
      FireSimpleEvent("change", request["msg"].to_str());
  } else {
    LOGW("Ignoring message. It is not an object.");
    return;
  }
}

//bool PackageManagerInstance::ConvertToPackageToObject(const package_info_h info, picojson::object& result) {
bool PackageManagerInstance::ConvertToPackageToObject(const pkgmgrinfo_pkginfo_h info, picojson::object& result) {

  int ret = 0;

  char* package = NULL;
  //ret = package_info_get_package(info, &package);
  ret = pkgmgrinfo_pkginfo_get_pkgid(info, &package);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (package == NULL)) {
    LOGE("Failed to get package id");
    return false;
  }
  result["id"] = picojson::value(package);

  char* name = NULL;
  //ret = package_info_get_label(info, &name);
  ret = pkgmgrinfo_pkginfo_get_label(info, &name);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (name == NULL)) {
    LOGE("[%s] Failed to get package name", package);
    return false;
  }
  result["name"] = picojson::value(name);

  char* iconPath = NULL;
  //ret = package_info_get_icon(info, &iconPath);
  ret = pkgmgrinfo_pkginfo_get_icon(info, &iconPath);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (iconPath == NULL)) {
    LOGE("[%s] Failed to get package iconPath", package);
    return false;
  }
  result["iconPath"] = picojson::value(iconPath);

  char* version = NULL;
  //ret = package_info_get_version(info, &version);
  ret = pkgmgrinfo_pkginfo_get_version(info, &version);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (version == NULL)) {
    LOGE("[%s] Failed to get package version", package);
    return false;
  }
  result["version"] = picojson::value(version);

  char* type = NULL;
  //ret = package_info_get_type(info, &type);
  ret = pkgmgrinfo_pkginfo_get_type(info, &type);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (type == NULL)) {
    LOGE("[%s] Failed to get package type", package);
    return false;
  }
  result["type"] = picojson::value(type);

  const char* storage = NULL;
  //package_info_installed_storage_type_e value;
  pkgmgrinfo_installed_storage value;
  //ret = package_info_get_installed_storage(info, &value);
  ret = pkgmgrinfo_pkginfo_get_installed_storage(info, &value);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE)) {
    LOGE("[%s] Failed to get package storage", package);
    return false;
  }
  if (value == PACKAGE_INFO_INTERNAL_STORAGE)
    storage = "internal";
  else if (value == PACKAGE_INFO_EXTERNAL_STORAGE)
    storage = "external";
  result["installedStorage"] = picojson::value(storage);

  char* rootPath = NULL;
  //ret = package_info_get_root_path(info, &rootPath);
  ret = pkgmgrinfo_pkginfo_get_root_path(info, &rootPath);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (rootPath == NULL)) {
    LOGE("[%s] Failed to get package rootPath", package);
    return false;
  }
  result["rootPath"] = picojson::value(rootPath);

  bool isSystem = false;
  //ret = package_info_is_system_package(info, &isSystem);
  ret = pkgmgrinfo_pkginfo_is_system(info, &isSystem);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE)) {
    LOGE("[%s] Failed to get package system", package);
    return false;
  }
  result["isSystemPackage"] = picojson::value(isSystem);

  bool isRemovable = false;
  //ret = package_info_is_removable_package(info, &isRemovable);
  ret = pkgmgrinfo_pkginfo_is_removable(info, &isRemovable);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE)) {
    LOGE("[%s] Failed to get package removable", package);
    return false;
  }
  result["isRemovablePackage"] = picojson::value(isRemovable);

  bool isPreload = false;
  //ret = package_info_is_preload_package(info, &isPreload);
  ret = pkgmgrinfo_pkginfo_is_preload(info, &isPreload);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE)) {
    LOGE("[%s] Failed to get package preload", package);
    return false;
  }
  result["isPreloadPackage"] = picojson::value(isPreload);

  bool isAccessible = false;
  //ret = package_info_is_accessible(info, &isAccessible);
  ret = pkgmgrinfo_pkginfo_is_accessible(info, &isAccessible);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE)) {
    LOGE("[%s] Failed to get package accessible", package);
    return false;
  }
  result["isAccessible"] = picojson::value(isAccessible);

  return true;
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

//static bool package_manager_package_info_cb(const package_info_h info, void *userData) {
static int package_manager_package_info_cb(const pkgmgrinfo_pkginfo_h info, void *userData) {
  LOGD("Enter package_manager_package_info_cb()");
  picojson::array* arrayData = static_cast<picojson::array*>(userData);
  if (!arrayData) {
    LOGE("user_data is NULL");
    return PACKAGE_MANAGER_ERROR_INVALID_PARAMETER;
  }

  picojson::object object;
  if (PackageManagerInstance::ConvertToPackageToObject(info, object)) {  
    arrayData->push_back(picojson::value(object));
  }

  return PACKAGE_MANAGER_ERROR_NONE;
}

void PackageManagerInstance::HandleGetPackagesInfo(const std::string& asyncId) {
  LOGD("Enter HandleGetPackagesInfo()");

  picojson::object result;
  picojson::array array;
  result["asyncId"] = picojson::value(asyncId);

  //int ret = package_manager_foreach_package_info(package_manager_package_info_cb, &array);
  int ret = pkgmgrinfo_pkginfo_get_usr_list(package_manager_package_info_cb, &array, getuid());
  if (ret == 0) {
    result["packagesInfo"] = picojson::value(array);
  } else { 
    LOGE("Failed to get package information");
    ErrorHandle(ret, &result);
  }

  PostMessage(picojson::value(result).serialize().c_str());
}

static void package_manager_size_info_receive_cb(const char *packageId, const package_size_info_h sizeInfo, void *userData) {
  // ???
  LOGD("Enter package_manager_size_info_receive_cb()");
  LOGD("&&&&&&&&&&&&&&&&&&&&&&&&&&&&& packageId %s", packageId);
  LOGD("&&&&&&&&&&&&&&&&&&&&&&&&&&&&& sizeInfo.data_size %d", sizeInfo->data_size);

  picojson::object* object = static_cast<picojson::object*>(userData);
  if (!object) {
    LOGE("user_data is NULL");
    return;
  }

}

void PackageManagerInstance::HandleGetPackageSizeInfo(const std::string& asyncId, const std::string& pkgId) {
  LOGD("Enter HandleGetPackageSizeInfo()");

  picojson::object result;
  picojson::array array;
  result["asyncId"] = picojson::value(asyncId);

  if (strlen(pkgId.c_str()) <= 0) {
    LOGE("Wrong Package ID");
    return;
  }

  int ret = package_manager_get_package_size_info(pkgId.c_str(), package_manager_size_info_receive_cb, &array);
  if (ret == 0) {
    result["packageSizeInfo"] = picojson::value(array);
  } else { 
    LOGE("Failed to get package information");
    ErrorHandle(ret, &result);
  }

  PostMessage(picojson::value(result).serialize().c_str());
}

static bool package_info_app_cb(package_info_app_component_type_e comp_type, const char *app_id, void *user_data) {
  // ???

  return true;
}

void PackageManagerInstance::HandleGetAppIdsFromPackage(const std::string& asyncId, const std::string& pkgId, const std::string& componentType) {
  LOGD("Enter HandleGetAppIdsFromPackage()");

  picojson::object result;
  picojson::array array;
  result["asyncId"] = picojson::value(asyncId);

  if (strlen(pkgId.c_str()) <= 0) {
    LOGE("Wrong Package ID");
    return;
  }

  package_info_h packageinfo;
  if (package_info_create(pkgId.c_str(), &packageinfo) != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to create package info");
    return;
  }

  package_info_app_component_type_e compType;
  if (!strcmp(componentType.c_str(), "all-app")) {
    compType = PACKAGE_INFO_ALLAPP;
  } else if (!strcmp(componentType.c_str(), "ui-app")) {
    compType = PACKAGE_INFO_UIAPP;
  } else if (!strcmp(componentType.c_str(), "service-app")) {
    compType = PACKAGE_INFO_SERVICEAPP;
  } else {
    compType = PACKAGE_INFO_ALLAPP;
  }

  int ret = package_info_foreach_app_from_package(packageinfo, compType, package_info_app_cb, &array);
  if (ret != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to get pkginfo");
    ErrorHandle(ret, &result);
    package_info_destroy(packageinfo);
  } else {
    result["appIds"] = picojson::value(array);
  }

  PostMessage(picojson::value(result).serialize().c_str());
  package_info_destroy(packageinfo);
}

static bool package_info_cert_info_cb(package_info_h handle, package_cert_type_e cert_type, const char *cert_value, void *user_data) {
  // ???

  return true;
}

void PackageManagerInstance::HandleGetCertInfo(const std::string& asyncId, const std::string& pkgId) {
  LOGD("Enter HandleGetCertInfo()");

  picojson::object result;
  result["asyncId"] = picojson::value(asyncId);

  if (strlen(pkgId.c_str()) <= 0) {
    LOGE("Wrong Package ID");
    return;
  }

  const char *certValue = NULL;
  package_info_h packageinfo;
  if (package_info_create(pkgId.c_str(), &packageinfo) != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to create package info");
    return;
  }

  int ret = package_info_foreach_cert_info(packageinfo, package_info_cert_info_cb, &certValue);
  if (ret != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to get cert info");
    ErrorHandle(ret, &result);
    package_info_destroy(packageinfo);
  } else {
    result["certInfo"] = picojson::value(certValue);
  }

  PostMessage(picojson::value(result).serialize().c_str());
  package_info_destroy(packageinfo);
}

static bool package_info_privilege_info_cb(const char *privilegeName, void *userData) {
  // ???

  return true;
}

void PackageManagerInstance::HandleGetPrivilegeInfo(const std::string& asyncId, const std::string& pkgId) {
  LOGD("Enter HandleGetPrivilegeInfo()");

  picojson::object result;
  result["asyncId"] = picojson::value(asyncId);

  if (strlen(pkgId.c_str()) <= 0) {
    LOGE("Wrong Package ID");
    return;
  }

  const char *privilegeName = NULL;
  package_info_h packageinfo;
  if (package_info_create(pkgId.c_str(), &packageinfo) != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to create package info");
    return;
  }

  int ret = package_info_foreach_privilege_info(packageinfo, package_info_privilege_info_cb, &privilegeName);
  if (ret != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to get pkginfo");
    ErrorHandle(ret, &result);
    package_info_destroy(packageinfo);
  } else {
    result["privilegeInfo"] = picojson::value(privilegeName);
  }

  PostMessage(picojson::value(result).serialize().c_str());
  package_info_destroy(packageinfo);
}


// sync handle
void PackageManagerInstance::HandleGetPackageInfo(const std::string& pkgId) {
  LOGD("Enter HandleGetPackageInfo()");

  picojson::object result;

  if (strlen(pkgId.c_str()) <= 0) {
    LOGE("Wrong Package ID");
    return;
  }

  /*package_info_h packageinfo;
  if (package_info_create(pkgId.c_str(), &packageinfo) != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to create package info");
    return;
  }*/

  pkgmgrinfo_pkginfo_h packageinfo;
  if (pkgmgrinfo_pkginfo_get_usr_pkginfo(pkgId.c_str(), getuid(), &packageinfo) != PMINFO_R_OK) {
    LOGE("Failed to get pkginfo");
    return;
  }

  picojson::object object;
  if (!ConvertToPackageToObject(packageinfo, object)) {
    LOGE("Failed to convert pkginfo to object");
    //package_info_destroy(packageinfo);
    return;
  }

  result["result"] = picojson::value("OK");
  result["packageinfo"] = picojson::value(object);

  SendSyncReply(picojson::value(result).serialize().c_str());
  //package_info_destroy(packageinfo);
  pkgmgrinfo_pkginfo_destroy_pkginfo(packageinfo);
}

void PackageManagerInstance::HandleGetPackageIdByAppId(const std::string& appId) {
  LOGD("Enter HandleGetPackageIdByAppId()");

  picojson::object result;

  if (strlen(appId.c_str()) <= 0) {
    LOGE("Wrong App ID");
    return;
  }

  char* packageId = NULL;
  if (package_manager_get_package_id_by_app_id(appId.c_str(), &packageId) != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to get appinfo");
    return;
  }

  result["result"] = picojson::value("OK");
  result["packageId"] = picojson::value(packageId);

  SendSyncReply(picojson::value(result).serialize().c_str());
}

void PackageManagerInstance::HandlecomparePackageCertInfo(const std::string& lhsPkgId, const std::string& rhsPkgId) {
  LOGD("Enter HandlecomparePackageCertInfo()");

  picojson::object result;

  if (strlen(lhsPkgId.c_str()) <= 0 || strlen(rhsPkgId.c_str()) <= 0) {
    LOGE("Wrong Package ID");
    return;
  }

  package_manager_compare_result_type_e compare;
  if (package_manager_compare_package_cert_info(lhsPkgId.c_str(), rhsPkgId.c_str(), &compare) != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to compare package cert info");
    return;
  }

  const char* compareResult = NULL;
  switch (compare) {
    case 0:
        compareResult = "MATCH";
      break;
    case 1:
        compareResult = "MISMATCH";
      break;
    case 2:
        compareResult = "LHS-NO-CERT";
      break;
    case 3:
        compareResult = "RHS-NO-CERT";
      break;
    case 4:
        compareResult = "BOTH-NO-CERT";
      break;
    default:
        compareResult = "MATCH";
  }

  result["result"] = picojson::value("OK");
  result["compareResult"] = picojson::value(compareResult);

  SendSyncReply(picojson::value(result).serialize().c_str());
}

void PackageManagerInstance::HandlecompareAppCertInfo(const std::string& lhsAppId, const std::string& rhsAppId) {
  LOGD("Enter HandlecompareAppCertInfo()");

  picojson::object result;

  if (strlen(lhsAppId.c_str()) <= 0 || strlen(rhsAppId.c_str()) <= 0) {
    LOGE("Wrong Package ID");
    return;
  }

  package_manager_compare_result_type_e compare;
  if (package_manager_compare_app_cert_info(lhsAppId.c_str(), rhsAppId.c_str(), &compare) != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to compare app cert info");
    return;
  }

  const char* compareResult = NULL;
  switch (compare) {
    case 0:
        compareResult = "MATCH";
      break;
    case 1:
        compareResult = "MISMATCH";
      break;
    case 2:
        compareResult = "LHS-NO-CERT";
      break;
    case 3:
        compareResult = "RHS-NO-CERT";
      break;
    case 4:
        compareResult = "BOTH-NO-CERT";
      break;
    default:
        compareResult = "MATCH";
  }

  result["result"] = picojson::value("OK");
  result["compareResult"] = picojson::value(compareResult);

  SendSyncReply(picojson::value(result).serialize().c_str());
}

void PackageManagerInstance::HandleIsPreloadPackageByAppId(const std::string& appId) {
  LOGD("Enter HandleIsPreloadPackageByAppId()");
    
  picojson::object result;

  if (strlen(appId.c_str()) <= 0) {
    LOGE("Wrong App ID");
    return;
  }

  bool isPreload = false;
  if (package_manager_is_preload_package_by_app_id(appId.c_str(), &isPreload) != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to get package preload");
    return;
  }

  result["result"] = picojson::value("OK");
  result["isPreload"] = picojson::value(isPreload);

  SendSyncReply(picojson::value(result).serialize().c_str());
}

void PackageManagerInstance::HandleGetPermissionType(const std::string& appId){
  LOGD("Enter HandleGetPermissionType()");
    
  picojson::object result;

  if (strlen(appId.c_str()) <= 0) {
    LOGE("Wrong App ID");
    return;
  }

  package_manager_permission_type_e permission;
  if (package_manager_get_permission_type(appId.c_str(), &permission) != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to get appinfo");
    return;
  }

  const char* permissionType = NULL;
  switch (permission) {
    case 0:
      permissionType = "NORMAL";
      break;
    case 1:
      permissionType = "SIGNATURE";
      break;
    case 2:
      permissionType = "PRIVILEGE";
      break;
    default:
      permissionType = "NORMAL";
  }

  result["result"] = picojson::value("OK");
  result["permissionType"] = picojson::value(permissionType);

  SendSyncReply(picojson::value(result).serialize().c_str());
}

void PackageManagerInstance::HandleClearCacheDir(const std::string& pkgId) {
  LOGD("Enter HandleClearCacheDir()");
    
  if (strlen(pkgId.c_str()) <= 0) {
    LOGE("Wrong Package ID");
    return;
  }

  if (package_manager_clear_cache_dir(pkgId.c_str()) != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to clear cache dir");
    return;
  }
  SendSyncReply("{}");
}

}  // namespace packagemanager

EXPORT_XWALK_EXTENSION(tizen_package_manager, packagemanager::PackageManagerExtension);
