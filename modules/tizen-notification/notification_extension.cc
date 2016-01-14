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
#include <app_control.h>
#include <dlog.h>

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
  if (cmd == "getNotification") {
    int id = NOTIFICATION_PRIV_ID_NONE;
    try {
      id = std::stoi(request["id"].to_str());
    } catch(...) {
      LOGE("convert notification id to integer failed");
    }
    GetNotification(request["asyncid"].to_str(), id);
  }
}

void NotificationInstance::GetNotification(const std::string& async_id,
                                           const int id) {
  picojson::value::object obj;
  obj["asyncid"] = picojson::value(async_id);
  notification_h noti_handle;
  GetNotificationHandle(id, &noti_handle);
  // HandleToJson(noti_handle);
  // TODO: implement HandleToJson()

  obj["result"] = picojson::value("OK");
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
    PostOrUpdate(value, false);
  } else if (cmd == "update") {
    std::string type = request["type_"].to_str();
    if (type != "TYPE_ONGOING") {
      LOGE("Only ONGOING type notification supports update().");
      return;
    }
    PostOrUpdate(value, true);
  } else if (cmd == "remove") {
    int id = NOTIFICATION_PRIV_ID_NONE;
    try {
      id = std::stoi(request["id"].to_str());
    } catch(...) {
      LOGE("convert notification id to integer failed");
    }
    Remove(id);
  } else if (cmd == "removeAll") {
    RemoveAll();
  } else if (cmd == "getPkgname") {
    int id = NOTIFICATION_PRIV_ID_NONE;
    try {
      id = std::stoi(request["id"].to_str());
    } catch(...) {
      LOGE("convert notification id to integer failed");
    }
    GetPkgname(id);
  } else if (cmd == "postStatusMessage") {
    PostStatusMessage(request["asyncid"].to_str(), request["message"].to_str());
  }
}

void NotificationInstance::AddButton(notification_h& noti,
                                     picojson::value& dictionary,
                                     notification_button_index_e buttonIndex,
                                     notification_text_type_e buttonTextType,
                                     std::string imagePath) {
  notification_add_button(noti, buttonIndex);
  notification_set_text(noti, buttonTextType ,
                        dictionary.get("button1Label").to_str().c_str(),
                        NULL, NOTIFICATION_VARIABLE_TYPE_NONE);

  picojson::value appCtrl = dictionary.get("appControl");
  const char* appCtrlString = appCtrl.to_str().c_str();
  picojson::value v;
  std::string err;
  picojson::parse(v, appCtrlString, appCtrlString + strlen(appCtrlString),
                  &err);
  if (!err.empty()) {
    LOGE("Parsing the appControl error: %s", err.c_str());
  }
  picojson::object appCtrlObj;
  appCtrlObj = v.get<picojson::object>();

  app_control_h appControl;
  app_control_create(&appControl);
  const char* operation = appCtrlObj["__APP_SVC_OP_TYPE__"].to_str().c_str();
  LOGD("@ appControl operation set %s ", operation);
  app_control_set_operation(appControl, operation);
  auto found = appCtrlObj.find("__APP_SVC_URI__");
  if (found != appCtrlObj.end()) {
    const char* uri = appCtrlObj["__APP_SVC_URI__"].to_str().c_str();
    LOGD("@ appControl uri set %s ", uri);
    app_control_set_uri(appControl, uri);
  }
  found = appCtrlObj.find("__APP_SVC_MIME_TYPE__");
  if (found != appCtrlObj.end()) {
    const char* mime = appCtrlObj["__APP_SVC_MIME_TYPE__"].to_str().c_str();
    LOGD("@ appControl mime set %s ", mime);
    app_control_set_mime(appControl, mime);
  }
  found = appCtrlObj.find("__APP_SVC_CATEGORY__");
  if (found != appCtrlObj.end()) {
    const char* category = appCtrlObj["__APP_SVC_CATEGORY__"].to_str().c_str();
    LOGD("@ appControl category set %s ", category);
    app_control_set_category(appControl, category);
  }

  int ret = notification_set_event_handler(noti, NOTIFICATION_EVENT_TYPE_CLICK_ON_BUTTON_1,
                                           appControl);
  if (ret != 0) {
    LOGE("BUTTON1, notification_set_event_handler() ERROR");
    return;
  }
}

