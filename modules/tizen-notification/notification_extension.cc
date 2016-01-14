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
    //LOGD("@@@@@@ request [content] : %s", request["content"].to_str().c_str());
    //EchoMessage(request["asyncid"].to_str(), request["msg"].to_str());
    Post(msg);
  }
}

void NotificationInstance::Post(const char* msg) {
  LOGD("@ NotificationInstance::Post() Code Here");
  picojson::value value;
  std::string err;
  picojson::parse(value, msg, msg + strlen(msg), &err);
  auto& request = value.get<picojson::object>();

  int ret = NOTIFICATION_ERROR_NONE;
  notification_h noti = notification_create(NOTIFICATION_TYPE_NOTI);

  auto found = request.find("iconPath");
  if (found != request.end()) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_ICON, request["iconPath"].to_str().c_str());
    LOGD("@ iconPath set");
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ iconPath set FAIL");
    }
  }

  found = request.find("iconForIndicatorPath");
  if (found != request.end()) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_ICON_FOR_INDICATOR, request["iconForIndicatorPath"].to_str().c_str());
    LOGD("@ iconForIndicatorPath set : " + request["iconForIndicatorPath"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ iconForIndicatorPath set FAIL");
    }
  }

  found = request.find("iconForLockPath");
  if (found != request.end()) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_ICON_FOR_LOCK , request["iconForLockPath"].to_str().c_str());
    LOGD("@ iconForLockPath set : " + request["iconForLockPath"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ iconForLockPathset FAIL");
    }
  }

  found = request.find("thumbnailPath");
  if (found != request.end()) {
    ret = notification_set_image(noti, NOTIFICATION_IMAGE_TYPE_THUMBNAIL , request["thumbnailPath"].to_str().c_str());
    LOGD("@ thumbnailPath set : " + request["thumbnailPath"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ thumbnailPath FAIL");
    }
  }

  found = request.find("title");
  if (found != request.end()) {
    ret = notification_set_text(noti, NOTIFICATION_TEXT_TYPE_TITLE , request["title"].to_str().c_str(), NULL, NOTIFICATION_VARIABLE_TYPE_NONE);
    LOGD("@ title set : " + request["title"].to_str().c_str()););
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ title set FAIL");
    }
  }

  found = request.find("content");
  if (found != request.end()) {
    ret = notification_set_text(noti, NOTIFICATION_TEXT_TYPE_CONTENT , request["content"].to_str().c_str(), NULL, NOTIFICATION_VARIABLE_TYPE_NONE);
    LOGD("@ content set : " + request["content"].to_str().c_str());
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ content set FAIL");
    }
  }

  found = request.find("timestamp");
  if (found != request.end()) {
    ret = notification_set_time(noti, time(NULL));
    LOGD("@ timestamp set" + request["timestamp"].to_str().c_str());
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
    LOGD("@ sound set");
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
    LOGD("@ vibration set");
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ vibration set FAIL");
    }
  }

  found = request.find("");
  if (found != request.end()) {
    ret = notification_set_();
    LOGD("@ set");
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ set FAIL");
    }
  }

  found = request.find("");
  if (found != request.end()) {
    ret = notification_set_();
    LOGD("@ set");
    if (ret != NOTIFICATION_ERROR_NONE) {
      LOGD("@ set FAIL");
    }
  }


  ret = notification_post(noti);
  picojson::object obj;
  if (ret != NOTIFICATION_ERROR_NONE) {
    obj["result"] = picojson::value("FAIL");
    if(ret == NOTIFICATION_ERROR_PERMISSION_DENIED) {
      obj["reason"] = picojson::value("PERMISSION DENIED");
    } else {
      obj["reason"] = picojson::value("Post notification Fail");
    }
  } else {
    LOGD("@@@@@@ result OK");
    obj["result"] = picojson::value("OK");
  }
  SendSyncReply(picojson::value(obj).serialize().c_str());
  notification_free(noti);
}

}  // namespace sample

/* @macro EXPORT_XWALK_EXTENSION
 *
 * The implemented sub-class of XWalkExtension should be exported with
 * EXPORT_XWALK_EXTENSION(name, class) macro.
 */
EXPORT_XWALK_EXTENSION(notification, sample::NotificationExtension);
