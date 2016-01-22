#ifndef SYSTEM_SETTING_EXTENSION_H_
#define SYSTEM_SETTING_EXTENSION_H_

#include <xwalk/xwalk_extension.h>
#include <system_settings.h>

#include "picojson.h"

namespace systemsetting {

class SystemSettingExtension : public xwalk::XWalkExtension {
 public:
  // @override
  xwalk::XWalkExtensionInstance* CreateInstance();
};

class SystemSettingInstance : public xwalk::XWalkExtensionInstance {
 public:
  SystemSettingInstance();
  ~SystemSettingInstance();
  // @override
  void HandleMessage(const char* msg);
  void HandleSyncMessage(const char* msg);

  void FireSimpleEvent(const std::string& event,
                       const std::string& data = std::string());

 private:
  void HandleMessage(const char* msg, bool is_sync);

  void setValue(const picojson::value& args, picojson::object& out);
  void getValue(const picojson::value& args, picojson::object& out);

  void setEnumValue(const system_settings_key_e eKey, const std::string& value,
                    picojson::object& out);
  void getEnumValue(const system_settings_key_e eKey, picojson::object& out);

  void ReportSuccess(picojson::object& out);
  void ReportSuccess(const picojson::value& result, picojson::object& out);
  void ReportError(picojson::object& out);
  void ReportError(const std::string& errMessage, picojson::object& out);

  std::string getErrorMessage(const int err);
};

}  // namespace systemsetting

#endif  // SYSTEM_SETTING_EXTENSION_H_
