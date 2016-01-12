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

#include "tizen_package_manager_extension.h"

#include <dlog.h>

#include "picojson.h"

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace packagemanager {

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
    LOGD("Enter getPackagesInfo()");

  } else if (cmd == "getPackageSizeInfo") {
    LOGD("Enter getPackageSizeInfo()");

  } else if (cmd == "getTotalPackageSizeInfo") {
    LOGD("Enter getTotalPackageSizeInfo()");

  } else if (cmd == "install") {
    LOGD("Enter install()");

  } else if (cmd == "uninstall") {
    LOGD("Enter uninstall()");

  } else if (cmd == "move") {
    LOGD("Enter move()");

  } else if (cmd == "getAppIdsFromPackage") {
    LOGD("Enter getAppIdsFromPackage()");

  } else if (cmd == "getCertInfo") {
    LOGD("Enter getCertInfo()");

  } else if (cmd == "getPrivilegeInfo") {
    LOGD("Enter getPrivilegeInfo()");

  } else if (cmd == "getPackageInfoFilter") {
    LOGD("Enter getPackageInfoFilter()");

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

  std::string cmd = value.get("cmd").to_str();
  picojson::object result;
  if (cmd == "getPackageIdByAppId") {
    LOGD("Enter getPackageIdByAppId()");

  } else if (cmd == "getPackageInfo") {
    LOGD("Enter getPackageInfo()");

  } else if (cmd == "comparePackageCertInfo") {
    LOGD("Enter comparePackageCertInfo()");

  } else if (cmd == "compareAppCertInfo") {
    LOGD("Enter compareAppCertInfo()");

  } else if (cmd == "isPreloadPackageByAppId") {
    LOGD("Enter isPreloadPackageByAppId()");

  } else if (cmd == "getPermissionType") {
    LOGD("Enter getPermissionType()");

  } else if (cmd == "clearCacheDir") {
    LOGD("Enter clearCacheDir()");

  } else if (cmd == "clearAllCacheDir") {
    LOGD("Enter clearAllCacheDir()");

  } else if (cmd == "requestDrmGenerateLicense") {
    LOGD("Enter requestDrmGenerateLicense()");

  } else if (cmd == "registerDrmLicense") {
    LOGD("Enter registerDrmLicense()");

  } else if (cmd == "decryptDrmPackage") {
    LOGD("Enter decryptDrmPackage()");

  } else if (cmd == "addBooleanFilter") {
    LOGD("Enter addBooleanFilter()");

  } else if (cmd == "countPackageFilter") {
    LOGD("Enter countPackageFilter()");

  } else {
    LOGW("Ignoring message. It is not an object.");
    return;
  }
  SendSyncReply(picojson::value(result).serialize().c_str());
}

void PackageManagerInstance::FireSimpleEvent(const std::string& event,
                                             const std::string& data) {
  picojson::value::object obj;
  obj["event"] = picojson::value(event);
  if (data.length() > 0) {
    obj["data"] = picojson::value(data);
  }
  PostMessage(picojson::value(obj).serialize().c_str());
}

}  // namespace packagemanager

EXPORT_XWALK_EXTENSION(tizen_package_manager, packagemanager::PackageManagerExtension);
