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
#include <package_manager.h>
#include <package_info.h>

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

PackageManagerInstance::PackageManagerInstance() {}

PackageManagerInstance::~PackageManagerInstance() {}


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
  if (cmd == "getPackage") {
    LOGD("Enter getPackage()");
    std::string pkgId = request["packageId"].to_str();
    HandleGetPackage(asyncId, pkgId);
  } else if (cmd == "getPackages") {
    LOGD("Enter getPackages()");
    picojson::value filterObject;
    auto filter = request.find("filter");
    if (filter != request.end()) {
      filterObject = filter->second;
    }
    HandleGetPackages(asyncId, filterObject);
  } else if (cmd == "getPackageSize") {
    LOGD("Enter getPackageSize()");
    std::string pkgId = request["packageId"].to_str();
    HandleGetPackageSize(asyncId, pkgId);
  } else {
    LOGW("Ignoring message. It is not an object.");
    return;
  }
}

static bool package_info_app_cb(package_info_app_component_type_e comp_type, const char *appId, void *userData) {
  LOGD("Enter package_info_app_cb()");

  picojson::array* arrayData = static_cast<picojson::array*>(userData);
  if (!arrayData) {
    LOGE("userData is NULL");
    return false;
  }

  arrayData->push_back(picojson::value(appId));

  return true;
}

static bool package_info_privilege_info_cb(const char *privilegeName, void *userData) {
  LOGD("Enter package_info_privilege_info_cb()");

  picojson::array* arrayData = static_cast<picojson::array*>(userData);
  if (!arrayData) {
    LOGE("userData is NULL");
    return false;
  }

  arrayData->push_back(picojson::value(privilegeName));

  return true;
}

bool PackageManagerInstance::ConvertToPackageToObject(const package_info_h info, picojson::object& result) {

  int ret = 0;

  char* package = NULL;
  ret = package_info_get_package(info, &package);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (package == NULL)) {
    LOGE("Failed to get package id");
    return false;
  }
  result["id"] = picojson::value(package);

  char* label = NULL;
  ret = package_info_get_label(info, &label);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (label == NULL)) {
    LOGE("[%s] Failed to get package label", package);
    return false;
  }
  result["label"] = picojson::value(label);

  char* iconPath = NULL;
  ret = package_info_get_icon(info, &iconPath);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (iconPath == NULL)) {
    LOGE("[%s] Failed to get package iconPath", package);
    return false;
  }
  result["iconPath"] = picojson::value(iconPath);

  char* version = NULL;
  ret = package_info_get_version(info, &version);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (version == NULL)) {
    LOGE("[%s] Failed to get package version", package);
    return false;
  }
  result["version"] = picojson::value(version);

  char* type = NULL;
  ret = package_info_get_type(info, &type);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (type == NULL)) {
    LOGE("[%s] Failed to get package type", package);
    return false;
  }
  result["type"] = picojson::value(type);

  const char* storage = NULL;
  package_info_installed_storage_type_e value;
  ret = package_info_get_installed_storage(info, &value);
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
  if ((ret != PACKAGE_MANAGER_ERROR_NONE) || (rootPath == NULL)) {
    LOGE("[%s] Failed to get package rootPath", package);
    return false;
  }
  result["rootPath"] = picojson::value(rootPath);

  bool system = false;
  ret = package_info_is_system_package(info, &system);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE)) {
    LOGE("[%s] Failed to get system package", package);
    return false;
  }
  result["systemPackage"] = picojson::value(system);

  bool removable = false;
  ret = package_info_is_removable_package(info, &removable);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE)) {
    LOGE("[%s] Failed to get package removable", package);
    return false;
  }
  result["removable"] = picojson::value(removable);

  bool preloaded = false;
  ret = package_info_is_preload_package(info, &preloaded);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE)) {
    LOGE("[%s] Failed to get package preload", package);
    return false;
  }
  result["preloaded"] = picojson::value(preloaded);

  bool accessible = false;
  ret = package_info_is_accessible(info, &accessible);
  if ((ret != PACKAGE_MANAGER_ERROR_NONE)) {
    LOGE("[%s] Failed to get package accessible", package);
    return false;
  }
  result["accessible"] = picojson::value(accessible);

  picojson::array arrayAppIds;
  ret = package_info_foreach_app_from_package(info, PACKAGE_INFO_ALLAPP,
                                              package_info_app_cb, &arrayAppIds);
  if (ret != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("[%s] Failed to get app ids", package);
    return false;
  }
  result["appIds"] = picojson::value(arrayAppIds);

  picojson::array arrayPrivilege;
  ret = package_info_foreach_privilege_info(info, package_info_privilege_info_cb, &arrayPrivilege);
  if (ret != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("%s] Failed to get privilege", package);
    return false;
  }
  result["privileges"] = picojson::value(arrayPrivilege);

  return true;
}

