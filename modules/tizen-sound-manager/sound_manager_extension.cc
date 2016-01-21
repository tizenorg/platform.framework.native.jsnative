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

  result["result"] = picojson::value("FAIL");

  if (ret == SOUND_MANAGER_ERROR_OUT_OF_MEMORY) {
    result["reason"] = picojson::value("out-of-memory");
  } else if (ret == SOUND_MANAGER_ERROR_INVALID_PARAMETER) {
    result["reason"] = picojson::value("invalid-parameter");
  } else if (ret == SOUND_MANAGER_ERROR_INVALID_OPERATION) {
    result["reason"] = picojson::value("invalid-operation");
  } else if (ret == SOUND_MANAGER_ERROR_PERMISSION_DENIED) {
    result["reason"] = picojson::value("permission-denied");
  } else if (ret == SOUND_MANAGER_ERROR_NOT_SUPPORTED) {
    result["reason"] = picojson::value("not-supported");
  } else if (ret == SOUND_MANAGER_ERROR_NO_DATA) {
    result["reason"] = picojson::value("no-data");
  } else if (ret == SOUND_MANAGER_ERROR_INTERNAL) {
    result["reason"] = picojson::value("internal");
  } else if (ret == SOUND_MANAGER_ERROR_POLICY) {
    result["reason"] = picojson::value("policy");
  } else if (ret == SOUND_MANAGER_ERROR_NO_PLAYING_SOUND) {
    result["reason"] = picojson::value("no-playing-sound");
  } else {
    result["reason"] = picojson::value("unknown-error");
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

void VolumeChangedCallback(sound_type_e type, unsigned int volume, void* data) {
  LOGD("enter");
  LOGD("changed cb volume : %d", volume);
  SoundManagerInstance* self = reinterpret_cast<SoundManagerInstance*>(data);
  if (self == nullptr) {
    LOGE("Pointer of SoundManagerInstance has nullptr");
    return;
  }
  std::string type_str = SoundManagerUtil::SoundTypeToString(type);
  picojson::value::object obj;
  obj["event"] = picojson::value("volume.change");
  obj["type"] = picojson::value(type_str);
  obj["volume"] = picojson::value(std::to_string(volume));
  obj["result"] = picojson::value("OK");
  self->PostMessage(picojson::value(obj).serialize().c_str());
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
  if (sound_manager_set_volume_changed_cb(VolumeChangedCallback, this) < 0) {
    LOGE("Failed to add callback for volume change");
  }
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
     GetDeviceList(request["asyncid"].to_str(), request["direction"].to_str(),
                  request["type"].to_str(), request["state"].to_str());
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
                                                    request["type"].to_str(),
                                                    request["state"].to_str());
      /* int ret =sound_manager_set_device_connected_cb(connection_mask,
                              ConnectionChangedCallback, this);
      if (ret < 0) {
        LOGE("Failed to add callback for connection");
      }
      */
  }else if (cmd == "setDeviceInfoFilter") {
      sound_device_mask_e device_info_mask = GetMask(request["direction"].to_str(),
                                                     request["type"].to_str(),
                                                     request["state"].to_str());
      /* int ret =sound_manager_set_device_information_changed_cb(device_info_mask,
                              DeviceInfoChangedCallback, this);
      if (ret < 0) {
        LOGE("Failed to add callback for connection");
      }
      */
  } else if (cmd == "getcurrentSoundType") {
    LOGD("enter");
    sound_type_e type;
    sound_manager_get_current_sound_type(&type);
    std::string type_str = SoundManagerUtil::SoundTypeToString(type);
    SendSyncReply(type_str.c_str());
  } else if (cmd == "setcurrentSoundType") {
    LOGD("enter");
    auto type_str = request["soundtype"].to_str();
    sound_type_e type = SoundManagerUtil::StringToSoundType(type_str.c_str());
    sound_manager_set_current_sound_type(type);
  } else if (cmd == "getMaxVolume") {
    LOGD("enter");
    int max_volume;
    auto type_str = request["soundtype"].to_str();
    sound_type_e type = SoundManagerUtil::StringToSoundType(type_str.c_str());
    sound_manager_get_max_volume(type, &max_volume);
    SendSyncReply(std::to_string(max_volume).c_str());
  } else if (cmd == "getVolume") {
    LOGD("enter");
    int volume;
    auto type_str = request["soundtype"].to_str();
    sound_type_e type = SoundManagerUtil::StringToSoundType(type_str.c_str());
    sound_manager_get_volume(type, &volume);
    SendSyncReply(std::to_string(volume).c_str());
  } else if (cmd == "setVolume") {
    LOGD("enter");
    int volume = std::stoi(request["volume"].to_str());
    auto type_str = request["soundtype"].to_str();
    sound_type_e type = SoundManagerUtil::StringToSoundType(type_str.c_str());
    sound_manager_set_volume(type, volume);
  } else if (cmd == "getSessionType") {
    SendSyncReply(picojson::value(getSessionType()).serialize().c_str());
  } else if (cmd == "getSessionStartingOption") {
    SendSyncReply(picojson::value(getSessionStartingOption()).serialize().c_str());
  } else if (cmd == "getSessionInterruptOption") {
    SendSyncReply(picojson::value(getSessionInterruptOption()).serialize().c_str());
  } else if (cmd == "getSessionResumptionOption") {
    SendSyncReply(picojson::value(getSessionResumptionOption()).serialize().c_str());
  } else if (cmd == "getSessionVoipMode") {
    SendSyncReply(picojson::value(getSessionVoipMode()).serialize().c_str());
  } else if (cmd == "setSessionType") {
    SendSyncReply(picojson::value(setSessionType(value)).serialize().c_str());
  } else if (cmd == "setSessionStartingOption") {
    SendSyncReply(picojson::value(setSessionStartingOption(value)).serialize().c_str());
  } else if (cmd == "setSessionInterruptOption") {
    SendSyncReply(picojson::value(setSessionInterruptOption(value)).serialize().c_str());
  } else if (cmd == "setSessionResumptionOption") {
    SendSyncReply(picojson::value(setSessionResumptionOption(value)).serialize().c_str());
  } else if (cmd == "setSessionVoipMode") {
    SendSyncReply(picojson::value(setSessionVoipMode(value)).serialize().c_str());
  } else if (cmd == "_setInterruptListener") {
    SendSyncReply(picojson::value(_setInterruptListener()).serialize().c_str());
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

// Session
const picojson::object SoundManagerInstance::getSessionType() {
  LOGD("enter");

  int ret = SOUND_MANAGER_ERROR_NONE;
  sound_session_type_e type;
  picojson::object result;

  ret = sound_manager_get_session_type(&type);
  if (ret != SOUND_MANAGER_ERROR_NONE) {
    LOGE("sound_manager_get_session_type() return (%d)", ret);
    ErrorHandle(ret, &result);
    return result;
  }

  result["result"] = picojson::value("OK");
  result["data"] = picojson::value(SoundManagerUtil::soundSessionTypeToString(type));

  return result;
}

const picojson::object SoundManagerInstance::setSessionType(const picojson::value value) {
  LOGD("enter");

  const char* type = value.get("type").to_str().c_str();
  LOGD("type: %s", type);

  int ret = SOUND_MANAGER_ERROR_NONE;
  picojson::object result;

  ret = sound_manager_set_session_type(SoundManagerUtil::soundSessionTypeToInt(type));
  if (ret != SOUND_MANAGER_ERROR_NONE) {
    LOGE("sound_manager_set_session_type() return (%d)", ret);
    ErrorHandle(ret, &result);
    return result;
  }

  result["result"] = picojson::value("OK");

  return result;
}

const picojson::object SoundManagerInstance::getSessionStartingOption() {
  LOGD("enter");

  int ret = SOUND_MANAGER_ERROR_NONE;
  sound_session_option_for_starting_e startOption;
  sound_session_option_for_during_play_e InterruptOption;
  picojson::object result;

  ret = sound_manager_get_media_session_option(&startOption, &InterruptOption);
  if (ret != SOUND_MANAGER_ERROR_NONE) {
    LOGE("sound_manager_get_media_session_option() return (%d)", ret);
    ErrorHandle(ret, &result);
    return result;
  }

  result["result"] = picojson::value("OK");
  result["data"] = picojson::value(SoundManagerUtil::soundSessionStartOptionToString(startOption));

  return result;
}

const picojson::object SoundManagerInstance::setSessionStartingOption(const picojson::value value) {
  LOGD("enter");

  const char* option = value.get("option").to_str().c_str();
  LOGD("option: %s", option);

  int ret = SOUND_MANAGER_ERROR_NONE;
  sound_session_option_for_starting_e startOption;
  sound_session_option_for_during_play_e InterruptOption;
  picojson::object result;

  ret = sound_manager_get_media_session_option(&startOption, &InterruptOption);
  if (ret != SOUND_MANAGER_ERROR_NONE) {
    LOGE("sound_manager_get_media_session_option() return (%d)", ret);
    ErrorHandle(ret, &result);
    return result;
  }

  // TODO: it is need to check whether the startingOption is equal to

  ret = sound_manager_set_media_session_option(SoundManagerUtil::soundSessionStartOptionToInt(option), InterruptOption);
  if (ret != SOUND_MANAGER_ERROR_NONE) {
    LOGE("sound_manager_set_media_session_option() return (%d)", ret);
    ErrorHandle(ret, &result);
    return result;
  }

  result["result"] = picojson::value("OK");

  return result;
}

const picojson::object SoundManagerInstance::getSessionInterruptOption() {
  LOGD("enter");

  int ret = SOUND_MANAGER_ERROR_NONE;
  sound_session_option_for_starting_e startOption;
  sound_session_option_for_during_play_e InterruptOption;
  picojson::object result;

  ret = sound_manager_get_media_session_option(&startOption, &InterruptOption);
  if (ret != SOUND_MANAGER_ERROR_NONE) {
    LOGE("sound_manager_get_media_session_option() return (%d)", ret);
    ErrorHandle(ret, &result);
    return result;
  }

  result["result"] = picojson::value("OK");
  result["data"] = picojson::value(SoundManagerUtil::soundSessionInterruptOptionToString(InterruptOption));

  return result;
}

const picojson::object SoundManagerInstance::setSessionInterruptOption(const picojson::value value) {
  LOGD("enter");

  const char* option = value.get("option").to_str().c_str();
  LOGD("option: %s", option);

  int ret = SOUND_MANAGER_ERROR_NONE;
  sound_session_option_for_starting_e startOption;
  sound_session_option_for_during_play_e InterruptOption;
  picojson::object result;

  ret = sound_manager_get_media_session_option(&startOption, &InterruptOption);
  if (ret != SOUND_MANAGER_ERROR_NONE) {
    LOGE("sound_manager_get_media_session_option() return (%d)", ret);
    ErrorHandle(ret, &result);
    return result;
  }

  // TODO: it is need to check whether the interruptOption is equal to

  ret = sound_manager_set_media_session_option(startOption, SoundManagerUtil::soundSessionInterruptOptionToInt(option));
  if (ret != SOUND_MANAGER_ERROR_NONE) {
    LOGE("sound_manager_set_media_session_option() return (%d)", ret);
    ErrorHandle(ret, &result);
    return result;
  }

  result["result"] = picojson::value("OK");

  return result;
}

const picojson::object SoundManagerInstance::getSessionResumptionOption() {
  LOGD("enter");

  int ret = SOUND_MANAGER_ERROR_NONE;
  sound_session_option_for_resumption_e resumptionOption;
  picojson::object result;

  ret = sound_manager_get_media_session_resumption_option(&resumptionOption);
  if (ret != SOUND_MANAGER_ERROR_NONE) {
    LOGE("sound_manager_get_media_session_resumption_option() return (%d)", ret);
    ErrorHandle(ret, &result);
    return result;
  }

  result["result"] = picojson::value("OK");
  result["data"] = picojson::value(SoundManagerUtil::soundSessionResumptionOptionToString(resumptionOption));

  return result;
}

const picojson::object SoundManagerInstance::setSessionResumptionOption(const picojson::value value) {
  LOGD("enter");

  const char* option = value.get("option").to_str().c_str();
  LOGD("option: %s", option);

  int ret = SOUND_MANAGER_ERROR_NONE;
  picojson::object result;

  ret = sound_manager_set_media_session_resumption_option(SoundManagerUtil::soundSessionResumptionOptionToInt(option));
  if (ret != SOUND_MANAGER_ERROR_NONE) {
    LOGE("sound_manager_set_media_session_resumption_option() return (%d)", ret);
    ErrorHandle(ret, &result);
    return result;
  }

  result["result"] = picojson::value("OK");

  return result;
}

const picojson::object SoundManagerInstance::getSessionVoipMode() {
  LOGD("enter");

  int ret = SOUND_MANAGER_ERROR_NONE;
  sound_session_voip_mode_e voipMode;
  picojson::object result;

  ret = sound_manager_get_voip_session_mode(&voipMode);
  if (ret != SOUND_MANAGER_ERROR_NONE) {
    LOGE("sound_manager_get_voip_session_mode() return (%d)", ret);
    ErrorHandle(ret, &result);
    return result;
  }

  result["result"] = picojson::value("OK");
  result["data"] = picojson::value(SoundManagerUtil::soundSessionVoipModeToString(voipMode));

  return result;
}

const picojson::object SoundManagerInstance::setSessionVoipMode(const picojson::value value) {
  LOGD("enter");

  const char* mode = value.get("mode").to_str().c_str();
  LOGD("mode: %s", mode);

  int ret = SOUND_MANAGER_ERROR_NONE;
  picojson::object result;

  ret = sound_manager_set_voip_session_mode(SoundManagerUtil::soundSessionVoipModeToInt(mode));
  if (ret != SOUND_MANAGER_ERROR_NONE) {
    LOGE("sound_manager_get_voip_session_mode() return (%d)", ret);
    ErrorHandle(ret, &result);
    return result;
  }

  result["result"] = picojson::value("OK");

  return result;
}

// callback
void SoundManagerInstance::_interruptListener(sound_session_interrupted_code_e type, void* userData) {
  LOGD("enter");

  SoundManagerInstance* instance = reinterpret_cast<SoundManagerInstance*>(userData);

  picojson::object msg;
  msg["event"] = picojson::value("sessionInterrupt");
  msg["type"] = picojson::value(SoundManagerUtil::soundSessioninterruptedCodeToString(type));

  instance->PostMessage(picojson::value(msg).serialize().c_str());
}

const picojson::object SoundManagerInstance::_setInterruptListener() {
  LOGD("enter");

  int ret = SOUND_MANAGER_ERROR_NONE;
  picojson::object result;

  ret = sound_manager_set_session_interrupted_cb(_interruptListener, static_cast<void*>(this));
  if (ret != SOUND_MANAGER_ERROR_NONE) {
    LOGE("sound_manager_set_session_interrupted_cb() return (%d)", ret);
    ErrorHandle(ret, &result);
    return result;
  }

  result["result"] = picojson::value("OK");

  return result;
}

}  // namespace sound

EXPORT_XWALK_EXTENSION(tizen_sound_manager, sound::SoundManagerExtension);
