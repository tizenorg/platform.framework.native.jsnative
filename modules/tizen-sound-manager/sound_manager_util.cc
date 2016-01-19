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

SoundManagerUtil::SoundManagerUtil() {

}

SoundManagerUtil::~SoundManagerUtil() {

}

const char* SoundManagerUtil::SessionTypeToString(sound_session_type_e type) {
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
    // TODO: throw TypeErrorException
  }
}

const char* SoundManagerUtil::SessionStartOptionToString(sound_session_option_for_starting_e option) {
  LOGD("enter");

  if (option == SOUND_SESSION_OPTION_MIX_WITH_OTHERS_WHEN_START) {
    return "mix-with-others";
  } else if (option == SOUND_SESSION_OPTION_PAUSE_OTHERS_WHEN_START) {
    return "pause-others";
  } else {
    LOGE("invalid sound_session_option_for_starting_e was passed");
    // TODO: throw Exception
  }
}

const char* SoundManagerUtil::SessionPlayingOptionToString(sound_session_option_for_during_play_e option) {
  LOGD("enter");

  if (option == SOUND_SESSION_OPTION_INTERRUPTIBLE_DURING_PLAY) {
    return "interruptible-during-play";
  } else if (option == SOUND_SESSION_OPTION_UNINTERRUPTIBLE_DURING_PLAY) {
    return "uninterruptible-during-play";
  } else {
    LOGE("invalid sound_session_option_for_during_play_e was passed");
    // TODO: throw TypeErrorException
  }
}

const char* SoundManagerUtil::SessionResumptionOptionToString(sound_session_option_for_resumption_e option) {
  LOGD("enter");

  if (option == SOUND_SESSION_OPTION_RESUMPTION_BY_SYSTEM) {
    return "by-system";
  } else if (option == SOUND_SESSION_OPTION_RESUMPTION_BY_SYSTEM_OR_MEDIA_PAUSED) {
    return "by-system-or-media-paused";
  } else {
    LOGE("invalid sound_session_option_for_resumption_e was passed");
    // TODO: throw TypeErrorException
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

}  // namespace sound
