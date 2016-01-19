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
#include <vector>

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace storage {

namespace {

/*

Type[] = {
  STORAGE_TYPE_INTERNAL = 0,
  STORAGE_TYPE_EXTERNAL = 1,
};

Status[] = {
  STORAGE_STATE_UNMOUNTABLE = -2,
  STORAGE_STATE_REMOVED = -1,
  STORAGE_STATE_MOUNTED = 0,
  STORAGE_STATE_MOUNTED_READ_ONLY = 1,
};

int storage_foreach_device_supported (storage_device_supported_cb callback, void *user_data)
  typedef bool(* storage_device_supported_cb)(int storage_id, storage_type_e type, storage_state_e state, const char *path, void *user_data)
 int storage_get_root_directory (int storage_id, char **path)
 int storage_get_directory (int storage_id, storage_directory_e type, char **path)
 int storage_get_type (int storage_id, storage_type_e *type)
 int storage_get_state (int storage_id, storage_state_e *state)
int storage_set_state_changed_cb (int storage_id, storage_state_changed_cb callback, void *user_data)
int storage_unset_state_changed_cb (int storage_id, storage_state_changed_cb callback)
int storage_get_total_space (int storage_id, unsigned long long *bytes)
int storage_get_available_space (int storage_id, unsigned long long *bytes)
 int storage_get_internal_memory_size (struct statvfs *buf)
 int storage_get_external_memory_size (struct statvfs *buf)

*/
}

xwalk::XWalkExtensionInstance* StorageExtension::CreateInstance() {
  return new StorageInstance();
}

void StorageInstance::Initialize() {
  LOGD("Created tizen-storage instance");
}

bool storage_device_supported_cb(int storage_id, storage_type_e type, storage_state_e state, const char *path, void *user_data)
{
  picojson::object object;
  object["storage_id"] = picojson::value(std::to_string(storage_id).c_str());
  object["type"] = picojson::value(std::to_string(type).c_str());
  object["state"] = picojson::value(std::to_string(state).c_str());
  object["path"] = picojson::value(path);

  int ret = 0;
  unsigned long long size, space;
  ret = storage_get_total_space(storage_id, &size);
  if (ret == 0)
    object["size"] = picojson::value(std::to_string(size).c_str());
  ret = storage_get_available_space (storage_id, &space);
  if (ret == 0)
    object["space"] = picojson::value(std::to_string(space).c_str());

  picojson::array* array = static_cast<picojson::array*>(user_data);
  array->push_back(picojson::value(object));

  return true;
}

void StorageInstance::HandleGetStorages(const std::string& asyncid)
{
  LOGD("@@@ HandleGetStorages");

  picojson::object result;
  picojson::array array;
  result["asyncid"] = picojson::value(asyncid);

  int ret = 0;
  ret = storage_foreach_device_supported(storage_device_supported_cb, &array);
  if (ret == 0)
    result["storages"] = picojson::value(array);

  PostMessage(picojson::value(result).serialize().c_str());
}

/*
void StorageInstance::HandleGetMemorySize(const std::string& asyncid, const std::string& type)
{
  picojson::object result;
  result["asyncid"] = picojson::value(asyncid);
  LOGD("@@@ HandleGetMemorySize");
}

void StorageInstance::HandleGetStorage(const std::string& asyncid, const std::string& id)
{
  picojson::object result;
  result["asyncid"] = picojson::value(asyncid);
  result["storage_id"] = picojson::value(id);

  LOGD("@@@ HandleGetStorage");
}
*/

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
  /*
  else if (cmd == "getMemorySize") {
    std::string asyncid = request["asyncid"].to_str();
    std::string type = request["type"].to_str()
    HandleGetMemorySize(asyncid, type);
  }
  else if (cmd == "getStorage") {
    LOGD("@@@ call getStorege");
    std::string asyncid = request["asyncid"].to_str();
    std::string id = request["id"].to_str();
    HandleGetStorage(asyncid, id);
  }
  */
  else {
    LOGW("Ignoring unknown message.");
    return;
  }

}

}  // namespace storage

EXPORT_XWALK_EXTENSION(tizen_storage, storage::StorageExtension);
