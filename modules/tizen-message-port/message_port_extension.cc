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

#include "message_port_extension.h"

#include <dlog.h>
#include <message_port.h>
#include <bundle_internal.h>

#include "picojson.h"

#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace appfw {

namespace {

const char* STR_ERROR_NONE = "none";
const char* STR_ERROR_INVALID_PARAMETER = "invalid parameter";
const char* STR_ERROR_PORT_NOT_FOUND = "port not found";
const char* STR_ERROR_MAX_EXCEEDED = "max exceeded";
const char* STR_ERROR_RESOURCE_UNAVAILABLE = "resource unavailable";
const char* STR_ERROR_OUT_OF_MEMORY = "out of memory";
const char* STR_ERROR_IO_ERROR = "io error";
const char* STR_ERROR_CERTIFICATE_NOT_MATCH = "certificate not match";

const char* ConvertMessagePortErrorToStr(int errorCode) {
  switch(errorCode) {
    case MESSAGE_PORT_ERROR_NONE:
      return STR_ERROR_NONE;
    case MESSAGE_PORT_ERROR_INVALID_PARAMETER:
      return STR_ERROR_INVALID_PARAMETER;
    case MESSAGE_PORT_ERROR_PORT_NOT_FOUND:
      return STR_ERROR_PORT_NOT_FOUND;
    case MESSAGE_PORT_ERROR_MAX_EXCEEDED:
      return STR_ERROR_MAX_EXCEEDED;
    case MESSAGE_PORT_ERROR_RESOURCE_UNAVAILABLE:
      return STR_ERROR_RESOURCE_UNAVAILABLE;
    case MESSAGE_PORT_ERROR_OUT_OF_MEMORY:
      return STR_ERROR_OUT_OF_MEMORY;
    case MESSAGE_PORT_ERROR_IO_ERROR:
      return STR_ERROR_IO_ERROR;
    case MESSAGE_PORT_ERROR_CERTIFICATE_NOT_MATCH:
      return STR_ERROR_CERTIFICATE_NOT_MATCH;
  }
  return nullptr;
}

picojson::value ConvertBundleToObject(bundle* message) {
  char* json = nullptr;
  picojson::value ret;

  if (bundle_to_json(message, &json) == BUNDLE_ERROR_NONE && json != nullptr) {
    picojson::value v;
    std::string err;
    picojson::parse(v, json, json + strlen(json), &err);
    if (!err.empty()) {
      LOGE("Ignoring message. Can't parse msessage : %s", err.c_str());
    } else {
      ret = picojson::value(v.get<picojson::object>());
    }
  }
  if (json != nullptr)
    free(json);
  return ret;
}

bundle* ConvertObjectToBundle(picojson::value obj) {
  bundle* b = nullptr;
  const char* json = obj.to_str().c_str();

  bundle_from_json(json, &b);
  return b;
}

int CheckRemotePort(const std::string& remoteAppId,
                    const std::string& remotePort,
                    bool& exist, bool& trusted) {
  int ret = MESSAGE_PORT_ERROR_NONE;
  bool _exist = false;
  ret = message_port_check_trusted_remote_port(remoteAppId.c_str(),
                                               remotePort.c_str(), &_exist);
  if (_exist) {  // if finds port,
    exist = true;
    trusted = true;
  } else if (ret != MESSAGE_PORT_ERROR_NONE) {
    // if can't find port because of any reason,
    exist = false;
  } else {  // if not find yet,
    ret = message_port_check_remote_port(remoteAppId.c_str(),
                                         remotePort.c_str(), &_exist);
    if (_exist) {  // if finds port on not trusted
      exist = true;
      trusted = false;
    } else {
      exist = false;
      trusted = false;
    }
  }
  return ret;
}

}  // namespace

xwalk::XWalkExtensionInstance* MessagePortExtension::CreateInstance() {
  return new MessagePortInstance();
}

MessagePortInstance::MessagePortInstance() {}

MessagePortInstance::~MessagePortInstance() {}

void MessagePortInstance::Initialize() {
  LOGD("Created tizen-message-port instance");
}

void MessagePortInstance::HandleMessage(const char* msg) {
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
  auto asyncId = request["asyncid"].to_str();
  auto& msgObj = request["msg"].get<picojson::object>();

  if (cmd == "send") {
    auto remoteAppId = msgObj["appId"].to_str();
    auto remotePort = msgObj["portName"].to_str();
    bundle* b = ConvertObjectToBundle(msgObj["message"]);

    bool exist = false;
    bool trusted = false;
    int err = CheckRemotePort(remoteAppId, remotePort, exist, trusted);
    if (exist) {
      if (msgObj.find("localId") != msgObj.end()) {
        SendMessageWithLocalPort(asyncId, remoteAppId, remotePort, b,
                                 std::stoi(msgObj["localId"].to_str()),
                                 trusted);
      } else {
        SendMessage(asyncId, remoteAppId, remotePort, b, trusted);
      }
    } else {
      picojson::value::object obj;
      obj["asyncid"] = picojson::value(asyncId);
      obj["result"] = picojson::value("NO");
      if (err == MESSAGE_PORT_ERROR_NONE) {
        obj["reason"] = picojson::value(STR_ERROR_PORT_NOT_FOUND);
      } else {
        obj["reason"] = picojson::value(ConvertMessagePortErrorToStr(err));
      }
      PostMessage(picojson::value(obj).serialize().c_str());
    }

    if (b)
      bundle_free(b);
  } else {
    LOGE("The cmd(%s) is not proccessed", cmd.c_str());;
  }
}

