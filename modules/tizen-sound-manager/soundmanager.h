#ifndef _SOUNDMANAGER_H_
#define _SOUNDMANAGER_H_

namespace sound {

class SoundManager {
public:
  static SoundManger* getInstance();

private:
  SoundMnager();
  ~SoundManager();

};

} // namespace sound

#endif // _SOUNDMANAGER_H_