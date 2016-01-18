#ifndef SYSTEM_SETTING_MANAGER_H_
#define SYSTEM_SETTING_MANAGER_H_

#include <dlog.h>
#include <system_settings.h>

namespace systemsetting {

//This will be implemented as structure for storing result.
typedef bool PlatformResult;

class SystemSettingManager{
 public:
  SystemSettingManager();
  ~SystemSettingManager();

  void setValue(std::string key, std::string type, std::string value);
  std::string getValue(std::string key, std::string type);

};

}  // namespace systemsetting

#endif  // SYSTEM_SETTING_MANAGER_H_
