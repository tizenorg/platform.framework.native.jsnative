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

#include "alarm_extension.h"

#include <dlog.h>
#include <app_alarm.h>
#include <bundle_internal.h>
#include <app_control.h>
#include <app_control_internal.h>

#include <vector>
#include <memory>

#include "picojson.h"

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace appfw {

namespace {

const int kFlag_map[] = {
  ALARM_WEEK_FLAG_SUNDAY,
  ALARM_WEEK_FLAG_MONDAY,
  ALARM_WEEK_FLAG_TUESDAY,
  ALARM_WEEK_FLAG_WEDNESDAY,
  ALARM_WEEK_FLAG_THURSDAY,
  ALARM_WEEK_FLAG_FRIDAY,
  ALARM_WEEK_FLAG_SATURDAY
};

app_control_h MakeAppControlFromJSON(const std::string& json) {
  bundle* b = nullptr;
  if (bundle_from_json(json.c_str(), &b) != 0) {
    return nullptr;
  }
  app_control_h appcontrol = nullptr;
  app_control_create(&appcontrol);
  app_control_import_from_bundle(appcontrol, b);
  bundle_free(b);
  return appcontrol;
}

void ErrorHandle(int ret, picojson::object* data) {
  picojson::object& result = *data;
  if (ret == ALARM_ERROR_PERMISSION_DENIED) {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("Permission denied");
  } else if (ret == ALARM_ERROR_NOT_PERMITTED_APP) {
    result["result"] = picojson::value("FAIL");
    result["reason"] =
        picojson::value("Target Application is not permitted "
                        "UI application is only permitted.");
  } else if (ret == ALARM_ERROR_INVALID_TIME) {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("Triggered time is invalid");
  } else {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("Fail");
  }
}

}  // namespace


xwalk::XWalkExtensionInstance* AlarmExtension::CreateInstance() {
  return new AlarmInstance();
}

void AlarmInstance::Initialize() {
  LOGD("Created tizen-alarm instance");
}

void AlarmInstance::HandleMessage(const char* msg) {
}

void AlarmInstance::HandleSyncMessage(const char* msg) {
  // parse json object
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
  if (cmd == "scheduleAfter") {
    int after = static_cast<int>(request["after"].get<double>());
    std::string appcontrol_json = request["appcontrol"].to_str();
    std::string target = request["target"].to_str();
    HandleAfterSchduleAfter(appcontrol_json, after, target);
  } else if (cmd == "scheduleAtDate") {
    int64_t date = static_cast<int64_t>(request["date"].get<double>());
    std::string appcontrol_json = request["appcontrol"].to_str();
    std::string target = request["target"].to_str();
    int weeks = 0;
    if (request["weeks"].is<picojson::array>()) {
      auto arr = request["weeks"].get<picojson::array>();
      for (auto& i : arr) {
        int v = static_cast<int>(i.get<double>());
        if (v >= 0 && v <= 6) {
          weeks |= kFlag_map[v];
        }
      }
    }
    HandleAtDate(appcontrol_json, date, weeks, target);
  } else if (cmd == "remove") {
    std::string id = request["id"].to_str();
    HandleRemove(id);
  } else if (cmd == "removeAll") {
    HandleRemoveAll();
  } else if (cmd == "validation") {
    std::string id = request["id"].to_str();
    HandleValidation(id);
  } else if (cmd == "recurrenceWeeks") {
    std::string id = request["id"].to_str();
    HandleRecurrenceWeeks(id);
  } else if (cmd == "scheduleDate") {
    std::string id = request["id"].to_str();
    HandleScheduleDate(id);
  } else if (cmd == "appcontrol") {
    std::string id = request["id"].to_str();
    HandleAppControl(id);
  } else {
    LOGE("Unknown cmd");
  }
}

void AlarmInstance::HandleAfterSchduleAfter(const std::string& appcontrol_json,
                                            int after,
                                            const std::string& targetAppID) {
  picojson::object result;
  app_control_h appcontrol = MakeAppControlFromJSON(appcontrol_json);
  if (appcontrol == nullptr) {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("Invalid appcontrol json data");
    SendSyncReply(picojson::value(result).serialize().c_str());
    return;
  }
  if (!targetAppID.empty()) {
    app_control_set_app_id(appcontrol, targetAppID.c_str());
  }

  int alarm_id = 0;
  int ret = alarm_schedule_once_after_delay(appcontrol, after, &alarm_id);
  if (ret == 0) {
    result["result"] = picojson::value("OK");
    result["id"] = picojson::value(std::to_string(alarm_id));
  } else {
    ErrorHandle(ret, &result);
  }
  SendSyncReply(picojson::value(result).serialize().c_str());
  app_control_destroy(appcontrol);
}

void AlarmInstance::HandleAtDate(const std::string& appcontrol_json,
                                 int64_t date,
                                 int weeks,
                                 const std::string& targetAppID) {
  picojson::object result;
  time_t second = date / 1000;
  struct tm start_date;

  if (nullptr == localtime_r(&second, &start_date)) {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("Invalid date");
    SendSyncReply(picojson::value(result).serialize().c_str());
    return;
  }

  app_control_h appcontrol = MakeAppControlFromJSON(appcontrol_json);
  if (appcontrol == nullptr) {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("Invalid appcontrol json data");
    SendSyncReply(picojson::value(result).serialize().c_str());
    return;
  }
  if (!targetAppID.empty()) {
    app_control_set_app_id(appcontrol, targetAppID.c_str());
  }

  int alarm_id = 0;
  int ret = 0;
  if (weeks) {
    ret = alarm_schedule_once_at_date(appcontrol, &start_date, &alarm_id);
  } else {
    ret = alarm_schedule_with_recurrence_week_flag(appcontrol, &start_date,
                                                   weeks, &alarm_id);
  }
  if (ret == 0) {
    result["result"] = picojson::value("OK");
    result["id"] = picojson::value(std::to_string(alarm_id));
  } else {
    ErrorHandle(ret, &result);
  }
  SendSyncReply(picojson::value(result).serialize().c_str());
  app_control_destroy(appcontrol);
}

void AlarmInstance::HandleRemove(const std::string& id) {
  int alarm_id = atoi(id.c_str());
  alarm_cancel(alarm_id);
  SendSyncReply("{}");
}

void AlarmInstance::HandleRemoveAll() {
  alarm_cancel_all();
  SendSyncReply("{}");
}

void AlarmInstance::HandleValidation(const std::string& id) {
  picojson::object result;
  int alarm_id = atoi(id.c_str());
  struct tm date;
  if (alarm_get_scheduled_date(alarm_id, &date) == 0) {
    result["result"] = picojson::value("OK");
  } else {
    result["result"] = picojson::value("FAIL");
  }
  SendSyncReply(picojson::value(result).serialize().c_str());
}

void AlarmInstance::HandleRecurrenceWeeks(const std::string& id) {
  int alarm_id = atoi(id.c_str());
  picojson::object result;
  picojson::array arr;

  int weeks = 0;
  alarm_get_scheduled_recurrence_week_flag(alarm_id, &weeks);
  for (int i=0; i < 7; i++) {
    if ((kFlag_map[i] & weeks) != 0) {
      arr.push_back(picojson::value(static_cast<double>(i)));
    }
  }
  result["data"] = picojson::value(arr);
  SendSyncReply(picojson::value(result).serialize().c_str());
}

void AlarmInstance::HandleScheduleDate(const std::string& id) {
  int alarm_id = atoi(id.c_str());
  picojson::object result;
  struct tm date;
  if (alarm_get_scheduled_date(alarm_id, &date) == 0) {
    time_t time_value = mktime(&date);
    result["result"] = picojson::value("OK");
    result["data"] = picojson::value(static_cast<double>(time_value*1000));
  }
  SendSyncReply(picojson::value(result).serialize().c_str());
}

void AlarmInstance::HandleAppControl(const std::string& id) {
  int alarm_id = atoi(id.c_str());
  picojson::object result;
  app_control_h appcontrol = nullptr;

  if (alarm_get_app_control(alarm_id, &appcontrol) == 0) {
    bundle* b = nullptr;
    app_control_to_bundle(appcontrol, &b);
    char* json = nullptr;
    if (bundle_to_json(b, &json) == 0) {
      result["result"] = picojson::value("OK");
      result["data"] = picojson::value(json);
      free(json);
    }
    bundle_free(b);
    app_control_destroy(appcontrol);
  }
  SendSyncReply(picojson::value(result).serialize().c_str());
}

}  // namespace appfw

EXPORT_XWALK_EXTENSION(tizen_alarm, appfw::AlarmExtension);
