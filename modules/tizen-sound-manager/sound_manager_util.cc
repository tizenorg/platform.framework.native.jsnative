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

#include "sound_manager_util.h"
#include <dlog.h>

namespace sound {

const std::map<std::string, sound_device_mask_e> SoundManagerUtil::sound_device_mask_map_ = {
    {"all", SOUND_DEVICE_ALL_MASK},
    {"in", SOUND_DEVICE_IO_DIRECTION_IN_MASK},
    {"out", SOUND_DEVICE_IO_DIRECTION_OUT_MASK},
    {"both", SOUND_DEVICE_IO_DIRECTION_BOTH_MASK},
    {"internal", SOUND_DEVICE_TYPE_INTERNAL_MASK},
    {"external", SOUND_DEVICE_TYPE_EXTERNAL_MASK },
    {"activated", SOUND_DEVICE_STATE_ACTIVATED_MASK},
    {"deactivated", SOUND_DEVICE_STATE_DEACTIVATED_MASK}
};

SoundManagerUtil::SoundManagerUtil() {

}

SoundManagerUtil::~SoundManagerUtil() {

}

const char* SoundManagerUtil::soundSessionTypeToString(sound_session_type_e type) {
  LOGD("enter");

  if (type == SOUND_SESSION_TYPE_MEDIA) {
    return "media";
  } else if (type == SOUND_SESSION_TYPE_ALARM) {
    return "alarm";
  } else if (type == SOUND_SESSION_TYPE_NOTIFICATION) {
    return "notification";
  } else if (type == SOUND_SESSION_TYPE_EMERGENCY) {
    return "emergency";
  } else if (type == SOUND_SESSION_TYPE_VOIP) {
    return "voip";
  } else {
    LOGE("invalid sound_session_type_e was passed");
    return "";
  }
}

std::string SoundManagerUtil::SoundDeviceTypeToString(sound_device_type_e type) {
  LOGD("Enter");
  switch (type) {
    case SOUND_DEVICE_BUILTIN_SPEAKER:
      return "builtin-speaker";
    case SOUND_DEVICE_BUILTIN_RECEIVER:
      return "builtin-receiver";
    case SOUND_DEVICE_BUILTIN_MIC:
      return "builtin-mic";
    case SOUND_DEVICE_AUDIO_JACK:
      return "audio-jack";
    case SOUND_DEVICE_BLUETOOTH:
      return "bluetooth";
    case SOUND_DEVICE_HDMI:
      return "hdmi";
    case SOUND_DEVICE_MIRRORING:
      return "mirroring";
    case SOUND_DEVICE_USB_AUDIO:
      return "usb-audio";
    default:
      LOGE("Invalid sound_device_type_e: %d", type);
      return "";
  }
}

std::string  SoundManagerUtil::SoundIOTypeToString(sound_device_io_direction_e direction) {
  LOGD("Enter");
  switch (direction) {
    case SOUND_DEVICE_IO_DIRECTION_IN:
      return "in";
    case SOUND_DEVICE_IO_DIRECTION_OUT:
      return "out";
    case SOUND_DEVICE_IO_DIRECTION_BOTH:
      return "both";
    default:
      LOGE("Invalid sound_device_io_direction_e: %d", direction);
      return "";
  }
}

std::string  SoundManagerUtil::SoundStateToString(sound_device_state_e  state) {
  LOGD("Enter");
  switch (state) {
    case SOUND_DEVICE_STATE_ACTIVATED:
      return "activated";
    case SOUND_DEVICE_STATE_DEACTIVATED:
      return "deactivated";
    default:
      LOGE("Invalid sound_device_state_e: %d", state);
      return "";
  }
}

sound_device_mask_e SoundManagerUtil::FilterStringToEnum(const std::string& key) {
  LOGD("enter");
  if (sound_device_mask_map_.find(key) == sound_device_mask_map_.end()) {
    LOGD("Platform enum value not found for key ");
    return SOUND_DEVICE_ALL_MASK;
  }

  return sound_device_mask_map_.at(key);
}

const char* SoundManagerUtil::soundSessionStartOptionToString(sound_session_option_for_starting_e option) {
  LOGD("enter");

  if (option == SOUND_SESSION_OPTION_MIX_WITH_OTHERS_WHEN_START) {
    return "mix-with-others";
  } else if (option == SOUND_SESSION_OPTION_PAUSE_OTHERS_WHEN_START) {
    return "pause-others";
  } else {
    LOGE("invalid sound_session_option_for_starting_e was passed");
    return "";
  }
}

const char* SoundManagerUtil::soundSessionInterruptOptionToString(sound_session_option_for_during_play_e option) {
  LOGD("enter");

  if (option == SOUND_SESSION_OPTION_INTERRUPTIBLE_DURING_PLAY) {
    return "interruptible";
  } else if (option == SOUND_SESSION_OPTION_UNINTERRUPTIBLE_DURING_PLAY) {
    return "uninterruptible";
  } else {
    LOGE("invalid sound_session_option_for_during_play_e was passed");
    return "";
  }
}

const char* SoundManagerUtil::soundSessionResumptionOptionToString(sound_session_option_for_resumption_e option) {
  LOGD("enter");

  if (option == SOUND_SESSION_OPTION_RESUMPTION_BY_SYSTEM) {
    return "system";
  } else if (option == SOUND_SESSION_OPTION_RESUMPTION_BY_SYSTEM_OR_MEDIA_PAUSED) {
    return "system-or-media-paused";
  } else {
    LOGE("invalid sound_session_option_for_resumption_e was passed");
    return "";
  }
}

const char* SoundManagerUtil::SoundTypeToString(sound_type_e type) {
  LOGD("enter");

  if ( type == SOUND_TYPE_SYSTEM) {
      return "system";
  } else if ( type == SOUND_TYPE_NOTIFICATION) {
      return "notification";
  } else if ( type == SOUND_TYPE_ALARM) {
      return "alarm";
  } else if ( type == SOUND_TYPE_RINGTONE) {
      return "ringtone";
  } else if ( type == SOUND_TYPE_MEDIA) {
      return "media";
  } else if ( type == SOUND_TYPE_CALL) {
      return "call";
  } else if ( type == SOUND_TYPE_VOIP) {
      return "voip";
  } else if ( type == SOUND_TYPE_VOICE) {
      return "voice";
  } else {
      LOGE("invalid sound_type_e was passed");
  }
}

sound_type_e SoundManagerUtil::StringToSoundType(const std::string& type_str) {
  LOGD("enter");

  if ( type_str == "system") {
      return SOUND_TYPE_SYSTEM;
  } else if ( type_str == "notification") {
      return SOUND_TYPE_NOTIFICATION;
  } else if ( type_str == "alarm") {
      return SOUND_TYPE_ALARM;
  } else if ( type_str == "ringtone") {
      return SOUND_TYPE_RINGTONE;
  } else if ( type_str == "media") {
      return SOUND_TYPE_MEDIA;
  } else if ( type_str == "call") {
      return SOUND_TYPE_CALL;
  } else if ( type_str == "voip") {
      return SOUND_TYPE_VOIP;
  } else if ( type_str == "voice") {
      return SOUND_TYPE_VOICE;
  } else {
      LOGE("invalid sound_type_e was passed");
  }
}

const char* SoundManagerUtil::soundSessionVoipModeToString(sound_session_voip_mode_e mode) {
  LOGD("enter");

  if (mode == SOUND_SESSION_VOIP_MODE_RINGTONE) {
    return "ringtone";
  } else if (mode == SOUND_SESSION_VOIP_MODE_VOICE_WITH_BUILTIN_RECEIVER) {
    return "builtin-receiver";
  } else if (mode == SOUND_SESSION_VOIP_MODE_VOICE_WITH_BUILTIN_SPEAKER) {
    return "builtin-speaker";
  } else if (mode == SOUND_SESSION_VOIP_MODE_VOICE_WITH_AUDIO_JACK) {
    return "audio-jack";
  } else if (mode == SOUND_SESSION_VOIP_MODE_VOICE_WITH_BLUETOOTH) {
    return "bluetooth";
  } else {
    LOGE("invalid sound_session_voip_mode_e was passed");
    return "";
  }
}

const char* SoundManagerUtil::soundSessioninterruptedCodeToString(sound_session_interrupted_code_e type) {
  LOGD("enter");

  if (type == SOUND_SESSION_INTERRUPTED_COMPLETED) {
    return "completed";
  } else if (type == SOUND_SESSION_INTERRUPTED_BY_MEDIA) {
    return "media";
  } else if (type == SOUND_SESSION_INTERRUPTED_BY_CALL) {
    return "call";
  } else if (type == SOUND_SESSION_INTERRUPTED_BY_EARJACK_UNPLUG) {
    return "earjack-unplug";
  } else if (type == SOUND_SESSION_INTERRUPTED_BY_RESOURCE_CONFLICT) {
    return "resource-confict";
  } else if (type == SOUND_SESSION_INTERRUPTED_BY_ALARM) {
    return "alarm";
  } else if (type == SOUND_SESSION_INTERRUPTED_BY_EMERGENCY) {
    return "emergency";
  } else if (type == SOUND_SESSION_INTERRUPTED_BY_NOTIFICATION) {
    return "notification";
  } else {
    LOGE("invalid sound_session_interrupted_code_e was passed");
    return "";
  }
}

sound_session_type_e SoundManagerUtil::soundSessionTypeToInt(const char* type) {
  LOGD("enter");

  if (!strcmp(type, "media")) {
    return SOUND_SESSION_TYPE_MEDIA;
  } else if (!strcmp(type, "alarm")) {
    return SOUND_SESSION_TYPE_ALARM;
  } else if (!strcmp(type, "notification")) {
    return SOUND_SESSION_TYPE_NOTIFICATION;
  } else if (!strcmp(type, "emergency")) {
    return SOUND_SESSION_TYPE_EMERGENCY;
  } else if (!strcmp(type, "voip")) {
    return SOUND_SESSION_TYPE_VOIP;
  } else {
    LOGD("invalid type was passed");
    return static_cast<sound_session_type_e>(-1);
  }
}

sound_session_option_for_starting_e SoundManagerUtil::soundSessionStartOptionToInt(const char* option) {
  LOGD("enter");

  if (!strcmp(option, "mix-with-others")) {
    return SOUND_SESSION_OPTION_MIX_WITH_OTHERS_WHEN_START;
  } else if (!strcmp(option, "pause-others")) {
    return SOUND_SESSION_OPTION_PAUSE_OTHERS_WHEN_START;
  } else {
    LOGD("invalid option was passed");
    return static_cast<sound_session_option_for_starting_e>(-1);
  }
}

sound_session_option_for_during_play_e SoundManagerUtil::soundSessionInterruptOptionToInt(const char* option) {
  LOGD("enter");

  if (!strcmp(option, "interruptible")) {
    return SOUND_SESSION_OPTION_INTERRUPTIBLE_DURING_PLAY;
  } else if (!strcmp(option, "uninterruptible")) {
    return SOUND_SESSION_OPTION_UNINTERRUPTIBLE_DURING_PLAY;
  } else {
    LOGD("invalid option was passed");
    return static_cast<sound_session_option_for_during_play_e>(-1);
  }
}

sound_session_option_for_resumption_e SoundManagerUtil::soundSessionResumptionOptionToInt(const char* option) {
  LOGD("enter");

  if (!strcmp(option, "system")) {
    return SOUND_SESSION_OPTION_RESUMPTION_BY_SYSTEM;
  } else if (!strcmp(option, "system-or-media-paused")) {
    return SOUND_SESSION_OPTION_RESUMPTION_BY_SYSTEM_OR_MEDIA_PAUSED;
  } else {
    LOGD("invalid option was passed");
    return static_cast<sound_session_option_for_resumption_e>(-1);
  }
}

sound_session_voip_mode_e SoundManagerUtil::soundSessionVoipModeToInt(const char* mode) {
  LOGD("enter");

  if (!strcmp(mode, "ringtone")) {
    return SOUND_SESSION_VOIP_MODE_RINGTONE;
  } else if (!strcmp(mode, "builtin-receiver")) {
    return SOUND_SESSION_VOIP_MODE_VOICE_WITH_BUILTIN_RECEIVER;
  } else if (!strcmp(mode, "builtin-speaker")) {
    return SOUND_SESSION_VOIP_MODE_VOICE_WITH_BUILTIN_SPEAKER;
  } else if (!strcmp(mode, "audio-jack")) {
    return SOUND_SESSION_VOIP_MODE_VOICE_WITH_AUDIO_JACK;
  } else if (!strcmp(mode, "bluetooth")) {
    return SOUND_SESSION_VOIP_MODE_VOICE_WITH_BLUETOOTH;
  } else {
    LOGD("invalid mode was passed");
    return static_cast<sound_session_voip_mode_e>(-1);
  }
}

}  // namespace sound
