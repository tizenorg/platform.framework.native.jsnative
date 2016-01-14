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

#ifndef NOTIFICATION_NOTIFICATION_EXTENSION_H_
#define ECHO_ECHO_EXTENSION_H_

#include <xwalk/xwalk_extension.h>
#include <notification.h>

#include "picojson.h"

namespace notification {

class NotificationExtension : public xwalk::XWalkExtension {
 public:
  // @override
  xwalk::XWalkExtensionInstance* CreateInstance();
};

class NotificationInstance : public xwalk::XWalkExtensionInstance {
 public:
  // @override
  void HandleMessage(const char* msg);

  // @override
  void HandleSyncMessage(const char* msg);

private:
  // sync
  void PostOrUpdate(picojson::value& value, bool isUpdate);
  void Remove(const int notification_id);
  void RemoveAll();
  void GetPkgName(const int id);
  void GetNotification(const std::string& async_id, const int id);
  void GetNotificationHandle(const int id, notification_h* noti_handle);
  void AddButton(notification_h& noti, picojson::value& appCtrl,
                 notification_button_index_e buttonIndex,
                 notification_text_type_e buttonTextType, std::string label,
                 std::string imagePath);
  void PostStatusMessage(const std::string& async_id,
                         const std::string& message);
};

}  // namespace notification

#endif  // NOTIFICATION_NOTIFICATION_EXTENSION_H_
