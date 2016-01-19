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

#ifndef STORAGE_EXTENSION_H_
#define STORAGE_EXTENSION_H_

#include <xwalk/xwalk_extension.h>
#include "picojson.h"

namespace storage {

class StorageExtension : public xwalk::XWalkExtension {
 public:
  xwalk::XWalkExtensionInstance* CreateInstance();
};

class StorageInstance : public xwalk::XWalkExtensionInstance {
 public:
  void Initialize();
  void HandleMessage(const char* msg);
  void HandleSyncMessage(const char* msg);

 private:
  void HandleGetStorages(const std::string& asyncid);
  void HandleGetDirectory(const int id, const std::string& type);

};

}  // namespace storage

#endif  // STORAGE_EXTENSION_H_