void NotificationInstance::PostOrUpdate(picojson::value& value, bool isUpdate) {
  LOGD("NotificationInstance::PostOrUpdate() execution");
  auto& request = value.get<picojson::object>();

  int id = NOTIFICATION_PRIV_ID_NONE;
  int ret = NOTIFICATION_ERROR_NONE;
  notification_h noti = NULL;
  std::string type = request["type_"].to_str();
  picojson::value dictionary = request["dictionary_"];

  if (isUpdate) {
    try {
      id = std::stoi(request["id_"].to_str());
    } catch (...) {
      LOGE("convert notification id to integer failed");
    }
    LOGD("notification_load, id : %d", id);
    noti = notification_load(NULL, id);
    if (noti == NULL) {
      LOGE("Not found or removed notification id");
      return;
    }
  } else {
    if (type == "TYPE_NOTI") {
      LOGD("Create notification, type: TYPE_NOTI");
      noti = notification_create(NOTIFICATION_TYPE_NOTI);
    } else if (type == "TYPE_ONGOING") {
      LOGD("Create notification, type: TYPE_ONGOING");
      noti = notification_create(NOTIFICATION_TYPE_ONGOING);
    } else if (type == "TYPE_ACTIVE") {
      noti = notification_create(NOTIFICATION_TYPE_NOTI);
      notification_set_display_applist(noti, NOTIFICATION_DISPLAY_APP_ACTIVE);
    }
  }

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

  if (dictionary.contains("subIconPath")) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_ICON_SUB ,
                                 dictionary.get("subIconPath").to_str().c_str());
    LOGD("@ subIconPath set :  %s", dictionary.get("subIconPath").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ subIconPath FAIL");
    }
  }

  if (dictionary.contains("backgroundImagePath")) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_BACKGROUND,
                                 dictionary.get("backgroundImagePath").to_str().c_str());
    LOGD("@ backgroundImagePath set :  %s", dictionary.get("backgroundImagePath").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ backgroundImagePath FAIL");
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

  if (dictionary.contains("ledOption")) {
    std::string led = dictionary.get("ledOption").to_str();
    if (led.compare("LED_OFF") == 0) {
      ret = notification_set_led(noti, NOTIFICATION_LED_OP_OFF, NULL);
      if (ret != NOTIFICATION_ERROR_NONE) {
        LOGD("@ led set FAIL");
      }
    } else if (led.compare("LED_ON") == 0) {
      if (dictionary.contains("customColor")) {
        ret = notification_set_led(noti, NOTIFICATION_LED_OP_ON_CUSTOM_COLOR,
                                   (int)dictionary.get("customColor").get<double>());
        if (ret != NOTIFICATION_ERROR_NONE) {
          LOGD("@ led set FAIL");
        }
        LOGD("@ led custom color set %s ", (int)dictionary.get("customColor").get<double>());
      } else {
        ret = notification_set_led(noti, NOTIFICATION_LED_OP_ON, NULL);
        if (ret != NOTIFICATION_ERROR_NONE) {
          LOGD("@ led set FAIL");
        }
      }
      LOGD("@ led set %s ", dictionary.get("ledOption").to_str().c_str());
      if (dictionary.contains("ledOnPeriod") && dictionary.contains("ledOffPeriod")) {
        int ledOnPeriod = (int)dictionary.get("ledOnPeriod").get<double>();
        int ledOffPeriod = (int)dictionary.get("ledOffPeriod").get<double>();
        ret = notification_set_led_time_period(noti, ledOnPeriod, ledOffPeriod);
        if (ret != NOTIFICATION_ERROR_NONE) {
          LOGD("@ led period set FAIL");
        }
        LOGD("@ ledOnPeriod set %d ", (int)dictionary.get("ledOnPeriod").get<double>());
        LOGD("@ ledOffPeriod set %d ", (int)dictionary.get("ledOffPeriod").get<double>());
      }
    }
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

  if (dictionary.contains("ActionAppControl")) {
    picojson::value appCtrl = dictionary.get("ActionAppControl");
    const char* appCtrlString = appCtrl.to_str().c_str();
    picojson::value v;
    std::string err;
    picojson::parse(v, appCtrlString, appCtrlString + strlen(appCtrlString), &err);
    if (!err.empty()) {
      LOGE("Parsing the appControl error: %s", err.c_str());
    }
    picojson::object appCtrlObj;
    appCtrlObj = v.get<picojson::object>();

    app_control_h appControl;
    app_control_create(&appControl);
    const char* operation = appCtrlObj["__APP_SVC_OP_TYPE__"].to_str().c_str();
    LOGD("@ appControl operation set %s ", operation);
    app_control_set_operation(appControl, operation);
    auto found = appCtrlObj.find("__APP_SVC_URI__");
    if (found != appCtrlObj.end()) {
      const char* uri = appCtrlObj["__APP_SVC_URI__"].to_str().c_str();
      LOGD("@ appControl uri set %s ", uri);
      app_control_set_uri(appControl, uri);
    }
    found = appCtrlObj.find("__APP_SVC_MIME_TYPE__");
    if (found != appCtrlObj.end()) {
      const char* mime = appCtrlObj["__APP_SVC_MIME_TYPE__"].to_str().c_str();
      LOGD("@ appControl mime set %s ", mime);
      app_control_set_mime(appControl, mime);
    }
    found = appCtrlObj.find("__APP_SVC_CATEGORY__");
    if (found != appCtrlObj.end()) {
      const char* category = appCtrlObj["__APP_SVC_CATEGORY__"].to_str().c_str();
      LOGD("@ appControl category set %s ", category);
      app_control_set_category(appControl, category);
    }
    if (dictionary.contains("ActionAppId")) {
      app_control_set_app_id(appControl, dictionary.get("ActionAppId").to_str().c_str());
    }

    ret = notification_set_launch_option(noti,
                                         NOTIFICATION_LAUNCH_OPTION_APP_CONTROL,
                                         (void *)appControl);
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ appControl set FAIL");
    }
  }

  // can be deprecated
  if (dictionary.contains("appControl")) {
    picojson::value appCtrl = dictionary.get("appControl");
    const char* appCtrlString = appCtrl.to_str().c_str();
    picojson::value v;
    std::string err;
    picojson::parse(v, appCtrlString, appCtrlString + strlen(appCtrlString), &err);
    if (!err.empty()) {
      LOGE("Parsing the appControl error: %s", err.c_str());
    }
    picojson::object appCtrlObj;
    appCtrlObj = v.get<picojson::object>();

    app_control_h appControl;
    app_control_create(&appControl);
    const char* operation = appCtrlObj["__APP_SVC_OP_TYPE__"].to_str().c_str();
    LOGD("@ appControl operation set %s ", operation);
    app_control_set_operation(appControl, operation);
    auto found = appCtrlObj.find("__APP_SVC_URI__");
    if (found != appCtrlObj.end()) {
      const char* uri = appCtrlObj["__APP_SVC_URI__"].to_str().c_str();
      LOGD("@ appControl uri set %s ", uri);
      app_control_set_uri(appControl, uri);
    }
    found = appCtrlObj.find("__APP_SVC_MIME_TYPE__");
    if (found != appCtrlObj.end()) {
      const char* mime = appCtrlObj["__APP_SVC_MIME_TYPE__"].to_str().c_str();
      LOGD("@ appControl mime set %s ", mime);
      app_control_set_mime(appControl, mime);
    }
    found = appCtrlObj.find("__APP_SVC_CATEGORY__");
    if (found != appCtrlObj.end()) {
      const char* category = appCtrlObj["__APP_SVC_CATEGORY__"].to_str().c_str();
      LOGD("@ appControl category set %s ", category);
      app_control_set_category(appControl, category);
    }

    ret = notification_set_launch_option(noti,
                                         NOTIFICATION_LAUNCH_OPTION_APP_CONTROL,
                                         (void *)appControl);
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ appControl set FAIL");
    }
  }

  if (type == "TYPE_ONGOING") {
    if (dictionary.contains("progressSize")) {
      ret = notification_set_size(noti, dictionary.get("progressSize").get<double>());
      LOGD("@ progressSize set %f ", dictionary.get("progressSize").get<double>());
      if (ret != NOTIFICATION_ERROR_NONE) {
        LOGD("@ progressSize set FAIL");
      }
    }

    if (dictionary.contains("progressPercentage")) {
      ret = notification_set_progress(noti, dictionary.get("progressPercentage").get<double>());
      LOGD("@ progressPercentage set %f ", dictionary.get("progressPercentage").get<double>());
      if (ret != NOTIFICATION_ERROR_NONE) {
        LOGD("@ progressPercentage set FAIL");
      }
    }
  }

  if (type == "TYPE_ACTIVE") {
      notification_button_index_e buttonIndex;
      notification_text_type_e buttonTextType;
      std::string imagePath;

    if (dictionary.get("button1").to_str() == "ADD") {
      buttonIndex = NOTIFICATION_BUTTON_1;
      buttonTextType = NOTIFICATION_TEXT_TYPE_BUTTON_1;
      if (dictionary.contains("button1ImagePath")) {
        imagePath = dictionary.get("button1ImagePath").to_str();
      }
      AddButton(noti, dictionary, buttonIndex, buttonTextType, imagePath);
    }
    if (dictionary.get("button2").to_str() == "ADD") {
      buttonIndex = NOTIFICATION_BUTTON_2;
      buttonTextType = NOTIFICATION_TEXT_TYPE_BUTTON_2;
      if (dictionary.contains("button2ImagePath")) {
        imagePath = dictionary.get("button2ImagePath").to_str();
      }
      AddButton(noti, dictionary, buttonIndex, buttonTextType, imagePath);
    }
    if (dictionary.get("button3").to_str() == "ADD") {
      buttonIndex = NOTIFICATION_BUTTON_3;
      buttonTextType = NOTIFICATION_TEXT_TYPE_BUTTON_3;
      if (dictionary.contains("button3ImagePath")) {
        imagePath = dictionary.get("button3ImagePath").to_str();
      }
      AddButton(noti, dictionary, buttonIndex, buttonTextType, imagePath);
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

void NotificationInstance::Remove(const int notification_id) {
  picojson::value::object obj;
  int ret = notification_delete_by_priv_id(NULL, NOTIFICATION_TYPE_NONE, notification_id);
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
  int ret = notification_get_pkgname(noti_handle, &pkgname);
  picojson::value::object obj;
  if(ret != NOTIFICATION_ERROR_NONE) {
    obj["result"] = picojson::value("FAIL");
    obj["reason"] = picojson::value("notification_get_pkgname() Failed");
  } else {
    obj["result"] = picojson::value("OK");
    obj["pkgname"] = picojson::value(pkgname);
  }
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

void NotificationInstance::PostStatusMessage(const std::string& async_id,
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
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

}  // namespace notification

/* @macro EXPORT_XWALK_EXTENSION
 *
 * The implemented sub-class of XWalkExtension should be exported with
 * EXPORT_XWALK_EXTENSION(name, class) macro.
 */
EXPORT_XWALK_EXTENSION(notification, notification::NotificationExtension);
