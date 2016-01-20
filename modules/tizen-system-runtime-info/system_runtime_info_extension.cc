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

#include "system_runtime_info_extension.h"

#include <dlog.h>
#include <vector>
#include <memory>

#include "picojson.h"

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace system_runtime_info {

static const std::map<std::string, runtime_info_key_e> runtimeInfoKeyIntMap = {
  {"RUNTIME_INFO_KEY_GPS_STATUS", RUNTIME_INFO_KEY_GPS_STATUS },
};

static const std::map<std::string, runtime_info_key_e> runtimeInfoKeyBoolMap = {
  {"RUNTIME_INFO_KEY_BLUETOOTH_ENABLED", RUNTIME_INFO_KEY_BLUETOOTH_ENABLED },
  {"RUNTIME_INFO_KEY_WIFI_HOTSPOT_ENABLED", RUNTIME_INFO_KEY_WIFI_HOTSPOT_ENABLED  },
  {"RUNTIME_INFO_KEY_BLUETOOTH_TETHERING_ENABLED", RUNTIME_INFO_KEY_BLUETOOTH_TETHERING_ENABLED },
  {"RUNTIME_INFO_KEY_USB_TETHERING_ENABLED ", RUNTIME_INFO_KEY_USB_TETHERING_ENABLED  },
  {"RUNTIME_INFO_KEY_LOCATION_SERVICE_ENABLED", RUNTIME_INFO_KEY_LOCATION_SERVICE_ENABLED },
  {"RUNTIME_INFO_KEY_LOCATION_NETWORK_POSITION_ENABLED", RUNTIME_INFO_KEY_LOCATION_NETWORK_POSITION_ENABLED },
  {"RUNTIME_INFO_KEY_PACKET_DATA_ENABLED", RUNTIME_INFO_KEY_PACKET_DATA_ENABLED },
  {"RUNTIME_INFO_KEY_DATA_ROAMING_ENABLED ", RUNTIME_INFO_KEY_DATA_ROAMING_ENABLED  },
  {"RUNTIME_INFO_KEY_VIBRATION_ENABLED", RUNTIME_INFO_KEY_VIBRATION_ENABLED },
  {"RUNTIME_INFO_KEY_AUDIO_JACK_CONNECTED", RUNTIME_INFO_KEY_AUDIO_JACK_CONNECTED },
  {"RUNTIME_INFO_KEY_BATTERY_IS_CHARGING", RUNTIME_INFO_KEY_BATTERY_IS_CHARGING },
  {"RUNTIME_INFO_KEY_TV_OUT_CONNECTED ", RUNTIME_INFO_KEY_TV_OUT_CONNECTED  },
  {"RUNTIME_INFO_KEY_AUDIO_JACK_STATUS", RUNTIME_INFO_KEY_AUDIO_JACK_STATUS },
  {"RUNTIME_INFO_KEY_USB_CONNECTED ", RUNTIME_INFO_KEY_USB_CONNECTED  },
  {"RUNTIME_INFO_KEY_CHARGER_CONNECTED", RUNTIME_INFO_KEY_CHARGER_CONNECTED },
  {"RUNTIME_INFO_KEY_AUTO_ROTATION_ENABLED", RUNTIME_INFO_KEY_AUTO_ROTATION_ENABLED },
};

static const std::map<runtime_info_key_e, std::string> keyMapBoolToEnum = {
  {RUNTIME_INFO_KEY_BLUETOOTH_ENABLED, "RUNTIME_INFO_KEY_BLUETOOTH_ENABLED"},
  {RUNTIME_INFO_KEY_WIFI_HOTSPOT_ENABLED, "RUNTIME_INFO_KEY_WIFI_HOTSPOT_ENABLED"},
  {RUNTIME_INFO_KEY_BLUETOOTH_TETHERING_ENABLED, "RUNTIME_INFO_KEY_BLUETOOTH_TETHERING_ENABLED"},
  {RUNTIME_INFO_KEY_USB_TETHERING_ENABLED, "RUNTIME_INFO_KEY_USB_TETHERING_ENABLED "},
  {RUNTIME_INFO_KEY_LOCATION_SERVICE_ENABLED, "RUNTIME_INFO_KEY_LOCATION_SERVICE_ENABLED"},
  {RUNTIME_INFO_KEY_LOCATION_NETWORK_POSITION_ENABLED, "RUNTIME_INFO_KEY_LOCATION_NETWORK_POSITION_ENABLED"},
  {RUNTIME_INFO_KEY_PACKET_DATA_ENABLED, "RUNTIME_INFO_KEY_PACKET_DATA_ENABLED"},
  {RUNTIME_INFO_KEY_DATA_ROAMING_ENABLED, "RUNTIME_INFO_KEY_DATA_ROAMING_ENABLED "},
  {RUNTIME_INFO_KEY_VIBRATION_ENABLED, "RUNTIME_INFO_KEY_VIBRATION_ENABLED"},
  {RUNTIME_INFO_KEY_AUDIO_JACK_CONNECTED,"RUNTIME_INFO_KEY_AUDIO_JACK_CONNECTED"},
  {RUNTIME_INFO_KEY_BATTERY_IS_CHARGING,"RUNTIME_INFO_KEY_BATTERY_IS_CHARGING"},
  {RUNTIME_INFO_KEY_TV_OUT_CONNECTED,"RUNTIME_INFO_KEY_TV_OUT_CONNECTED "},
  {RUNTIME_INFO_KEY_AUDIO_JACK_STATUS, "RUNTIME_INFO_KEY_AUDIO_JACK_STATUS"},
  {RUNTIME_INFO_KEY_USB_CONNECTED, "RUNTIME_INFO_KEY_USB_CONNECTED "},
  {RUNTIME_INFO_KEY_CHARGER_CONNECTED, "RUNTIME_INFO_KEY_CHARGER_CONNECTED"},
  {RUNTIME_INFO_KEY_AUTO_ROTATION_ENABLED, "RUNTIME_INFO_KEY_AUTO_ROTATION_ENABLED"},
};

static const std::map<runtime_info_key_e, std::string> keyMapIntToEnum = {
  {RUNTIME_INFO_KEY_GPS_STATUS, "RUNTIME_INFO_KEY_GPS_STATUS"},
};


static void _runtime_info_changed_cb(runtime_info_key_e key, void *user_data){
  LOGD("Enter [%d]", key);
  std::string _key;

  if(keyMapBoolToEnum.find(key) != keyMapBoolToEnum.end()){
       const auto& iter = keyMapBoolToEnum.find(key);
     _key = iter->second;
  }else if(keyMapIntToEnum.find(key) != keyMapIntToEnum.end()){
       const auto& iter = keyMapIntToEnum.find(key);
     _key = iter->second;
  }else{
       LOGE("not supported key");
  }
  LOGD("key [%s]", _key.c_str());

  SystemRuntimeInfoInstance* instance = static_cast<SystemRuntimeInfoInstance*>(user_data);
  instance->FireSimpleEvent("change", _key);
}

xwalk::XWalkExtensionInstance* SystemRuntimeInfoExtension::CreateInstance() {
  return new SystemRuntimeInfoInstance();
}

void SystemRuntimeInfoInstance::Initialize() {
  LOGD("Created tizen-system-runtime-info instance");

  int ret = RUNTIME_INFO_ERROR_NONE;
  for (const auto& iter : runtimeInfoKeyBoolMap) {
      runtime_info_set_changed_cb(iter.second, _runtime_info_changed_cb, this);
    if(ret != RUNTIME_INFO_ERROR_NONE){
        LOGE("register failed [%d]", ret);
        //LOGE("key[%s, %d] register failed",  iter.first, iter.second);
    }
  }

}

SystemRuntimeInfoInstance::~SystemRuntimeInfoInstance() {
  LOGD("SystemRuntimeInfoInstance destructor");
  int ret = RUNTIME_INFO_ERROR_NONE;

  for (const auto& iter : runtimeInfoKeyBoolMap) {
      runtime_info_unset_changed_cb(iter.second);
    if(ret != RUNTIME_INFO_ERROR_NONE){
        LOGE("register failed [%d]", ret);
        //LOGE("key[%s, %d] unregister failed",  iter.first, iter.second);
    }
  }

}


void SystemRuntimeInfoInstance::HandleMessage(const char* msg) {

}

void SystemRuntimeInfoInstance::HandleSyncMessage(const char* msg) {
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
  LOGD("cmd : %s", cmd.c_str());

  if (cmd == "get") {
    auto& key = request["key"];
    LOGD("key : %s",key.to_str().c_str());
    GetValue(key.to_str());
  }else if(cmd == "getSystemMemoryInfo"){
    GetSystemMemoryInfo();
  }else if(cmd == "getProcessMemoryInfo"){
    LOGD("Enter");
    auto& pidList = request["pidList"].get<picojson::array>();


      for (picojson::array::iterator iter = pidList.begin(); iter != pidList.end(); ++iter) {
          LOGD("menu item value = %s", (*iter).to_str().c_str());
    }
    LOGD("Enter");


    GetProcessMemoryInfo(pidList);
  }else if(cmd == "getCPUUsage"){
    GetCPUUsage();
  } else if (cmd == "set") {
    auto& key = request["key"];
    auto& value = request["value"];
    SetHandler(key.to_str(), value.to_str());
  } else if (cmd == "remove") {
    auto& key = request["key"];
    RemoveHandler(key.to_str());
  } else if (cmd == "keys") {
    KeysHandler();
  } else if (cmd == "clear") {
    ClearHandler();
  } else if (cmd == "has") {
    auto& key = request["key"];
    HasHandler(key.to_str());
  }
}

void SystemRuntimeInfoInstance::GetCPUUsage() {

  LOGD("Enter");
  picojson::value::object result;
  picojson::value::object obj;
  runtime_cpu_usage_s info;

  int ret = runtime_info_get_cpu_usage(&info);
  if (ret != RUNTIME_INFO_ERROR_NONE){
    LOGE("runtime info api failed : %d", ret);
    result["result"] = picojson::value("FAIL");

  }else{
    obj["user"] = picojson::value(std::to_string(info.user));
    obj["system"] = picojson::value(std::to_string(info.system));
    obj["nice"] = picojson::value(std::to_string(info.nice));
    obj["iowait"] = picojson::value(std::to_string(info.iowait));

    result["result"] = picojson::value("SUCCESS");
    result["CPUUsage"] = picojson::value(obj);
  }

  SendSyncReply(picojson::value(result).serialize().c_str());
}


void SystemRuntimeInfoInstance::GetProcessMemoryInfo(picojson::array& pidList) {

  LOGD("Enter");
  picojson::value::object result;
  picojson::value::object obj;
  runtime_memory_info_s info;

  int size = pidList.size();
  int* pid = new int(size);
  process_memory_info_s* memoryList = NULL;
  int idx = 0;


  for (picojson::array::iterator iter = pidList.begin(); iter != pidList.end(); ++iter) {
        LOGD("pid : %s", (*iter).to_str().c_str());
        pid[idx++] = atoi((*iter).to_str().c_str());
  }
  LOGD("Enter %d", size);

  int ret = runtime_info_get_process_memory_info(pid, size, &memoryList);
  if (ret != RUNTIME_INFO_ERROR_NONE){
    LOGE("runtime info api failed : %d", ret);
    result["result"] = picojson::value("FAIL");

  }else{
    obj["total"] = picojson::value(std::to_string(info.total));
    obj["used"] = picojson::value(std::to_string(info.used));
    obj["free"] = picojson::value(std::to_string(info.free));
    obj["cache"] = picojson::value(std::to_string(info.cache));
    obj["swap"] = picojson::value(std::to_string(info.swap));

    result["result"] = picojson::value("SUCCESS");
    result["memoryInfo"] = picojson::value(obj);

    LOGD("Enter");
  }

  SendSyncReply(picojson::value(result).serialize().c_str());
}


void SystemRuntimeInfoInstance::GetSystemMemoryInfo() {

  LOGD("Enter");
  picojson::value::object result;
  picojson::value::object obj;
  runtime_memory_info_s info;

  int ret = runtime_info_get_system_memory_info(&info);
  if (ret != RUNTIME_INFO_ERROR_NONE){
    LOGE("runtime info api failed : %d", ret);
    result["result"] = picojson::value("FAIL");

  }else{
    obj["total"] = picojson::value(std::to_string(info.total));
    obj["used"] = picojson::value(std::to_string(info.used));
    obj["free"] = picojson::value(std::to_string(info.free));
    obj["cache"] = picojson::value(std::to_string(info.cache));
    obj["swap"] = picojson::value(std::to_string(info.swap));

    result["result"] = picojson::value("SUCCESS");
    result["memoryInfo"] = picojson::value(obj);

    LOGD("Enter");
  }

  SendSyncReply(picojson::value(result).serialize().c_str());
}

void SystemRuntimeInfoInstance::GetValue(const std::string& key) {

  if(runtimeInfoKeyBoolMap.find(key) != runtimeInfoKeyBoolMap.end()){
    LOGD("key(bool) finded");
    GetValueBool(key);
    return;
  }else if(runtimeInfoKeyIntMap.find(key) != runtimeInfoKeyIntMap.end()){
    LOGD("key(int) finded");
    GetValueInt(key);
    return;
  }

}

void SystemRuntimeInfoInstance::GetValueBool(const std::string& key) {

  picojson::value::object obj;
  bool value;

  runtime_info_key_e key_e = GetRuntimeInfoKey(key);
  LOGD("key : [%d]", key_e);

  int ret = runtime_info_get_value_bool(key_e, &value);
  if (ret != RUNTIME_INFO_ERROR_NONE){
    LOGE("runtime info api failed : %d", ret);
    return;
  }

  LOGD("[%d]", value);
  if(value == true){
      obj["data"] = picojson::value("true");
  }else{
      obj["data"] = picojson::value("false");
  }

  SendSyncReply(picojson::value(obj).serialize().c_str());
}


void SystemRuntimeInfoInstance::GetValueInt(const std::string& key) {

  picojson::value::object obj;
  int value;

  runtime_info_key_e key_e = GetRuntimeInfoKey(key);
  LOGD("key : [%d]", key_e);

  int ret = runtime_info_get_value_int(key_e, &value);
  if (ret != RUNTIME_INFO_ERROR_NONE){
    LOGE("runtime info api failed : %d", ret);
    return;
  }

  LOGD("[%d]", value);
  obj["data"] = picojson::value(std::to_string(value));

  SendSyncReply(picojson::value(obj).serialize().c_str());
}

runtime_info_key_e SystemRuntimeInfoInstance::GetRuntimeInfoKey(const std::string& key){


  auto iter = runtimeInfoKeyBoolMap.find(key);
  if(iter != runtimeInfoKeyBoolMap.end()){
    return iter->second;
  }

  iter = runtimeInfoKeyIntMap.find(key);
  if(iter != runtimeInfoKeyIntMap.end()){
    return iter->second;
  }else{
        LOGE("not supported key");
      return (runtime_info_key_e)0;
  }


}

void SystemRuntimeInfoInstance::FireSimpleEvent(const std::string& event, const std::string& data) {

  picojson::value::object obj;
  obj["event"] = picojson::value(event);

  obj["data"] = picojson::value(data);
  PostMessage(picojson::value(obj).serialize().c_str());
}


void SystemRuntimeInfoInstance::GetHandler(const std::string& key) {
  picojson::value::object obj;
  char* value = nullptr;
  //preference_get_string(key.c_str(), &value);
  if (value != nullptr) {
    std::unique_ptr<char, decltype(std::free)*> ptr {value, std::free};
    obj["data"] = picojson::value(value);
  }
  PostMessage(picojson::value(obj).serialize().c_str());
}

void SystemRuntimeInfoInstance::SetHandler(const std::string& key,
                                       const std::string& value) {
  //preference_set_string(key.c_str(), value.c_str());
  SendSyncReply("{}");
}

void SystemRuntimeInfoInstance::RemoveHandler(const std::string& key) {
  //preference_remove(key.c_str());
  SendSyncReply("{}");
}

void SystemRuntimeInfoInstance::KeysHandler() {
  picojson::value::object obj;
  picojson::array array = picojson::array();
  /*preference_foreach_item([](const char* key, void* user_data){
    picojson::array* array =
        static_cast<picojson::array*>(user_data);
    array->push_back(picojson::value(key));
    return true;
  }, &array);*/
  obj["data"] = picojson::value(array);
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

void SystemRuntimeInfoInstance::ClearHandler() {
  //preference_remove_all();
  SendSyncReply("{}");
}

void SystemRuntimeInfoInstance::HasHandler(const std::string& key) {
  bool existed = false;
  //preference_is_existing(key.c_str(), &existed);
  picojson::value::object obj;
  obj["data"] = picojson::value(existed);
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

}  // namespace appfw

EXPORT_XWALK_EXTENSION(tizen_application, system_runtime_info::SystemRuntimeInfoExtension);
