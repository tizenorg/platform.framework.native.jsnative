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

#ifndef SOUNDMANAGER_UTIL_H_
#define SOUNDMANAGER_UTIL_H_

#include <sound_manager.h>
#include "picojson.h"

namespace sound {

class SoundManagerUtil {
public:
  SoundManagerUtil();
  ~SoundManagerUtil();

  static std::string SoundDeviceTypeToString(sound_device_type_e type);
  static std::string  SoundIOTypeToString(sound_device_io_direction_e direction);
  static std::string  SoundStateToString(sound_device_state_e state);
  static sound_device_mask_e FilterStringToEnum(const std::string& key);
  static const char* SoundTypeToString(sound_type_e type);
  static sound_type_e StringToSoundType(const std::string& type_str);

  static const char* SoundSessionTypeToString(sound_session_type_e type);
  static const char* SoundSessionStartOptionToString(sound_session_option_for_starting_e type);
  static const char* SoundSessionInterruptOptionToString(sound_session_option_for_during_play_e type);
  static const char* SoundSessionResumptionOptionToString(sound_session_option_for_resumption_e type);
  static const char* SoundSessionVoipModeToString(sound_session_voip_mode_e type);
  static const char* SoundSessioninterruptedCodeToString(sound_session_interrupted_code_e type);

  static sound_session_type_e SoundSessionTypeToInt(const char* type);
  static sound_session_option_for_starting_e SoundSessionStartOptionToInt(const char* type);
  static sound_session_option_for_during_play_e SoundSessionInterruptOptionToInt(const char* type);
  static sound_session_option_for_resumption_e SoundSessionResumptionOptionToInt(const char* type);
  static sound_session_voip_mode_e SoundSessionVoipModeToInt(const char* type);

private:
  static const std::map<std::string, sound_device_mask_e> sound_device_mask_map_;
};

}  // namespace sound

#endif  // SOUNDMANAGER_UTIL_H_