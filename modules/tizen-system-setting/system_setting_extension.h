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
  void HandleMessage(const char* msg);      // processes message for 'async'
  void HandleSyncMessage(const char* msg);  // processes message for 'sync'

  void FireSimpleEvent(const std::string& event, const std::string& data = std::string()); // used in HandleMessage() for event

private:
  void HandleMessage(const char* msg, bool is_sync);

  void setValue(const picojson::value& args, picojson::object& out);
  void getValue(const picojson::value& args, picojson::object& out);

  void ReportSuccess(picojson::object& out);
  void ReportSuccess(const picojson::value& result, picojson::object& out);
  void ReportError(picojson::object& out);
  void ReportError(const std::string errMessage, picojson::object& out);

  std::string getErrorMessage(int err);
};

}  // namespace systemsetting

#endif  // SYSTEM_SETTING_EXTENSION_H_
