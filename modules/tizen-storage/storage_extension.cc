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

#include "storage_extension.h"
#include "picojson.h"
#include <dlog.h>
#include <storage.h>
#include <string>

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace storage {

xwalk::XWalkExtensionInstance* StorageExtension::CreateInstance() {
  return new StorageInstance();
}

void StorageInstance::Initialize() {
  LOGD("Created tizen-storage instance");
}

void StorageInstance::FireSimpleEvent(const std::string& event, picojson::object object) {
  object["event"] = picojson::value(event);
  PostMessage(picojson::value(object).serialize().c_str());
}

static void CallbackOnChange(int storage_id, storage_state_e state, void* user_data) {
  std::string change;
  if (state == STORAGE_STATE_UNMOUNTABLE) change = "unmountable";
  else if (state == STORAGE_STATE_REMOVED) change = "removed";
  else if (state == STORAGE_STATE_MOUNTED) change = "mounted";
  else if (state == STORAGE_STATE_MOUNTED_READ_ONLY) change = "mounted_read_only";

  picojson::object* obj = static_cast<picojson::object*>(user_data);
  picojson::object object = picojson::value(*obj).get<picojson::object>();
  object["state"] = picojson::value(change);

  StorageInstance* instance = StorageInstance::getInstance();
  instance->FireSimpleEvent("change", object);
}

static bool CallbackGetStorages(int storage_id, storage_type_e type, storage_state_e state,
                                const char *path, void *user_data) {
  picojson::object object;
  object["id"] = picojson::value(std::to_string(storage_id).c_str());
  if (type == STORAGE_TYPE_INTERNAL) object["type"] = picojson::value("internal");
  else if (type == STORAGE_TYPE_INTERNAL) object["type"] = picojson::value("external");
  if (state == STORAGE_STATE_UNMOUNTABLE) object["state"] = picojson::value("unmountable");
  else if (state == STORAGE_STATE_REMOVED) object["state"] = picojson::value("removed");
  else if (state == STORAGE_STATE_MOUNTED) object["state"] = picojson::value("mounted");
  else if (state == STORAGE_STATE_MOUNTED_READ_ONLY) object["state"] = picojson::value("mounted_read_only");
  object["path"] = picojson::value(path);

  int ret = 0;
  unsigned long long total, available;
  ret = storage_get_total_space(storage_id, &total);
  if (ret == 0) object["totalSpace"] = picojson::value(std::to_string(total).c_str());
  ret = storage_get_available_space (storage_id, &available);
  if (ret == 0) object["availableSpace"] = picojson::value(std::to_string(available).c_str());

  ret = storage_set_state_changed_cb(storage_id, CallbackOnChange, &object);

  picojson::array* array = static_cast<picojson::array*>(user_data);
  array->push_back(picojson::value(object));

  return true;
}

void StorageInstance::HandleGetStorages(const std::string& asyncid) {
  picojson::object result;
  picojson::array array;
  result["asyncid"] = picojson::value(asyncid);
  result["storages"] = picojson::value(array);

  int ret = 0;
  ret = storage_foreach_device_supported(CallbackGetStorages, &array); //sync
  if (ret == 0) result["storages"] = picojson::value(array);

  PostMessage(picojson::value(result).serialize().c_str());
}

void StorageInstance::HandleGetDirectory(const std::string& asyncid, const int id, const std::string& type) {
  picojson::object result;
  picojson::array array;
  result["asyncid"] = picojson::value(asyncid);

  int ret = 0;
  char* path;
  if (type == "images") ret = storage_get_directory(id, STORAGE_DIRECTORY_IMAGES, &path);
  else if (type == "sounds") ret = storage_get_directory(id, STORAGE_DIRECTORY_SOUNDS, &path);
  else if (type == "videos") ret = storage_get_directory(id, STORAGE_DIRECTORY_VIDEOS, &path);
  else if (type == "camera") ret = storage_get_directory(id, STORAGE_DIRECTORY_CAMERA, &path);
  else if (type == "downloads") ret = storage_get_directory(id, STORAGE_DIRECTORY_DOWNLOADS, &path);
  else if (type == "music") ret = storage_get_directory(id, STORAGE_DIRECTORY_MUSIC, &path);
  else if (type == "documents") ret = storage_get_directory(id, STORAGE_DIRECTORY_DOCUMENTS, &path);
  else if (type == "others") ret = storage_get_directory(id, STORAGE_DIRECTORY_OTHERS, &path);
  else if (type == "system_ringtones") ret = storage_get_directory(id, STORAGE_DIRECTORY_SYSTEM_RINGTONES, &path);
  if (ret == 0) {
    result["dir"] = picojson::value(path);
  }

  PostMessage(picojson::value(result).serialize().c_str());
}

void StorageInstance::HandleMessage(const char* msg) {
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

  if (cmd == "getStorages") {
    HandleGetStorages(request["asyncid"].to_str());
  }
  else if (cmd == "getDirectory") {
    int id = std::atoi(request["id"].to_str().c_str());
    std::string type = request["type"].to_str();
    HandleGetDirectory(request["asyncid"].to_str(), id, type);
  }
  else {
    LOGW("Ignoring unknown message.");
    return;
  }
}

}  // namespace storage

EXPORT_XWALK_EXTENSION(tizen_storage, storage::StorageExtension);
