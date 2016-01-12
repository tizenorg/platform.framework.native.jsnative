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
#include <thread>
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
  if (cmd == "getPackages") {
    LOGD("Enter getPackages()");
    std::string filter = request["filter"].to_str();
    HandleGetPackages(asyncId, filter);
  } else if (cmd == "getPackageSize") {
    LOGD("Enter getPackageSize()");
    std::string pkgId = request["packageId"].to_str();
    HandleGetPackageSize(asyncId, pkgId);
  } else if (cmd == "appsId") {
    LOGD("Enter appsId()");
    std::string pkgId = request["packageId"].to_str();
    std::string componentType = request["componentType"].to_str();
    HandleAppsId(asyncId, pkgId, componentType);
  } else if (cmd == "privileges") {
    LOGD("Enter privileges()");
    std::string pkgId = request["packageId"].to_str();
    HandlePrivileges(asyncId, pkgId);
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
  if (cmd == "getPackage") {
    LOGD("Enter getPackage()");
    std::string pkgId = request["packageId"].to_str();
    HandleGetPackage(pkgId);
  } else if (cmd == "event") {
      FireSimpleEvent("change", request["msg"].to_str());
  } else {
    LOGW("Ignoring message. It is not an object.");
    return;
  }
}

bool PackageManagerInstance::ConvertToPackageToObject(const package_info_h info, picojson::object& result) {

  int ret = 0;

  char* package = NULL;
  ret = package_info_get_package(info, &package);
  //ret = pkgmgrinfo_pkginfo_get_pkgid(info, &package);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (package == NULL)) {
    LOGE("Failed to get package id");
    return false;
  }
  result["id"] = picojson::value(package);

  char* label = NULL;
  ret = package_info_get_label(info, &label);
  //ret = pkgmgrinfo_pkginfo_get_label(info, &label);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (label == NULL)) {
    LOGE("[%s] Failed to get package label", package);
    return false;
  }
  result["label"] = picojson::value(label);

  char* iconPath = NULL;
  ret = package_info_get_icon(info, &iconPath);
  //ret = pkgmgrinfo_pkginfo_get_icon(info, &iconPath);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (iconPath == NULL)) {
    LOGE("[%s] Failed to get package iconPath", package);
    return false;
  }
  result["iconPath"] = picojson::value(iconPath);

  char* version = NULL;
  ret = package_info_get_version(info, &version);
  //ret = pkgmgrinfo_pkginfo_get_version(info, &version);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (version == NULL)) {
    LOGE("[%s] Failed to get package version", package);
    return false;
  }
  result["version"] = picojson::value(version);

  char* type = NULL;
  ret = package_info_get_type(info, &type);
  //ret = pkgmgrinfo_pkginfo_get_type(info, &type);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (type == NULL)) {
    LOGE("[%s] Failed to get package type", package);
    return false;
  }
  result["type"] = picojson::value(type);

  const char* storage = NULL;
  package_info_installed_storage_type_e value;
  //pkgmgrinfo_installed_storage value;
  ret = package_info_get_installed_storage(info, &value);
  //ret = pkgmgrinfo_pkginfo_get_installed_storage(info, &value);
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
  ret = package_info_get_root_path(info, &rootPath);
  //ret = pkgmgrinfo_pkginfo_get_root_path(info, &rootPath);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (rootPath == NULL)) {
    LOGE("[%s] Failed to get package rootPath", package);
    return false;
  }
  result["rootPath"] = picojson::value(rootPath);

  bool system = false;
  ret = package_info_is_system_package(info, &system);
  //ret = pkgmgrinfo_pkginfo_is_system(info, &system);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE)) {
    LOGE("[%s] Failed to get system package", package);
    return false;
  }
  result["systemPackage"] = picojson::value(system);

  bool removable = false;
  ret = package_info_is_removable_package(info, &removable);
  //ret = pkgmgrinfo_pkginfo_is_removable(info, &removable);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE)) {
    LOGE("[%s] Failed to get package removable", package);
    return false;
  }
  result["removable"] = picojson::value(removable);

  bool preloaded = false;
  ret = package_info_is_preload_package(info, &preloaded);
  //ret = pkgmgrinfo_pkginfo_is_preload(info, &preloaded);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE)) {
    LOGE("[%s] Failed to get package preload", package);
    return false;
  }
  result["preloaded"] = picojson::value(preloaded);

  bool accessible = false;
  ret = package_info_is_accessible(info, &accessible);
  //ret = pkgmgrinfo_pkginfo_is_accessible(info, &accessible);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE)) {
    LOGE("[%s] Failed to get package accessible", package);
    return false;
  }
  result["accessible"] = picojson::value(accessible);

  return true;
}

