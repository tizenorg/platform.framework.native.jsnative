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

  } else if (cmd == "getPackageSizeInfo") {

  } else if (cmd == "getTotalPackageSizeInfo") {

  } else if (cmd == "install") {

  } else if (cmd == "unistall") {

  } else if (cmd == "move") {

  } else if (cmd == "getAppIdsFromPackage") {

  } else if (cmd == "getCertInfo") {

  } else if (cmd == "getPrivilegeInfo") {

  } else if (cmd == "getPackageInfoFilter") {

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

  } else if (cmd == "getPackageInfo") {

  } else if (cmd == "comparePackageCertInfo") {

  } else if (cmd == "compareAppCertInfo") {

  } else if (cmd == "isPreloadPackageByAppId") {

  } else if (cmd == "getPermissionType") {

  } else if (cmd == "clearCacheDir") {

  } else if (cmd == "clearAllCacheDir") {

  } else if (cmd == "requestDrmGenerateLicense") {

  } else if (cmd == "registerDrmLicense") {

  } else if (cmd == "decryptDrmPackage") {

  } else if (cmd == "addBooleanFilter") {

  } else if (cmd == "countPackageFilter") {

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
