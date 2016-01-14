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

#include "notification_extension.h"

#include <notification.h>
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
 * can be handled using 'extension.setMessageListener()' in notification_api.js also.
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
    PostOrUpdate(msg, false);
  } else if (cmd == "update") {
    PostOrUpdate(msg, true);
  } else if (cmd == "getPkgname") {
    GetPkgname(std::stoi(request["id"].to_str()));
  }
}

void NotificationInstance::GetPkgname(const int id) {
  notification_h noti_handle = NULL;
  noti_handle = notification_load(NULL, id);
  if (noti_handle == NULL) {
      LOGE("Not found or removed notification id");
      return;
  }
  char* pkgname = NULL;
  notification_get_pkgname(noti_handle, &pkgname);
  SendSyncReply(pkgname);
}

void NotificationInstance::PostOrUpdate(const char* msg, bool isUpdate) {
  LOGD("@ NotificationInstance::Post() Code Here");
  picojson::value value;
  std::string err;
  picojson::parse(value, msg, msg + strlen(msg), &err);
  auto& request = value.get<picojson::object>();

  int id = NOTIFICATION_PRIV_ID_NONE;
  int ret = NOTIFICATION_ERROR_NONE;
  notification_h noti = NULL;
  if (isUpdate) {
    id = std::stoi(request["id"].to_str());
    noti = notification_load(NULL, id);
    if (noti == NULL) {
      LOGE("Not found or removed notification id");
      return;
    }
  } else {
    noti = notification_create(NOTIFICATION_TYPE_NOTI);
  }

  auto found = request.find("iconPath");
  if (found != request.end()) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_ICON, request["iconPath"].to_str().c_str());
    LOGD("@ iconPath set %s", request["iconPath"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ iconPath set FAIL");
    }
  }

  found = request.find("iconForIndicatorPath");
  if (found != request.end()) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_ICON_FOR_INDICATOR, request["iconForIndicatorPath"].to_str().c_str());
    LOGD("@ iconForIndicatorPath set : %s", request["iconForIndicatorPath"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ iconForIndicatorPath set FAIL");
    }
  }

  found = request.find("iconForLockPath");
  if (found != request.end()) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_ICON_FOR_LOCK , request["iconForLockPath"].to_str().c_str());
    LOGD("@ iconForLockPath set : %s", request["iconForLockPath"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ iconForLockPathset FAIL");
    }
  }

  found = request.find("thumbnailPath");
  if (found != request.end()) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_THUMBNAIL , request["thumbnailPath"].to_str().c_str());
    LOGD("@ thumbnailPath set :  %s", request["thumbnailPath"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ thumbnailPath FAIL");
    }
  }

  found = request.find("title");
  if (found != request.end()) {
    ret = notification_set_text(noti, NOTIFICATION_TEXT_TYPE_TITLE , request["title"].to_str().c_str(), NULL, NOTIFICATION_VARIABLE_TYPE_NONE);
    LOGD("@ title set :  %s", request["title"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ title set FAIL");
    }
  }

  found = request.find("content");
  if (found != request.end()) {
    ret = notification_set_text(noti, NOTIFICATION_TEXT_TYPE_CONTENT , request["content"].to_str().c_str(), NULL, NOTIFICATION_VARIABLE_TYPE_NONE);
    LOGD("@ content set :  %s", request["content"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ content set FAIL");
    }
  }

  found = request.find("timestamp");
  if (found != request.end()) {
    ret = notification_set_time(noti, time(NULL));
    LOGD("@ timestamp set %s ", request["timestamp"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ timestamp set FAIL");
    }
  }

  found = request.find("sound");
  if (found != request.end()) {
    if(request["sound"].to_str().compare("NONE") == 0) {
      ret = notification_set_sound(noti, NOTIFICATION_SOUND_TYPE_NONE, NULL);
    } else if(request["sound"].to_str().compare("DEFAULT") == 0) {
      ret = notification_set_sound(noti, NOTIFICATION_SOUND_TYPE_DEFAULT, NULL);
    } else {
      ret = notification_set_sound(noti, NOTIFICATION_SOUND_TYPE_USER_DATA, request["sound"].to_str().c_str());
    }
    LOGD("@ sound set %s ", request["sound"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ sound set FAIL");
    }
  }

  found = request.find("vibration");
  if (found != request.end()) {
    if(request["vibration"].to_str().compare("NONE") == 0) {
      ret = notification_set_vibration(noti, NOTIFICATION_VIBRATION_TYPE_NONE, NULL);
    } else if(request["vibration"].to_str().compare("DEFAULT") == 0) {
      ret = notification_set_vibration(noti, NOTIFICATION_VIBRATION_TYPE_DEFAULT, NULL);
    } else {
      ret = notification_set_vibration(noti, NOTIFICATION_VIBRATION_TYPE_USER_DATA, request["vibration"].to_str().c_str());
    }
    LOGD("@ vibration set %s ", request["vibration"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ vibration set FAIL");
    }
  }

  found = request.find("led");
  if (found != request.end()) {
    if(request["led"].to_str().compare("OFF") == 0) {
      ret = notification_set_led(noti, NOTIFICATION_LED_OP_OFF, NULL);
    } else if(request["led"].to_str().compare("ON") == 0) {
      ret = notification_set_led(noti, NOTIFICATION_LED_OP_ON, NULL);
    } else {
      ret = notification_set_led(noti, NOTIFICATION_LED_OP_ON_CUSTOM_COLOR, std::stoi(request["led"].to_str()));
    }
    LOGD("@ led set %s ", request["led"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ led set FAIL");
    }
  }

  found = request.find("ledOnPeriod");
  if (found != request.end()) {
    found = request.find("ledOffPeriod");
    if (found != request.end()) {
      int ledOnPeriod = std::stoi(request["ledOnPeriod"].to_str());
      int ledOffPeriod = std::stoi(request["ledOffPeriod"].to_str());
      if((ledOnPeriod != 0) && (ledOffPeriod != 0)) {
        ret = notification_set_led_time_period(noti, ledOnPeriod, ledOffPeriod);
      }
      LOGD("@ ledOnPeriod set %s ", request["ledOnPeriod"].to_str().c_str());
      LOGD("@ ledOfPeriod set %s ", request["ledOfPeriod"].to_str().c_str());
      if (ret != NOTIFICATION_ERROR_NONE) {
        LOGD("@ led period set FAIL");
      }
    } else {
      LOGE("ledOnPeriod must be pair with ledOffPeriod");
    }
  }

  found = request.find("autoRemove");
  if (found != request.end()) {
    bool autoRemove = true;
    if(request["autoRemove"].to_str().compare("TRUE") != 0) {
      autoRemove = false;
    }
    ret = notification_set_auto_remove(noti, autoRemove);
    LOGD("@ autoRemove set %d ", autoRemove);
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ autoRemove set FAIL");
    }
  }
/*
  found = request.find("");
  if (found != request.end()) {
    ret = notification_set_();
    LOGD("@ set");
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ set FAIL");
    }
  }
*/

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
  //notification_free(noti);
}

}  // namespace sample

/* @macro EXPORT_XWALK_EXTENSION
 *
 * The implemented sub-class of XWalkExtension should be exported with
 * EXPORT_XWALK_EXTENSION(name, class) macro.
 */
EXPORT_XWALK_EXTENSION(notification, sample::NotificationExtension);
