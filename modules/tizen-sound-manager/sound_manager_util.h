#ifndef _SOUNDMANAGER_UTIL_H_
#define _SOUNDMANAGER_UTIL_H_

#include <sound_manger.h>

namespace sound {

class SoundMangerUtil {
public:
  SoundManager();
  ~SoundManager();

  static const char* soundSessionTypeToString(sound_session_type_e type);
  static const char* soundSessionStartOptionToString(sound_session_option_for_starting_e type);
  static const char* soundSessionPlayingOptionToString(sound_session_option_for_during_play_e type);
  static const char* soundSessionResumptionOptionToString(sound_session_option_for_resumption_e type);
private:
};

}  // namespace sound

#endif  // _SOUNDMANAGER_UTIL_H_