void MessagePortInstance::HandleSyncMessage(const char* msg) {
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
  auto& msgObj = request["msg"].get<picojson::object>();

  if (cmd == "registerLocalPort") {
    auto localPort = msgObj["localPort"].to_str();
    bool trusted = (msgObj["trusted"].to_str() == "true");
    RegisterLocalPort(localPort, trusted);
  } else if (cmd == "unregisterLocalPort") {
    int localId = std::stoi(msgObj["localId"].to_str());
    bool trusted = (msgObj["trusted"].to_str() == "true");
    UnregisterLocalPort(localId, trusted);
  } else {
    LOGE("The cmd(%s) is not proccessed", cmd.c_str());;
  }
}

void MessagePortInstance::FireSimpleEvent(const std::string& event,
                                          const std::string& data) {
  picojson::value::object obj;
  obj["event"] = picojson::value(event);
  if (data.length() > 0) {
    obj["data"] = picojson::value(data);
  }
  PostMessage(picojson::value(obj).serialize().c_str());
}

void MessagePortInstance::RegisterLocalPort(const std::string& localPort,
                                            bool trusted) {
  auto receiveCb = [](int localPortId, const char* remoteAppId,
                      const char* remotePort, bool /*trustedRemotePort*/,
                      bundle* message, void* userData) {
    if (!userData)
      return;

    MessagePortInstance* self =
        reinterpret_cast<MessagePortInstance*>(userData);

    picojson::value::object obj;
    obj["localId"] = picojson::value(std::to_string(localPortId));
    obj["appId"] = picojson::value(remoteAppId);
    if (remotePort != nullptr)
      obj["portName"] = picojson::value(remotePort);
    obj["msg"] = ConvertBundleToObject(message);

    self->FireSimpleEvent("listen", picojson::value(obj).serialize());
  };

  int ret = MESSAGE_PORT_ERROR_NONE;
  ret = (trusted) ? message_port_register_trusted_local_port(localPort.c_str(),
                                                             receiveCb, this)
                  : message_port_register_local_port(localPort.c_str(),
                                                     receiveCb, this);
  picojson::value::object obj;
  obj["result"] = picojson::value(std::to_string(ret));
  if (ret != MESSAGE_PORT_ERROR_NONE)
    obj["reason"] = picojson::value(ConvertMessagePortErrorToStr(ret));
  SendSyncReply(std::to_string(ret).c_str());
}

void MessagePortInstance::UnregisterLocalPort(int localId, bool trusted) {
  int ret = MESSAGE_PORT_ERROR_NONE;
  ret = (trusted) ? message_port_unregister_local_port(localId)
                  : message_port_unregister_trusted_local_port(localId);
  picojson::value::object obj;
  obj["result"] = picojson::value(std::to_string(ret));
  if (ret != MESSAGE_PORT_ERROR_NONE)
    obj["reason"] = picojson::value(ConvertMessagePortErrorToStr(ret));
  SendSyncReply(std::to_string(ret).c_str());
}

void MessagePortInstance::SendMessage(const std::string& asyncId,
                                      const std::string& remoteAppId,
                                      const std::string& remotePort,
                                      bundle* message, bool trusted) {
  int ret = MESSAGE_PORT_ERROR_NONE;
  ret = (trusted) ? message_port_send_trusted_message(remoteAppId.c_str(),
                        remotePort.c_str(), message)
                  : message_port_send_message(remoteAppId.c_str(),
                        remotePort.c_str(), message);
  picojson::value::object obj;
  obj["asyncid"] = picojson::value(asyncId);
  if (ret == MESSAGE_PORT_ERROR_NONE) {
    obj["result"] = picojson::value("OK");
  } else {
    obj["result"] = picojson::value("NO");
  }
  obj["reason"] = picojson::value(ConvertMessagePortErrorToStr(ret));
  PostMessage(picojson::value(obj).serialize().c_str());
}

void MessagePortInstance::SendMessageWithLocalPort(const std::string& asyncId,
    const std::string& remoteAppId,  const std::string& remotePort,
    bundle* message, int localId, bool trusted) {
  int ret = MESSAGE_PORT_ERROR_NONE;
  ret = (trusted) ? message_port_send_trusted_message_with_local_port(
                        remoteAppId.c_str(), remotePort.c_str(), message,
                        localId)
                  : message_port_send_message_with_local_port(
                        remoteAppId.c_str(), remotePort.c_str(), message,
                        localId);
  picojson::value::object obj;
  obj["asyncid"] = picojson::value(asyncId);
  if (ret == MESSAGE_PORT_ERROR_NONE) {
    obj["result"] = picojson::value("OK");
  } else {
    obj["result"] = picojson::value("NO");
  }
  obj["reason"] = picojson::value(ConvertMessagePortErrorToStr(ret));
  PostMessage(picojson::value(obj).serialize().c_str());
}

}  // namespace appfw

EXPORT_XWALK_EXTENSION(tizen_message_port, appfw::MessagePortExtension);
