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

const char* convertMessagePortErrorToStr(int errorCode) {
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
  }
  return nullptr;
}

}

xwalk::XWalkExtensionInstance* MessagePortExtension::CreateInstance() {
  return new MessagePortInstance();
}  // namespace

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
    auto remoteAppId = msgObj["remoteAppId"].get<std::string>();
    auto remotePort = msgObj["remotePort"].get<std::string>();
    auto bundleMsg = msgObj["message"].serialize();
    bool trusted = msgObj["trusted"].get<bool>();

    auto it = msgObj.find("localPort");
    int localPortId = -1;

    if (it != msgObj.end()) {
      if (!msgObj["localPort"].is<picojson::null>() &&
          msgObj["localPort"].is<picojson::object>()) {
        auto localPort = msgObj["localPort"].get<picojson::object>();
        auto it_ = localPort.find("localId");
        if (it_ != localPort.end()) {
          localPortId = static_cast<int>(localPort["localId"].get<double>());
        }
      }
    }

    bundle* b = nullptr;
    const char* json = bundleMsg.c_str();

    int ret = bundle_from_json(json, &b);
    if (ret == BUNDLE_ERROR_NONE) {
      (localPortId > 0)
          ? SendMessageWithLocalPort(asyncId, remoteAppId, remotePort, b,
                                     localPortId, trusted)
          : SendMessage(asyncId, remoteAppId, remotePort, b, trusted);
    }
    if (b != nullptr) {
      bundle_free(b);
    }
  } else if (cmd == "isRegistered") {
    auto remoteAppId = msgObj["remoteAppId"].get<std::string>();
    auto remotePort = msgObj["remotePort"].get<std::string>();
    bool trusted = msgObj["trusted"].get<bool>();
    if (!remoteAppId.empty() && !remotePort.empty()) {
      IsRegisteredRemotePort(asyncId, remoteAppId, remotePort, trusted);
    }
  } else {
    LOGE("The cmd(%s) is not proccessed", cmd.c_str());;
  }
  // parse json object
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
    auto localPort = msgObj["localPort"].get<std::string>();
    bool trusted = msgObj["trusted"].get<bool>();
    if (!localPort.empty())
      RegisterLocalPort(localPort, trusted);
  } else if (cmd == "unregisterLocalPort") {
    auto localId = static_cast<int>(msgObj["localId"].get<double>());
    bool trusted = msgObj["trusted"].get<bool>();
    if (localId >= 0)
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
  static MessagePortMessageCb receiveCbFunc;
  auto receiveCbLamda = [](int localPortId, const char* remoteAppId,
                      const char* remotePort, bool trustedRemotePort,
                      bundle* message, void* userData) {
    receiveCbFunc(localPortId, remoteAppId, remotePort, trustedRemotePort,
                  message, userData);
  };
  receiveCbFunc = [&](int /*localPortId*/, const char* remoteAppId,
                      const char* remotePort, bool trustedRemotePort,
                      bundle* message, void* /*userData*/) {
    picojson::value::object obj;

    if (remoteAppId != nullptr)
      obj["remoteAppId"] = picojson::value(remoteAppId);

    if (remotePort != nullptr)
      obj["remotePort"] = picojson::value(remotePort);

    obj["trustedRemotePort"] = picojson::value(trustedRemotePort);

    char* json = nullptr;
    int ret = bundle_to_json(message, &json);
    if (ret == BUNDLE_ERROR_NONE && json != nullptr) {
      picojson::value v;
      std::string err;
      picojson::parse(v, json, json + strlen(json), &err);
      if (!err.empty()) {
        LOGE("Ignoring message. Can't parse msessage : %s", err.c_str());
      } else {
        obj["msgObj"] = picojson::value(v.get<picojson::object>());
      }
    }
    if (json != nullptr)
      free(json);

    this->FireSimpleEvent("message", picojson::value(obj).serialize());
  };

  int ret = MESSAGE_PORT_ERROR_NONE;
  ret = (trusted) ? message_port_register_trusted_local_port(localPort.c_str(),
                                                             receiveCbLamda,
                                                             nullptr)
                  : message_port_register_local_port(localPort.c_str(),
                                                     receiveCbLamda, nullptr);

  SendSyncReply(std::to_string(ret).c_str());
}

void MessagePortInstance::UnregisterLocalPort(int localId, bool trusted) {
  int ret = MESSAGE_PORT_ERROR_NONE;
  ret = (trusted) ? message_port_unregister_local_port(localId)
                  : message_port_unregister_trusted_local_port(localId);
  SendSyncReply(std::to_string(ret).c_str());
}

void MessagePortInstance::IsRegisteredRemotePort(const std::string& asyncId,
                                                 const std::string& remoteAppId,
                                                 const std::string& remotePort,
                                                 bool trusted) {
  bool exist = false;
  int ret = MESSAGE_PORT_ERROR_NONE;
  ret = (trusted) ? message_port_check_remote_port(remoteAppId.c_str(),
                                                   remotePort.c_str(), &exist)
                  : message_port_check_trusted_remote_port(remoteAppId.c_str(),
                                                           remotePort.c_str(),
                                                           &exist);
  picojson::value::object obj;
  obj["asyncid"] = picojson::value(asyncId);
  obj["result"] = picojson::value(exist);
  obj["reason"] = picojson::value(convertMessagePortErrorToStr(ret));
  PostMessage(picojson::value(obj).serialize().c_str());
}

void MessagePortInstance::SendMessage(const std::string& asyncId,
                                      const std::string& remoteAppId,
                                      const std::string& remotePort,
                                      bundle* message, bool trusted) {
  int ret = MESSAGE_PORT_ERROR_NONE;
  ret = (trusted) ? message_port_send_trusted_message(remoteAppId.c_str(),
                                                      remotePort.c_str(),
                                                      message)
                  : message_port_send_message(remoteAppId.c_str(),
                                              remotePort.c_str(), message);
  picojson::value::object obj;
  obj["asyncid"] = picojson::value(asyncId);
  if (ret == MESSAGE_PORT_ERROR_NONE) {
    obj["result"] = picojson::value("OK");
  } else {
    obj["result"] = picojson::value("NO");
  }
  obj["reason"] = picojson::value(convertMessagePortErrorToStr(ret));
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
  obj["reason"] = picojson::value(convertMessagePortErrorToStr(ret));
  PostMessage(picojson::value(obj).serialize().c_str());
}

}  // namespace appfw

EXPORT_XWALK_EXTENSION(tizen_message_port, appfw::MessagePortExtension);