// sync handle
void PackageManagerInstance::HandleGetPackage(const std::string& pkgId) {
  LOGD("Enter HandleGetPackage()");

  picojson::object result;

  if (strlen(pkgId.c_str()) <= 0) {
    LOGE("Wrong Package ID");
    return;
  }

  package_info_h packageinfo;
  if (package_info_create(pkgId.c_str(), &packageinfo) != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to create package info");
    return;
  }

  picojson::object object;
  if (!ConvertToPackageToObject(packageinfo, object)) {
    LOGE("Failed to convert pkginfo to object");
    return;
  }

  result["result"] = picojson::value("OK");
  result["package"] = picojson::value(object);

  SendSyncReply(picojson::value(result).serialize().c_str());
  package_info_destroy(packageinfo);
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

static bool package_manager_package_info_cb(const package_info_h info, void* userData) {
  LOGD("Enter package_manager_package_info_cb()");
  picojson::array* arrayData = static_cast<picojson::array*>(userData);
  if (!arrayData) {
    LOGE("userData is NULL");
    return false;
  }

  picojson::object object;
  if (PackageManagerInstance::ConvertToPackageToObject(info, object)) {  
    arrayData->push_back(picojson::value(object));
  }

  return true;
}

void PackageManagerInstance::HandleGetPackages(const std::string& asyncId, const std::string& filter) {
  LOGD("Enter HandleGetPackages()");

  picojson::object result;
  picojson::array array;
  result["asyncId"] = picojson::value(asyncId);

  //int ret = pkgmgrinfo_pkginfo_get_usr_list(package_manager_package_info_cb, &array, getuid());
  int ret = package_manager_foreach_package_info(package_manager_package_info_cb, &array);
  if (ret != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to get package information");
    ErrorHandle(ret, &result);
  } else { 
    result["packages"] = picojson::value(array);
  }

  PostMessage(picojson::value(result).serialize().c_str());
}

static void package_manager_size_info_receive_cb(const char* packageId, const package_size_info_h sizeInfo, void* userData) {
  // ???
  LOGD("Enter package_manager_size_info_receive_cb()");
  LOGD("&&&&&&&&&&&&&&&&&&&&&&&&&&&&& packageId %s", packageId);
  LOGD("&&&&&&&&&&&&&&&&&&&&&&&&&&&&& sizeInfo.data_size %lld", sizeInfo->data_size);
  LOGD("&&&&&&&&&&&&&&&&&&&&&&&&&&&&& sizeInfo.cache_size %lld", sizeInfo->cache_size);
  LOGD("&&&&&&&&&&&&&&&&&&&&&&&&&&&&& sizeInfo.app_size %lld", sizeInfo->app_size);
  LOGD("&&&&&&&&&&&&&&&&&&&&&&&&&&&&& sizeInfo.ext_data_size %lld", sizeInfo->external_data_size);
  LOGD("&&&&&&&&&&&&&&&&&&&&&&&&&&&&& sizeInfo.ext_cache_size %lld", sizeInfo->external_cache_size);
  LOGD("&&&&&&&&&&&&&&&&&&&&&&&&&&&&& sizeInfo.ext_app_size %lld", sizeInfo->external_app_size);

  picojson::array* arrayData = static_cast<picojson::array*>(userData);
  if (!arrayData) {
    LOGE("userData is NULL");
  }

  picojson::object object;
  object["packageId"] = picojson::value(packageId);
  object["data"] = picojson::value(std::to_string(sizeInfo->data_size).c_str());
  object["cache"] = picojson::value(std::to_string(sizeInfo->cache_size).c_str());
  object["app"] = picojson::value(std::to_string(sizeInfo->app_size).c_str());
  object["extData"] = picojson::value(std::to_string(sizeInfo->external_data_size).c_str());
  object["extCache"] = picojson::value(std::to_string(sizeInfo->external_cache_size).c_str());
  object["extApp"] = picojson::value(std::to_string(sizeInfo->external_app_size).c_str());
  arrayData->push_back(picojson::value(object));

  std::string str = picojson::value(object).serialize();
  LOGD("??????????????????????????????? 0 %s", str.c_str());
}

void PackageManagerInstance::HandleGetPackageSize(const std::string& asyncId, const std::string& pkgId) {
  LOGD("Enter HandleGetPackageSize()");

  picojson::object result;
  picojson::array array;
  result["asyncId"] = picojson::value(asyncId);

  if (strlen(pkgId.c_str()) <= 0) {
    LOGE("Wrong Package ID");
    return;
  }

  int ret = package_manager_get_package_size_info(pkgId.c_str(), package_manager_size_info_receive_cb, &array);
  if (ret != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to get package information");
    ErrorHandle(ret, &result);
  } else {
    result["packageSize"] = picojson::value(array);
  }

  std::string str1 = picojson::value(array).serialize();
  LOGD("??????????????????????????????? 1 %s", str1.c_str());

  
  std::string str2 = picojson::value(result).serialize();
  LOGD("??????????????????????????????? 2 %s", str2.c_str());

  PostMessage(picojson::value(result).serialize().c_str());
}

static bool package_info_app_cb(package_info_app_component_type_e comp_type, const char *appId, void *userData) {
  LOGD("Enter package_info_app_cb()");

  picojson::array* arrayData = static_cast<picojson::array*>(userData);
  if (!arrayData) {
    LOGE("userData is NULL");
    return false;
  }

  picojson::object object;
  object["appId"] = picojson::value(appId);
  arrayData->push_back(picojson::value(object));

  return true;
}

void PackageManagerInstance::HandleAppsId(const std::string& asyncId, const std::string& pkgId, const std::string& componentType) {
  LOGD("Enter HandleAppsId()");

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
  } else {
    result["apps"] = picojson::value(array);
  }

  PostMessage(picojson::value(result).serialize().c_str());
  package_info_destroy(packageinfo);
}

static bool package_info_privilege_info_cb(const char *privilegeName, void *userData) {
  LOGD("Enter package_info_privilege_info_cb()");

  picojson::array* arrayData = static_cast<picojson::array*>(userData);
  if (!arrayData) {
    LOGE("userData is NULL");
    return false;
  }
  
  picojson::object object;
  object["name"] = picojson::value(privilegeName);
  arrayData->push_back(picojson::value(object));

  return true;
}

void PackageManagerInstance::HandlePrivileges(const std::string& asyncId, const std::string& pkgId) {
  LOGD("Enter HandlePrivileges()");

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

  int ret = package_info_foreach_privilege_info(packageinfo, package_info_privilege_info_cb, &array);
  if (ret != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to get pkginfo");
    ErrorHandle(ret, &result);
  } else {
    result["privileges"] = picojson::value(array);
  }

  PostMessage(picojson::value(result).serialize().c_str());
  package_info_destroy(packageinfo);
}

}  // namespace packagemanager

EXPORT_XWALK_EXTENSION(tizen_package_manager, packagemanager::PackageManagerExtension);