void PackageManagerInstance::HandleGetPackage(const std::string& asyncId, const std::string& pkgId) {
  LOGD("Enter HandleGetPackage()");

  picojson::object result;
  result["asyncId"] = picojson::value(asyncId);

  if (strlen(pkgId.c_str()) <= 0) {
    LOGE("Wrong Package ID");
    return;
  }

  package_info_h packageinfo;
  int ret = package_info_create(pkgId.c_str(), &packageinfo);
  if (ret != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to create package info");
    ErrorHandle(ret, &result);
  }

  picojson::object object;
  if (!ConvertToPackageToObject(packageinfo, object)) {
    LOGE("Failed to convert pkginfo to object");
    ErrorHandle(ret, &result);
  } else {
    result["package"] = picojson::value(object);
  }

  LOGD("@@@@@@@@@@@@@@@@@@@@@@@@@%s", picojson::value(result).serialize().c_str());
  PostMessage(picojson::value(result).serialize().c_str());
  package_info_destroy(packageinfo);
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

void PackageManagerInstance::HandleGetPackages(const std::string& asyncId, const picojson::value& filter) {
  LOGD("Enter HandleGetPackages()");

  picojson::object result;
  picojson::array array;
  result["asyncId"] = picojson::value(asyncId);

  package_manager_filter_h filter_h = nullptr;
  if (!filter.is<picojson::null>()) {
    int ret = package_manager_filter_create(&filter_h);
    if (ret != PACKAGE_MANAGER_ERROR_NONE) {
      LOGE("Failed to filter create");
      ErrorHandle(ret, &result);
    }


    auto keys = filter.get<picojson::object>();
    for (auto& item : keys) {
      auto key = item.first;
      const bool value = keys[key].get<bool>();
      const char* property = key.c_str();
      int ret = package_manager_filter_add_bool(filter_h, property, value);
      if (ret != PACKAGE_MANAGER_ERROR_NONE) {
        LOGE("Failed package_manager_filter_add_bool");
        ErrorHandle(ret, &result);
      }
    }
  }

  if (filter_h != nullptr) {
    int ret = package_manager_filter_foreach_package_info(filter_h, package_manager_package_info_cb, &array);
    if (ret != PACKAGE_MANAGER_ERROR_NONE) {
      LOGE("Failed to get filter package information");
      ErrorHandle(ret, &result);
    } else {
      result["packages"] = picojson::value(array);
    }
  } else {
    int ret = package_manager_foreach_package_info(package_manager_package_info_cb, &array);
    if (ret != PACKAGE_MANAGER_ERROR_NONE) {
      LOGE("Failed to get package information");
      ErrorHandle(ret, &result);
    } else {
      result["packages"] = picojson::value(array);
    }
  }

  PostMessage(picojson::value(result).serialize().c_str());
}

struct CallbackData {
  PackageManagerInstance* self;
  picojson::object result;
};

static void package_manager_size_info_receive_cb(const char* packageId, const package_size_info_h sizeInfo, void* userData) {
  LOGD("Enter package_manager_size_info_receive_cb()");

  CallbackData* data = static_cast<CallbackData*>(userData);

  picojson::object object;
  object["packageId"] = picojson::value(packageId);
  object["data"] = picojson::value(std::to_string(sizeInfo->data_size).c_str());
  object["cache"] = picojson::value(std::to_string(sizeInfo->cache_size).c_str());
  object["app"] = picojson::value(std::to_string(sizeInfo->app_size).c_str());
  object["externalData"] = picojson::value(std::to_string(sizeInfo->external_data_size).c_str());
  object["externalCache"] = picojson::value(std::to_string(sizeInfo->external_cache_size).c_str());
  object["externalApp"] = picojson::value(std::to_string(sizeInfo->external_app_size).c_str());

  data->result["packageSize"] = picojson::value(object);

  data->self->PostMessage(picojson::value(data->result).serialize().c_str());
}

void PackageManagerInstance::HandleGetPackageSize(const std::string& asyncId, const std::string& pkgId) {
  LOGD("Enter HandleGetPackageSize()");

  CallbackData* data = new CallbackData();
  data->self = this;
  data->result["asyncId"] = picojson::value(asyncId);

  if (strlen(pkgId.c_str()) <= 0) {
    LOGE("Wrong Package ID");
    return;
  }

  int ret = package_manager_get_package_size_info(pkgId.c_str(), package_manager_size_info_receive_cb, data);
  if (ret != PACKAGE_MANAGER_ERROR_NONE) {
    LOGE("Failed to get package size info");
    ErrorHandle(ret, &data->result);
  }
}

}  // namespace packagemanager

EXPORT_XWALK_EXTENSION(tizen_package_manager, packagemanager::PackageManagerExtension);
