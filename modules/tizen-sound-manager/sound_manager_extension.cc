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

 #include "sound_manager_extension.h"
 #include "sound_manager_util.h"

 #include <dlog.h>

 #ifdef LOG_TAG
 #undef LOG_TAG
 #endif
 #define LOG_TAG "JSNative"

namespace sound {

xwalk::XWalkExtensionInstance* SoundManagerExtension::CreateInstance() {
  return new SoundManagerInstance();
}

void ErrorHandle(int ret, picojson::object* data) {
  picojson::object& result = *data;
  if(ret == SOUND_MANAGER_ERROR_INVALID_PARAMETER ){
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("invalid parameter");
   }else if (ret == SOUND_MANAGER_ERROR_INTERNAL){
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("error internal");
  }else{
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("unknown fail");
  }
}

void ConnectionChangedCallback(sound_device_h device,
                               bool is_connected,
                               void *user_data){
  LOGD("Entered");
  SoundManagerInstance* self = reinterpret_cast<SoundManagerInstance*>(user_data);
  if (self == nullptr) {
      LOGE("Pointer of SoundManagerInstance has nullptr");
      return;
  }
  
  picojson::value response = picojson::value(picojson::object());
  picojson::object& response_obj = response.get<picojson::object>();
  
  int ret = self ->GetDeviceInfo(device, &response_obj);
  if (ret != 0) {
     LOGE("Failed to get device info");
      // error handle
     return;
  }
  response_obj.insert(std::make_pair("event", picojson::value("connectionState")));
  response_obj.insert(std::make_pair("connect", picojson::value(is_connected? "connected":"disconnected" )));
  
  self -> PostMessage(response.serialize().c_str());
}

void DeviceInfoChangedCallback(sound_device_h device,
                               sound_device_changed_info_e  info,
                               void *user_data ){
  LOGD("Entered");
  SoundManagerInstance* self = reinterpret_cast<SoundManagerInstance*>(user_data);
  if (self == nullptr) {
      LOGE("Pointer of SoundManagerInstance has nullptr");
      return;
  }
  
  picojson::value response = picojson::value(picojson::object());
  picojson::object& response_obj = response.get<picojson::object>();
  
  int ret = self -> GetDeviceInfo(device, &response_obj);
  if (ret != 0) {
     LOGE("Failed to get device info");
      // error handle
     return;
  }
  
  response_obj.insert(std::make_pair("event", picojson::value("deviceInfo")));
  if(info == SOUND_DEVICE_CHANGED_INFO_STATE){
      response_obj.insert(std::make_pair("info", picojson::value("state")));
  }else if(info == SOUND_DEVICE_CHANGED_INFO_IO_DIRECTION){
      response_obj.insert(std::make_pair("info", picojson::value("direction")));
  }else{
     LOGE("Failed to get changed info");
  }
  self -> PostMessage(response.serialize().c_str());
}

void SoundManagerInstance::Initialize() {
  LOGD(" SoundManagerInstance Initialize");
  InitializeCallbacks();
}

