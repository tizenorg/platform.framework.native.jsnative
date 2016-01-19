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

 #include <dlog.h>
 #include <sound_manager.h>

 #include "picojson.h"

 #ifdef LOG_TAG
 #undef LOG_TAG
 #endif
 #define LOG_TAG "JSNative"

namespace sound {

xwalk::XWalkExtensionInstance* SoundManagerExtension::CreateInstance() {
  return new SoundMangerInstance();
}

/**
 * Handles async message
 */
void SoundMangerInstance::HandleMessage(const char* msg) {
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
void SoundMangerInstance::HandleSyncMessage(const char* msg) {
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
    std::string soundtype;
    sound_type_e type;
    sound_manager_get_current_sound_type(&type);

    if ( type == SOUND_TYPE_SYSTEM) {
        soundtype = "system";
    } else if ( type == SOUND_TYPE_NOTIFICATION) {
        soundtype = "notification";
    } else if ( type == SOUND_TYPE_ALARM) {
        soundtype = "alarm";
    } else if ( type == SOUND_TYPE_RINGTONE) {
        soundtype = "ringtone";
    } else if ( type == SOUND_TYPE_MEDIA) {
        soundtype = "media";
    } else if ( type == SOUND_TYPE_CALL) {
        soundtype = "call";
    } else if ( type == SOUND_TYPE_VOIP) {
        soundtype = "voip";
    } else if ( type == SOUND_TYPE_VOICE) {
        soundtype = "voice";
    } else {
        LOGE("invalid sound_type_e was passed");
    }
    SendSyncReply(soundtype.c_str());
  } else if (cmd == "setcurrentSoundType") {
    LOGD("enter");
    sound_type_e type;
    auto soundtype = request["soundtype"].to_str();
    if ( soundtype == "system") {
        type = SOUND_TYPE_SYSTEM;
    } else if ( soundtype == "notification") {
        type = SOUND_TYPE_NOTIFICATION;
    } else if ( soundtype == "alarm") {
        type = SOUND_TYPE_ALARM;
    } else if ( soundtype == "ringtone") {
        type = SOUND_TYPE_RINGTONE;
    } else if ( soundtype == "media") {
        type = SOUND_TYPE_MEDIA;
    } else if ( soundtype == "call") {
        type = SOUND_TYPE_CALL;
    } else if ( soundtype == "voip") {
        type = SOUND_TYPE_VOIP;
    } else if ( soundtype == "voice") {
        type = SOUND_TYPE_VOICE;
    } else {
        LOGE("invalid sound_type_e was passed");
    }
    sound_manager_set_current_sound_type(type);
  } else if (cmd == "getMaxVolume") {
    LOGD("enter");
    int max_volume;
    sound_type_e type;

    auto soundtype = request["soundtype"].to_str();

    if ( soundtype == "system") {
        type = SOUND_TYPE_SYSTEM;
    } else if ( soundtype == "notification") {
        type = SOUND_TYPE_NOTIFICATION;
    } else if ( soundtype == "alarm") {
        type = SOUND_TYPE_ALARM;
    } else if ( soundtype == "ringtone") {
        type = SOUND_TYPE_RINGTONE;
    } else if ( soundtype == "media") {
        type = SOUND_TYPE_MEDIA;
    } else if ( soundtype == "call") {
        type = SOUND_TYPE_CALL;
    } else if ( soundtype == "voip") {
        type = SOUND_TYPE_VOIP;
    } else if ( soundtype == "voice") {
        type = SOUND_TYPE_VOICE;
    } else {
        LOGE("invalid sound_type_e was passed");
    }

    sound_manager_get_max_volume(type, &max_volume);
    SendSyncReply(std::to_string(max_volume).c_str());
  } else if (cmd == "getVolume") {
    LOGD("enter");
    int volume;
    sound_type_e type;

    auto soundtype = request["soundtype"].to_str();

    if ( soundtype == "system") {
        type = SOUND_TYPE_SYSTEM;
    } else if ( soundtype == "notification") {
        type = SOUND_TYPE_NOTIFICATION;
    } else if ( soundtype == "alarm") {
        type = SOUND_TYPE_ALARM;
    } else if ( soundtype == "ringtone") {
        type = SOUND_TYPE_RINGTONE;
    } else if ( soundtype == "media") {
        type = SOUND_TYPE_MEDIA;
    } else if ( soundtype == "call") {
        type = SOUND_TYPE_CALL;
    } else if ( soundtype == "voip") {
        type = SOUND_TYPE_VOIP;
    } else if ( soundtype == "voice") {
        type = SOUND_TYPE_VOICE;
    } else {
        LOGE("invalid sound_type_e was passed");
    }

    sound_manager_get_volume(type, &volume);
    SendSyncReply(std::to_string(volume).c_str());
  } else if (cmd == "setVolume") {
    LOGD("enter");
    int volume = std::stoi(request["volume"].to_str());
    // int volume = static_cast<int>(request["volume"].get<double>());
    sound_type_e type;
    //LOGD("%d",volume);
    auto soundtype = request["soundtype"].to_str();

    if ( soundtype == "system") {
        type = SOUND_TYPE_SYSTEM;
    } else if ( soundtype == "notification") {
        type = SOUND_TYPE_NOTIFICATION;
    } else if ( soundtype == "alarm") {
        type = SOUND_TYPE_ALARM;
    } else if ( soundtype == "ringtone") {
        type = SOUND_TYPE_RINGTONE;
    } else if ( soundtype == "media") {
        type = SOUND_TYPE_MEDIA;
    } else if ( soundtype == "call") {
        type = SOUND_TYPE_CALL;
    } else if ( soundtype == "voip") {
        type = SOUND_TYPE_VOIP;
    } else if ( soundtype == "voice") {
        type = SOUND_TYPE_VOICE;
    } else {
        LOGE("invalid sound_type_e was passed");
    }
    sound_manager_set_volume(type, volume);
  }
  else {
    LOGW("the cmd is wrong cmd");
  }
}

}  // namespace sound
