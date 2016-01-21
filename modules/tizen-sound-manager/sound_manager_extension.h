#ifndef _SOUND_MANAGER_EXTENSION_H_
#define _SOUND_MANAGER_EXTENSION_H_

#include <xwalk/xwalk_extension.h>
#include <sound_manager.h>

#include "picojson.h"

namespace sound {

class SoundManagerExtension : public xwalk::XWalkExtension {
 public:
  // @override
  xwalk::XWalkExtensionInstance* CreateInstance();
};

class SoundManagerInstance : public xwalk::XWalkExtensionInstance {
 public:
  // @override
  void Initialize();

  // @override
  void HandleMessage(const char* msg);

  // @override
  void HandleSyncMessage(const char* msg);
  int GetDeviceInfo(sound_device_h device, picojson::object* obj);

  static void _interruptListener(sound_session_interrupted_code_e type, void *userData);

private:
 void InitializeCallbacks();
 void ConnectionChangedCallback(sound_device_h device,
                                bool is_connected,
                                void *user_data);
 void DeviceInfoChangedCallback(sound_device_h device,
                                sound_device_changed_info_e  info,
                                void *user_data );
 void GetDeviceList(const std::string& asyncid,
                    const std::string& direction,
                    const std::string& type,
                    const std::string& state);
 sound_device_mask_e  GetMask(const std::string& direction,
                                         const std::string& type,
                                         const std::string& state);

  const picojson::object getSessionType();
  const picojson::object setSessionType(const picojson::value value);
  const picojson::object getSessionStartingOption();
  const picojson::object setSessionStartingOption(const picojson::value value);
  const picojson::object getSessionInterruptOption();
  const picojson::object setSessionInterruptOption(const picojson::value value);
  const picojson::object getSessionResumptionOption();
  const picojson::object setSessionResumptionOption(const picojson::value value);
  const picojson::object getSessionVoipMode();
  const picojson::object setSessionVoipMode(const picojson::value value);

  const picojson::object _setInterruptListener();
};

}  // namespace sound

#endif  // _SOUND_MANAGER_EXTENSION_H_
