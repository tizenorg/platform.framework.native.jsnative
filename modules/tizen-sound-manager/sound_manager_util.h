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
#include <string>

namespace sound {

class SoundManagerUtil {
public:
  SoundManagerUtil();
  ~SoundManagerUtil();

  static const char* SessionTypeToString(sound_session_type_e type);
  static const char* SessionStartOptionToString(sound_session_option_for_starting_e type);
  static const char* SessionPlayingOptionToString(sound_session_option_for_during_play_e type);
  static const char* SessionResumptionOptionToString(sound_session_option_for_resumption_e type);
  static const char* SoundTypeToString(sound_type_e type);
  static sound_type_e StringToSoundType(const std::string& type_str);
private:
};

}  // namespace sound

#endif  // SOUNDMANAGER_UTIL_H_
