/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd All Rights Reserved
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

#ifndef ALARM_EXTENSION_H_
#define ALARM_EXTENSION_H_

#include <xwalk/xwalk_extension.h>
#include <string>

namespace appfw {

class AlarmExtension : public xwalk::XWalkExtension {
 public:
  // @override
  xwalk::XWalkExtensionInstance* CreateInstance();
};

class AlarmInstance : public xwalk::XWalkExtensionInstance {
 public:
  // @override
  void Initialize();

  // @override
  void HandleMessage(const char* msg);

  // @override
  void HandleSyncMessage(const char* msg);
 private:
  void HandleAfterSchduleAfter(const std::string& appcontrol_json,
                               int after, const std::string& targetAppid);
  void HandleAtDate(const std::string& appcontrol_json,
                    int64_t date,
                    int weeks,
                    const std::string& targetAppid);
  void HandleRemove(const std::string& id);
  void HandleRemoveAll();
  void HandleValidation(const std::string& id);
  void HandleRecurrenceWeeks(const std::string& id);
  void HandleScheduleDate(const std::string& id);
  void HandleAppControl(const std::string& id);
};

}  // namespace appfw

#endif  // ALARM_EXTENSION_H_

