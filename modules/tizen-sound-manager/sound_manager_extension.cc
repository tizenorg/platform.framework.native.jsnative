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

 #include "sound_manager_extension.h"
 #include "sound_manager_util.h"

 #include <dlog.h>
 #include <sound_manager.h>

 #include "picojson.h"

 #ifdef LOG_TAG
 #undef LOG_TAG
 #endif
 #define LOG_TAG "JSNative"

namespace sound {

xwalk::XWalkExtensionInstance* SoundManagerExtension::CreateInstance() {
  return new SoundManagerInstance();
}

void VolumeChangedCallback(sound_type_e type, unsigned int volume, void* data) {
  LOGD("enter");
  LOGD("changed cb volume : %d", volume);
  SoundManagerInstance* self = reinterpret_cast<SoundManagerInstance*>(data);
  if (self == nullptr) {
    LOGE("Pointer of SoundManagerInstance has nullptr");
    return;
  }
  std::string type_str = SoundManagerUtil::SoundTypeToString(type);
  picojson::value::object obj;
  obj["event"] = picojson::value("volume.change");
  obj["type"] = picojson::value(type_str);
  obj["volume"] = picojson::value(std::to_string(volume));
  obj["result"] = picojson::value("OK");
  self->PostMessage(picojson::value(obj).serialize().c_str());
}

void SoundManagerInstance::Initialize() {
  LOGD("enter");
  InitializeCallbacks();
}

void SoundManagerInstance::InitializeCallbacks() {
  LOGD("enter");
  if (sound_manager_set_volume_changed_cb(VolumeChangedCallback, this) < 0) {
    LOGE("Failed to add callback for volume change");
  }
}

/**
 * Handles async message
 */
void SoundManagerInstance::HandleMessage(const char* msg) {
  LOGD("enter");

  picojson::value value;
  std::string error;
  picojson::parse(value, msg, msg + strlen(msg), &error);
  if (!error.empty()) {
    LOGE("ignoring message. can't parse message: %s", error.c_str());
    return;
  }
  if (!value.is<picojson::object>()) {
    LOGE("ignoring message. it is not an object.");
    return;
  }

  auto& request = value.get<picojson::object>();
  auto found = request.find("asyncid");
  if (found == request.end()) {
    LOGE("asyncid was not existed");
    return;
  }

  auto cmd = request["cmd"].to_str();
  if (cmd == "") {
    /* Handles the specific cmd */
  } else {
    LOGW("the command is wrong cmd");
  }
}

/**
 * Handles sync message
 */
void SoundManagerInstance::HandleSyncMessage(const char* msg) {
  LOGD("enter");

  picojson::value value;
  std::string error;
  picojson::parse(value, msg, msg + strlen(msg), &error);

  if (!error.empty()) {
    LOGE("ignoring message. can't parse message: %s", error.c_str());
    return;
  }
  if (!value.is<picojson::object>()) {
    LOGE("ignoring message. it is not an object.");
    return;
  }

  auto& request = value.get<picojson::object>();
  auto cmd = request["cmd"].to_str();

  if (cmd == "") {
    /* Handles the specific cmd */
  } else if (cmd == "getcurrentSoundType") {
    LOGD("enter");
    sound_type_e type;
    sound_manager_get_current_sound_type(&type);
    std::string type_str = SoundManagerUtil::SoundTypeToString(type);
    SendSyncReply(type_str.c_str());
  } else if (cmd == "setcurrentSoundType") {
    LOGD("enter");
    auto type_str = request["soundtype"].to_str();
    sound_type_e type = SoundManagerUtil::StringToSoundType(type_str.c_str());
    sound_manager_set_current_sound_type(type);
  } else if (cmd == "getMaxVolume") {
    LOGD("enter");
    int max_volume;
    auto type_str = request["soundtype"].to_str();
    sound_type_e type = SoundManagerUtil::StringToSoundType(type_str.c_str());
    sound_manager_get_max_volume(type, &max_volume);
    SendSyncReply(std::to_string(max_volume).c_str());
  } else if (cmd == "getVolume") {
    LOGD("enter");
    int volume;
    auto type_str = request["soundtype"].to_str();
    sound_type_e type = SoundManagerUtil::StringToSoundType(type_str.c_str());
    sound_manager_get_volume(type, &volume);
    SendSyncReply(std::to_string(volume).c_str());
  } else if (cmd == "setVolume") {
    LOGD("enter");
    int volume = std::stoi(request["volume"].to_str());
    auto type_str = request["soundtype"].to_str();
    sound_type_e type = SoundManagerUtil::StringToSoundType(type_str.c_str());
    sound_manager_set_volume(type, volume);
  }
  else {
    LOGW("the cmd is wrong cmd");
  }
}

}  // namespace sound

EXPORT_XWALK_EXTENSION(tizen_sound_manager, sound::SoundManagerExtension);
