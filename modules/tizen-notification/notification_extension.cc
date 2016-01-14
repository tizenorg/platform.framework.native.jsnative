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

#include "notification_extension.h"


#include <notification_internal.h>
#include <dlog.h>

#include "picojson.h"

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace notification {

/**
 * @class NotificationExtension
 */

/* @method NotificationExtension::CreateInstance()
 *
 * CreateInstance() SHOULD be implemented in inherited class
 * to return your own ExtensionInstance class.
 */
xwalk::XWalkExtensionInstance* NotificationExtension::CreateInstance() {
  return new NotificationInstance;
}

/**
 * @class NotificationInstance
 */

/* @method NotificationInstance::HandleMessage()
 *
 * HandleMessage() CAN be implemented if want to handle asyncronous messages
 * sent by 'extension.postMessage()' in notification_api.js.
 * Asyncronous response can be sent with PostMessage() and the sent response
 * can be handled using 'extension.setMessageListener()' in notification_api.js
 * also.
 */
void NotificationInstance::HandleMessage(const char* msg) {
  picojson::value value;
  std::string err;
  picojson::parse(value, msg, msg + strlen(msg), &err);
  if (!err.empty()) {
    LOGE("Ignoring message. Can't parse msessage : %s", err.c_str());
    return;
  }
  if (!value.is<picojson::object>()) {
    LOGE("Ignoring message. It is not an object.");
    return;
  }
  auto& request = value.get<picojson::object>();
  auto found = request.find("asyncid");
  if (found == request.end()) {
    LOGE("asyncid was not existed");
    return;
  }

  auto cmd = request["cmd"].to_str();

  if (cmd == "get") {
    int id = std::stoi(request["id"].to_str());
    GetNotification(request["asyncid"].to_str(), id);
  } else if (cmd == "getAll") {
    // TODO: Need to be implemented
    // GetAllNotifications();
  } else if (cmd == "statusMessagePost") {
    StatusMessagePost(request["asyncid"].to_str(), request["message"].to_str());
  }
}

void NotificationInstance::GetNotification(const std::string& async_id,
                                           const int id) {
  picojson::value::object obj;
  obj["asyncid"] = picojson::value(async_id);
  notification_h noti_handle;
  GetNotificationHandle(id, &noti_handle);
  // HandleToJson(id, noti_handle, appControl, out_ptr);
  // TODO: implement HandleToJson()

  obj["result"] = picojson::value("OK");
  PostMessage(picojson::value(obj).serialize().c_str());
}

void NotificationInstance::StatusMessagePost(const std::string& async_id,
                                             const std::string& message) {
  picojson::value::object obj;
  obj["asyncid"] = picojson::value(async_id);
  int ret = notification_status_message_post(message.c_str());
  if (ret != NOTIFICATION_ERROR_NONE) {
    obj["result"] = picojson::value("FAIL");
    obj["reason"] = picojson::value("StatusMessagePost() Failed");
  } else {
    obj["result"] = picojson::value("OK");
  }
  PostMessage(picojson::value(obj).serialize().c_str());
}

/* @method NotificationInstance::HandleSyncMessage()
 *
 * HandleSyncMessage() CAN be implemented if want to handle syncronous messages
 * sent by 'extension.internal.sendSyncMessage()' in echo_api.js.
 * This method should send response with SendSyncReply().
 */
void NotificationInstance::HandleSyncMessage(const char* msg) {
  picojson::value value;
  std::string err;
  picojson::parse(value, msg, msg + strlen(msg), &err);
  if (!err.empty()) {
    LOGE("Ignoring message. Can't parse msessage : %s", err.c_str());
    return;
  }
  if (!value.is<picojson::object>()) {
    LOGE("Ignoring message. It is not an object.");
    return;
  }
  auto& request = value.get<picojson::object>();
  auto cmd = request["cmd"].to_str();

  if (cmd == "post") {
    LOGD("post command!");
    LOGD("  msg: %s", msg);
    LOGD("  type: %s", request["type_"].to_str().c_str());
    LOGD("  dictionary: %s", request["dictionary_"].to_str().c_str());
    LOGD("  dictionary.title: %s", request["dictionary_"].get("title").to_str().c_str());
    PostOrUpdate(msg, false);
  } else if (cmd == "update") {
    LOGD("update command!");
    PostOrUpdate(msg, true);
  } else if (cmd == "remove") {
    Remove(request["id_"].to_str());
  } else if (cmd == "removeAll") {
    RemoveAll();
  } else if (cmd == "getPkgname") {
    GetPkgname(std::stoi(request["id"].to_str()));
  } else if (cmd == "setEventHandler") {
    std::string eventType = request["eventType"].to_str();
    // TODO: implement
  } else if (cmd == "addButton") {
    int id = std::stoi(request["id"].to_str());
    std::string button = request["buttonIndex"].to_str();
    AddRemoveButton(id, button, true);
  } else if (cmd == "removeButton") {
    int id = std::stoi(request["id"].to_str());
    std::string button = request["buttonIndex"].to_str();
    AddRemoveButton(id, button, false);
  }
}

void NotificationInstance::Remove(std::string notification_id) {
  picojson::value::object obj;
  int id = std::stoi(notification_id);
  int ret = notification_delete_by_priv_id(NULL, NOTIFICATION_TYPE_NONE, id);
  if (ret != NOTIFICATION_ERROR_NONE) {
    obj["result"] = picojson::value("FAIL");
    obj["reason"] = picojson::value("Cannot remove notification error");
  } else {
    obj["result"] = picojson::value("OK");
  }
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

void NotificationInstance::RemoveAll() {
  picojson::value::object obj;
  int ret = notification_delete_all(NOTIFICATION_TYPE_NOTI);
  if (ret != NOTIFICATION_ERROR_NONE) {
    obj["result"] = picojson::value("FAIL");
    obj["reason"] = picojson::value("Notification remove TYPE_NOTI type failed");
    SendSyncReply(picojson::value(obj).serialize().c_str());
    return;
  }

  ret = notification_delete_all(NOTIFICATION_TYPE_ONGOING);
  if (ret != NOTIFICATION_ERROR_NONE) {
    obj["result"] = picojson::value("FAIL");
    obj["reason"] = picojson::value("Notification remove TYPE_ONGOING type failed");
    SendSyncReply(picojson::value(obj).serialize().c_str());
    return;
  }
  obj["result"] = picojson::value("OK");
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

void NotificationInstance::AddRemoveButton(const int id, std::string button,
                                           bool isAddButton) {
  notification_button_index_e buttonIndex;
  picojson::value::object obj;
  if (!button.compare("BUTTON1")) {
    buttonIndex = NOTIFICATION_BUTTON_1;
  } else if (!button.compare("BUTTON2")) {
    buttonIndex = NOTIFICATION_BUTTON_2;
  } else if (!button.compare("BUTTON3")) {
    buttonIndex = NOTIFICATION_BUTTON_3;
  } else if (!button.compare("BUTTON4")) {
    buttonIndex = NOTIFICATION_BUTTON_4;
  } else if (!button.compare("BUTTON5")) {
    buttonIndex = NOTIFICATION_BUTTON_5;
  } else if (!button.compare("BUTTON6")) {
    buttonIndex = NOTIFICATION_BUTTON_6;
  } else {
    obj["result"] = picojson::value("FAIL");
    obj["reason"] = picojson::value("Invalid Button Index");
    SendSyncReply(picojson::value(obj).serialize().c_str());
    return;
  }
  notification_h noti_handle = NULL;
  int ret = NOTIFICATION_ERROR_NONE;
  GetNotificationHandle(id, &noti_handle);
  if (isAddButton){
    ret = notification_add_button(noti_handle, buttonIndex);
  } else {
    ret = notification_remove_button(noti_handle, buttonIndex);
  }
  if (ret != NOTIFICATION_ERROR_NONE) {
    obj["result"] = picojson::value("FAIL");
    obj["reason"] = picojson::value("Add or Remove Button Fail");
  } else {
    obj["result"] = picojson::value("OK");
  }
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

void NotificationInstance::GetNotificationHandle(const int id,
                                                 notification_h* noti_handle) {
  *noti_handle = notification_load(NULL, id);
  if (NULL == *noti_handle) {
    LOGE("Not found or removed notification id");
    return;
  }
}

void NotificationInstance::GetPkgname(const int id) {
  notification_h noti_handle = NULL;
  GetNotificationHandle(id, &noti_handle);
  char* pkgname = NULL;
  notification_get_pkgname(noti_handle, &pkgname);
  SendSyncReply(pkgname);
}

void NotificationInstance::PostOrUpdate(const char* msg, bool isUpdate) {
  LOGD("NotificationInstance::PostOrUpdate() execution");
  picojson::value value;
  std::string err;
  picojson::parse(value, msg, msg + strlen(msg), &err);
  auto& request = value.get<picojson::object>();

  int id = NOTIFICATION_PRIV_ID_NONE;
  int ret = NOTIFICATION_ERROR_NONE;
  notification_h noti = NULL;

  if (isUpdate) {
    id = std::stoi(request["id_"].to_str());
    LOGD("notification_load");
    noti = notification_load(NULL, id);
    if (noti == NULL) {
      LOGE("Not found or removed notification id");
      return;
    }
  } else {
    if (request["type_"].to_str() == "TYPE_NOTI") {
      LOGD("Create notification, type: TYPE_NOTI");
      noti = notification_create(NOTIFICATION_TYPE_NOTI);
    } else if (request["type_"].to_str() == "TYPE_ONGOING") {
      LOGD("Create notification, type: TYPE_ONGOING");
      noti = notification_create(NOTIFICATION_TYPE_ONGOING);
    }
  }
  notification_add_button(noti, NOTIFICATION_BUTTON_1);
  notification_set_event_handler(noti, NOTIFICATION_EVENT_TYPE_CLICK_ON_BUTTON_1, NULL);
  //notification_add_button(noti, NOTIFICATION_BUTTON_1);

  picojson::value dictionary = request["dictionary_"];

  if (dictionary.contains("iconPath")) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_ICON,
                                 dictionary.get("iconPath").to_str().c_str());
    LOGD("@ iconPath set %s", dictionary.get("iconPath").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ iconPath set FAIL");
    }
  }

  if (dictionary.contains("iconForIndicatorPath")) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_ICON_FOR_INDICATOR,
                                 dictionary.get("iconForIndicatorPath").to_str().c_str());
    LOGD("@ iconForIndicatorPath set : %s",
      dictionary.get("iconForIndicatorPath").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ iconForIndicatorPath set FAIL");
    }
  }

  if (dictionary.contains("iconForLockPath")) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_ICON_FOR_LOCK,
                                 dictionary.get("iconForLockPath").to_str().c_str());
    LOGD("@ iconForLockPath set : %s", dictionary.get("iconForLockPath").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ iconForLockPathset FAIL");
    }
  }

  if (dictionary.contains("thumbnailPath")) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_THUMBNAIL,
                                 dictionary.get("thumbnailPath").to_str().c_str());
    LOGD("@ thumbnailPath set :  %s", dictionary.get("thumbnailPath").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ thumbnailPath FAIL");
    }
  }

  if (dictionary.contains("title")) {
    ret = notification_set_text(noti, NOTIFICATION_TEXT_TYPE_TITLE,
                                dictionary.get("title").to_str().c_str(), NULL,
                                NOTIFICATION_VARIABLE_TYPE_NONE);
    LOGD("@ title set :  %s", dictionary.get("title").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ title set FAIL");
    }
  }

  if (dictionary.contains("content")) {
    ret = notification_set_text(noti, NOTIFICATION_TEXT_TYPE_CONTENT ,
                                dictionary.get("content").to_str().c_str(), NULL,
                                NOTIFICATION_VARIABLE_TYPE_NONE);
    LOGD("@ content set :  %s", dictionary.get("content").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ content set FAIL");
    }
  }

  if (dictionary.contains("timestamp")) {
    ret = notification_set_time(noti, std::stod(dictionary.get("timestamp").to_str()));
    LOGD("@ timestamp set %s ", dictionary.get("timestamp").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ timestamp set FAIL");
    }
  }

  if (dictionary.contains("sound")) {
    if (dictionary.get("sound").to_str().compare("NONE") == 0) {
      ret = notification_set_sound(noti, NOTIFICATION_SOUND_TYPE_NONE, NULL);
    } else if (dictionary.get("sound").to_str().compare("DEFAULT") == 0) {
      ret = notification_set_sound(noti, NOTIFICATION_SOUND_TYPE_DEFAULT, NULL);
    } else {
      ret = notification_set_sound(noti, NOTIFICATION_SOUND_TYPE_USER_DATA,
                                   dictionary.get("sound").to_str().c_str());
    }
    LOGD("@ sound set %s ", dictionary.get("sound").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ sound set FAIL");
    }
  }

  if (dictionary.contains("vibration")) {
    if (dictionary.get("vibration").to_str().compare("NONE") == 0) {
      ret = notification_set_vibration(noti, NOTIFICATION_VIBRATION_TYPE_NONE, NULL);
    } else if (dictionary.get("vibration").to_str().compare("DEFAULT") == 0) {
      ret = notification_set_vibration(noti, NOTIFICATION_VIBRATION_TYPE_DEFAULT, NULL);
    } else {
      ret = notification_set_vibration(noti, NOTIFICATION_VIBRATION_TYPE_USER_DATA,
                                       dictionary.get("vibration").to_str().c_str());
    }
    LOGD("@ vibration set %s ", dictionary.get("vibration").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ vibration set FAIL");
    }
  }

  if (dictionary.contains("led")) {
    if (dictionary.get("led").to_str().compare("OFF") == 0) {
      ret = notification_set_led(noti, NOTIFICATION_LED_OP_OFF, NULL);
    } else if (dictionary.get("led").to_str().compare("ON") == 0) {
      ret = notification_set_led(noti, NOTIFICATION_LED_OP_ON, NULL);
    } else {
      ret = notification_set_led(noti, NOTIFICATION_LED_OP_ON_CUSTOM_COLOR,
                                 std::stoi(dictionary.get("led").to_str()));
    }
    LOGD("@ led set %s ", dictionary.get("led").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ led set FAIL");
    }
  }

  if (dictionary.contains("ledOnPeriod") && dictionary.contains("ledOffPeriod")) {
    int ledOnPeriod = std::stoi(dictionary.get("ledOnPeriod").to_str());
    int ledOffPeriod = std::stoi(dictionary.get("ledOffPeriod").to_str());
    if ((ledOnPeriod != 0) && (ledOffPeriod != 0)) {
      ret = notification_set_led_time_period(noti, ledOnPeriod, ledOffPeriod);
    }
    LOGD("@ ledOnPeriod set %s ", dictionary.get("ledOnPeriod").to_str().c_str());
    LOGD("@ ledOffPeriod set %s ", dictionary.get("ledOffPeriod").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ led period set FAIL");
    }
  } else if (dictionary.contains("ledOnPeriod")
               || dictionary.contains("ledOffPeriod")) {
      LOGE("ledOnPeriod and ledOffPeriod must be pair");
  }

  if (dictionary.contains("autoRemove")) {
    bool autoRemove = true;
    if (dictionary.get("autoRemove").to_str().compare("TRUE") != 0) {
      autoRemove = false;
    }
    ret = notification_set_auto_remove(noti, autoRemove);
    LOGD("@ autoRemove set %d ", autoRemove);
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ autoRemove set FAIL");
    }
  }

  notification_type_e notiType;
  notification_get_type(noti, &notiType);
  if (notiType == NOTIFICATION_TYPE_ONGOING) {
    if (dictionary.contains("size")) {
      ret = notification_set_size(noti, std::stod(dictionary.get("size").to_str()));
      LOGD("@ size set %f ", std::stod(dictionary.get("size").to_str()));
      if (ret != NOTIFICATION_ERROR_NONE) {
        LOGD("@ size set FAIL");
      }
    }

    if (dictionary.contains("progress")) {
      ret = notification_set_progress(noti, std::stod(dictionary.get("progress").to_str()));
      LOGD("@ progress set %f ", std::stod(dictionary.get("progress").to_str()));
      if (ret != NOTIFICATION_ERROR_NONE) {
        LOGD("@ progress set FAIL");
      }
    }
  }

  picojson::value::object obj;
  if (isUpdate) {
    ret = notification_update(noti);
    if (ret  != NOTIFICATION_ERROR_NONE) {
      LOGE("Update notification Fail");
      obj["result"] = picojson::value("FAIL");
      obj["reason"] = picojson::value("Update notification Fail");
      SendSyncReply(picojson::value(obj).serialize().c_str());
      return;
    }
    obj["result"] = picojson::value("OK");
  } else {
    ret = notification_insert(noti, &id);
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGE("Post notification Fail");
      obj["result"] = picojson::value("FAIL");
      if (ret == NOTIFICATION_ERROR_PERMISSION_DENIED) {
        obj["reason"] = picojson::value("PERMISSION DENIED");
      } else {
        obj["reason"] = picojson::value("Post notification Fail");
      }
    SendSyncReply(picojson::value(obj).serialize().c_str());
    return;
    } else {
      LOGD("Post notification Success");
      obj["result"] = picojson::value("OK");
      obj["id"] = picojson::value(std::to_string(id));
    }
  }
  time_t insertionTime = 0;
  notification_get_insert_time(noti, &insertionTime);
  obj["insertionTime"] = picojson::value(static_cast<double>(insertionTime) * 1000.0);
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

}  // namespace notification

/* @macro EXPORT_XWALK_EXTENSION
 *
 * The implemented sub-class of XWalkExtension should be exported with
 * EXPORT_XWALK_EXTENSION(name, class) macro.
 */
EXPORT_XWALK_EXTENSION(notification, notification::NotificationExtension);
