#ifndef _SOUNDMANAGER_EXTENSION_H_
#define _SOUNDMANAGER_EXTENSION_H_

#include <xwalk/xwalk_extension.h>
#include "picojson.h"

namespace sound {

class SoundManagerExtension : public xwalk::XWalkExtension {
 public:
  // @override
  xwalk::XWalkExtensionInstance* CreateInstance();
};

class SoundMangerInstance : public xwalk::XWalkExtensionInstance {
 public:
  // @override
  void HandleMessage(const char* msg);

  // @override
  void HandleSyncMessage(const char* msg);

private:

};

}  // namespace sound

#endif  // _SOUNDMANAGER_EXTENSION_H_