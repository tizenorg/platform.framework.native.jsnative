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

struct CallbackData {
  StorageInstance* self;
  picojson::object result;
  picojson::object object;
  picojson::array array;
};

static void CallbackOnChange(int storage_id, storage_state_e state, void* user_data) {

  CallbackData* data = static_cast<CallbackData*>(user_data);

  std::string change;
  if (state == STORAGE_STATE_UNMOUNTABLE) change = "unmountable";
  else if (state == STORAGE_STATE_REMOVED) change = "removed";
  else if (state == STORAGE_STATE_MOUNTED) change = "mounted";
  else if (state == STORAGE_STATE_MOUNTED_READ_ONLY) change = "mounted_read_only";
  else change = "undefined";

  picojson::value value = picojson::value(data->object);
  picojson::object object = value.get<picojson::object>();

  object["id"] = picojson::value(std::to_string(storage_id).c_str());
  object["state"] = picojson::value(change);
  object["event"] = picojson::value("change");

  data->self->PostMessage(picojson::value(object).serialize().c_str());
}

static bool CallbackGetStorages(int storage_id, storage_type_e type, storage_state_e state,
                                const char *path, void *user_data) {
  CallbackData* data = static_cast<CallbackData*>(user_data);

  data->object["id"] = picojson::value(std::to_string(storage_id).c_str());
  if (type == STORAGE_TYPE_INTERNAL) data->object["type"] = picojson::value("internal");
  else if (type == STORAGE_TYPE_EXTERNAL) data->object["type"] = picojson::value("external");
  else data->object["type"] = picojson::value("undefined");
  if (state == STORAGE_STATE_UNMOUNTABLE) data->object["state"] = picojson::value("unmountable");
  else if (state == STORAGE_STATE_REMOVED) data->object["state"] = picojson::value("removed");
  else if (state == STORAGE_STATE_MOUNTED) data->object["state"] = picojson::value("mounted");
  else if (state == STORAGE_STATE_MOUNTED_READ_ONLY) data->object["state"] = picojson::value("mounted_read_only");
  else data->object["state"] = picojson::value("undefined");
  data->object["absolutePath"] = picojson::value(path);

  int ret = 0;
  unsigned long long total, available;
  ret = storage_get_total_space(storage_id, &total);
  if (ret == 0) data->object["totalSpace"] = picojson::value(std::to_string(total).c_str());
  ret = storage_get_available_space (storage_id, &available);
  if (ret == 0) data->object["availableSpace"] = picojson::value(std::to_string(available).c_str());

  ret = storage_set_state_changed_cb(storage_id, CallbackOnChange, data);
  data->array.push_back(picojson::value(data->object));

  return true;
}

void StorageInstance::HandleGetStorages(const std::string& asyncid) {
  CallbackData* data = new CallbackData();
  data->self = this;
  data->result["asyncid"] = picojson::value(asyncid);

  int ret = 0;
  ret = storage_foreach_device_supported(CallbackGetStorages, data);
  if (ret == 0) data->result["storages"] = picojson::value(data->array);
  else data->result["storages"] = picojson::value("undefined");

  PostMessage(picojson::value(data->result).serialize().c_str());
}

void StorageInstance::HandleMessage(const char* msg) {
  LOGD("Enter HandleMessage()");

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
  else {
    LOGW("Ignoring unknown message.");
    return;
  }
}

void StorageInstance::HandleGetDirectory(const int id, const std::string& type) {
  picojson::object result;

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

  result["id"] = picojson::value(std::to_string(id).c_str());
  result["type"] = picojson::value(type);
  if (ret == 0) result["dir"] = picojson::value(path);
  else result["dir"] = picojson::value("undefined");

  SendSyncReply(picojson::value(result).serialize().c_str());
}

void StorageInstance::HandleSyncMessage(const char* msg) {
  LOGD("Enter HandleSyncMessage()");

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
  if (cmd == "getDirectory") {
    int id = std::atoi(request["id"].to_str().c_str());
    std::string type = request["type"].to_str();
    HandleGetDirectory(id, type);
  }
  else {
    LOGW("Ignoring message. It is not an object.");
    return;
  }
}

}  // namespace storage

EXPORT_XWALK_EXTENSION(tizen_storage, storage::StorageExtension);