  //initialize callback
void SoundManagerInstance::InitializeCallbacks() {
 /*
  sound_device_mask_e mask = SOUND_DEVICE_ALL_MASK;
  int ret =sound_manager_set_device_connected_cb(mask,
                          ConnectionChangedCallback, this);
  if (ret < 0) {
    LOGE("Failed to add callback for connection");
  }
  ret = sound_manager_set_device_information_changed_cb(mask,
                          DeviceInfoChangedCallback, this);
  if (ret < 0) {
    LOGE("Failed to add callback for device info change");
  }
  */
}

/**
 * Handles async message
 */
void SoundManagerInstance::HandleMessage(const char* msg) {
  LOGD("enter");

  picojson::value value;
  std::string error;
  picojson::parse(value, msg, msg + strlen(msg), &error);
  if (!error.empty()) {
    LOGE("ignoring message. can't parse message: %s", error.c_str());
    return;
  }
  if (!value.is<picojson::object>()) {
    LOGE("ignoring message. it is not an object.");
    return;
  }

  auto& request = value.get<picojson::object>();
  auto found = request.find("asyncid");
  if (found == request.end()) {
    LOGE("asyncid was not existed");
    return;
  }

  auto cmd = request["cmd"].to_str();
  if (cmd == "getCurrentDeviceList") {
     GetDeviceList(request["asyncid"].to_str(), request["direction"].to_str(), request["type"].to_str(), request["state"].to_str());
  } else {
    LOGD("the command is wrong cmd");
  }
}

/**
 * Handles sync message
 */
void SoundManagerInstance::HandleSyncMessage(const char* msg) {
  LOGD("enter");

  picojson::value value;
  std::string error;
  picojson::parse(value, msg, msg + strlen(msg), &error);

  if (!error.empty()) {
    LOGE("ignoring message. can't parse message: %s", error.c_str());
    return;
  }
  if (!value.is<picojson::object>()) {
    LOGE("ignoring message. it is not an object.");
    return;
  }
  auto& request = value.get<picojson::object>();
  auto cmd = request["cmd"].to_str();
  if (cmd == "setConnectionFilter") {
      sound_device_mask_e connection_mask = GetMask(request["direction"].to_str(),  
                                                                                request["type"].to_str(), request["state"].to_str());
      /* int ret =sound_manager_set_device_connected_cb(connection_mask,
                              ConnectionChangedCallback, this);
      if (ret < 0) {
        LOGE("Failed to add callback for connection");
      }
      */
  }else if (cmd == "setDeviceInfoFilter") {
      sound_device_mask_e device_info_mask = GetMask(request["direction"].to_str(),
                                                                                    request["type"].to_str(), request["state"].to_str());
      /* int ret =sound_manager_set_device_information_changed_cb(device_info_mask,
                              DeviceInfoChangedCallback, this);
      if (ret < 0) {
        LOGE("Failed to add callback for connection");
      }
      */
  } else {
    LOGD("the cmd is wrong cmd");
  }
}

void SoundManagerInstance::GetDeviceList(const std::string& asyncid,
                                         const std::string& direction,
                                         const std::string& type,
                                         const std::string& state){
  LOGD("enter");
  picojson::object result;
  picojson::value response = picojson::value(picojson::array());
  picojson::array& response_array = response.get<picojson::array>();
  
  result["asyncid"] = picojson::value(asyncid);
  
  sound_device_list_h device_list = nullptr;
  sound_device_h device = nullptr;
  sound_device_mask_e  mask = GetMask (direction, type, state);
  
  int ret = sound_manager_get_current_device_list(mask, &device_list);
  if( ret != SOUND_MANAGER_ERROR_NONE ){
    LOGE("Failed to get sound device list");
   // error handle
    ErrorHandle(ret, &result);
  }else{
    while (!(ret = sound_manager_get_next_device(device_list, &device))) {
      picojson::value val = picojson::value(picojson::object());
      picojson::object& obj = val.get<picojson::object>();
      int ret = GetDeviceInfo(device, &obj);
  
      if (ret != 0) {
         LOGE("Failed to get device info");
      }
      response_array.push_back(val);
    }
  
    result["data"] = response;
    result["result"] = picojson::value("OK");
  }
  PostMessage(picojson::value(result).serialize().c_str());
}

int SoundManagerInstance::GetDeviceInfo(sound_device_h device, picojson::object* obj) {
  LOGD("Entered");

  //get id
  int id = 0;
  int ret = sound_manager_get_device_id(device, &id);
  if (SOUND_MANAGER_ERROR_NONE != ret) {
    return -1;
  }
  obj->insert(std::make_pair("id", picojson::value(static_cast<double>(id))));

  //get name
  char *name = nullptr;
  ret = sound_manager_get_device_name(device, &name);
  if (SOUND_MANAGER_ERROR_NONE != ret) {
    return -1;
  }
  obj->insert(std::make_pair("name", picojson::value(name)));

  //get type
  sound_device_type_e type = SOUND_DEVICE_BUILTIN_SPEAKER;
  ret = sound_manager_get_device_type(device, &type);
  if (SOUND_MANAGER_ERROR_NONE != ret) {
    return -1;
  }
  obj->insert(std::make_pair("type", picojson::value(SoundManagerUtil::SoundDeviceTypeToString(type))));

  //get direction
  sound_device_io_direction_e direction = SOUND_DEVICE_IO_DIRECTION_IN;
  ret = sound_manager_get_device_io_direction (device, &direction);
  if (SOUND_MANAGER_ERROR_NONE != ret) {
    return -1;
  }
  obj->insert(std::make_pair("direction", picojson::value(SoundManagerUtil::SoundIOTypeToString(direction))));

  //get state
  sound_device_state_e state = SOUND_DEVICE_STATE_DEACTIVATED;
  ret = sound_manager_get_device_state(device, &state);
  if (SOUND_MANAGER_ERROR_NONE != ret) {
    return -1;
  }
  obj->insert(std::make_pair("state", picojson::value(SoundManagerUtil::SoundStateToString(state))));

  return 0;
}

sound_device_mask_e  SoundManagerInstance::GetMask(const std::string& direction,
                                         const std::string& type,
                                         const std::string& state){
  LOGD("enter");
  LOGD("direction: %s, type:%s, state:%s ", direction.c_str(), type.c_str(), state.c_str());
  sound_device_mask_e  tmpMask = SOUND_DEVICE_ALL_MASK;
  sound_device_mask_e  mask = SOUND_DEVICE_ALL_MASK;
  if(direction =="" && direction =="" && direction ==""){
      mask = SOUND_DEVICE_ALL_MASK;
      LOGD("all mask is empty. all mask set");
      return mask;
  }
  
  if(direction =="both" && type =="all" && state =="all"){
      mask = SOUND_DEVICE_ALL_MASK;
      LOGD("all mask is set,   mask: 0x%04x", mask);
      return mask;
  }
  
  if(direction == ""  || direction == "both" ){
      mask = SOUND_DEVICE_IO_DIRECTION_BOTH_MASK;
  }else{
      tmpMask =  SoundManagerUtil::FilterStringToEnum(direction);
      mask = tmpMask;
  }
  
  if(type == "" ||type == "all"  ){
       mask = sound_device_mask_e(mask|SOUND_DEVICE_TYPE_INTERNAL_MASK|SOUND_DEVICE_TYPE_EXTERNAL_MASK);
  }else{
      tmpMask =  SoundManagerUtil::FilterStringToEnum(type);
      mask = sound_device_mask_e(mask|tmpMask );
  }
  
  if(state == "" ||state == "all" ){
       mask = sound_device_mask_e (mask|SOUND_DEVICE_STATE_ACTIVATED_MASK|SOUND_DEVICE_STATE_DEACTIVATED_MASK);
  }else{
      tmpMask =  SoundManagerUtil::FilterStringToEnum(state);
      mask = sound_device_mask_e(mask|tmpMask);
  }
  
  LOGD("mask: 0x%04x", mask);
  return mask;
}

}  // namespace sound


EXPORT_XWALK_EXTENSION(tizen_sound_manager,  sound::SoundManagerExtension);
