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

namespace sample {

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

  if (cmd == "") {
  }
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
  } else if(cmd == "remove") {
    Remove(request["id_"].to_str());
  } else if(cmd == "removeAll") {
    RemoveAll();
  } else if (cmd == "getPkgname") {
    GetPkgname(std::stoi(request["id"].to_str()));
  } else if (cmd == "setEventHandler") {
    std::string eventType = request["eventType"].to_str();
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
    obj["reason"] = picojson::value("Notification remove all(TYPE_NOTI) failed");
    SendSyncReply(picojson::value(obj).serialize().c_str());
    return;
  }

  ret = notification_delete_all(NOTIFICATION_TYPE_ONGOING);
  if (ret != NOTIFICATION_ERROR_NONE) {
    obj["result"] = picojson::value("FAIL");
    obj["reason"] = picojson::value("Notification remove all(TYPE_ONGOING) failed");
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
  if(!button.compare("BUTTON1")) {
    buttonIndex = NOTIFICATION_BUTTON_1;
  } else if(!button.compare("BUTTON2")) {
    buttonIndex = NOTIFICATION_BUTTON_2;
  } else if(!button.compare("BUTTON3")) {
    buttonIndex = NOTIFICATION_BUTTON_3;
  } else if(!button.compare("BUTTON4")) {
    buttonIndex = NOTIFICATION_BUTTON_4;
  } else if(!button.compare("BUTTON5")) {
    buttonIndex = NOTIFICATION_BUTTON_5;
  } else if(!button.compare("BUTTON6")) {
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
  if(ret != NOTIFICATION_ERROR_NONE) {
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
  LOGD("@ NotificationInstance::PostOrUpdate() Code Here");
  picojson::value value;
  std::string err;
  picojson::parse(value, msg, msg + strlen(msg), &err);
  auto& request = value.get<picojson::object>();

  int id = NOTIFICATION_PRIV_ID_NONE;
  int ret = NOTIFICATION_ERROR_NONE;
  notification_h noti = NULL;
  notification_type_e notiType;

  if (isUpdate) {
    id = std::stoi(request["id_"].to_str());
    LOGD("notification_load");
    noti = notification_load(NULL, id);
    if (noti == NULL) {
      LOGE("Not found or removed notification id");
      return;
    }
  } else {
    LOGD("notification_create");
    noti = notification_create(NOTIFICATION_TYPE_NOTI);
  }
  LOGD("notification_get_type");
  notification_get_type(noti, &notiType);
  LOGD("notification_get_type done");

  if(request["dictionary_"].contains("iconPath")) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_ICON,
                                 request["dictionary_"].get("iconPath").to_str().c_str());
    LOGD("@ iconPath set %s", request["dictionary_"].get("iconPath").to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ iconPath set FAIL");
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
      LOGE("@@@@@@ Post notification Fail");
      obj["result"] = picojson::value("FAIL");
      if(ret == NOTIFICATION_ERROR_PERMISSION_DENIED) {
        obj["reason"] = picojson::value("PERMISSION DENIED");
      } else {
        obj["reason"] = picojson::value("Post notification Fail");
      }
    SendSyncReply(picojson::value(obj).serialize().c_str());
    return;
    } else {
      LOGD("@@@@@@ Post notification Success");
      obj["result"] = picojson::value("OK");
      obj["id"] = picojson::value(std::to_string(id));
    }
  }
  time_t insertionTime = 0;
  notification_get_insert_time(noti, &insertionTime);
  obj["insertionTime"] = picojson::value(static_cast<double>(insertionTime) * 1000.0);
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

}  // namespace sample

/* @macro EXPORT_XWALK_EXTENSION
 *
 * The implemented sub-class of XWalkExtension should be exported with
 * EXPORT_XWALK_EXTENSION(name, class) macro.
 */
EXPORT_XWALK_EXTENSION(notification, sample::NotificationExtension);
