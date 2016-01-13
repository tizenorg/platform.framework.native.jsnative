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
    default:
      return "null";
  }
}

picojson::value ConvertBundleToObject(bundle* message) {
  char* json = nullptr;
  picojson::value ret;

  int err = bundle_to_json(message, &json);
  if (err == BUNDLE_ERROR_NONE && json != nullptr) {
    picojson::value v;
    std::string err;
    picojson::parse(v, json, json + strlen(json), &err);
    if (!err.empty()) {
      LOGE("Ignoring message. Can't parse msessage : %s", err.c_str());
    } else {
      ret = picojson::value(v.get<picojson::object>());
    }
  } else {
    LOGE("can't get object from bundle");
  }
  if (json != nullptr)
    free(json);
  return ret;
}

bundle* ConvertObjectToBundle(picojson::value obj) {
  bundle* b = nullptr;
  int ret = bundle_from_json(obj.serialize().c_str(), &b);
  if (ret != BUNDLE_ERROR_NONE || b == nullptr) {
    LOGE("can't get bundle from object");
  }
  return b;
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
  } else if (cmd == "send") {
    auto remoteAppId = msgObj["appId"].to_str();
    auto remotePort = msgObj["portName"].to_str();
    bool trusted = (msgObj["trusted"].to_str() == "true");

    bundle* b = ConvertObjectToBundle(msgObj["message"]);
    if (b == nullptr) {
      picojson::value::object obj;
      obj["result"] = picojson::value("NO");
      obj["reason"] = picojson::value("can't get bundle from object");
      PostMessage(picojson::value(obj).serialize().c_str());
      return;
    }

    if (msgObj.find("localId") != msgObj.end()) {
      SendMessageWithLocalPort(remoteAppId, remotePort, b,
                               std::stoi(msgObj["localId"].to_str()),
                               trusted);
    } else {
      SendMessage(remoteAppId, remotePort, b, trusted);
    }

    if (b)
      bundle_free(b);
  }else {
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
                      const char* remotePort, bool trustedRemotePort,
                      bundle* message, void* userData) {
    if (!userData)
      return;

    MessagePortInstance* self =
        reinterpret_cast<MessagePortInstance*>(userData);

    bundle* messageDup = bundle_dup(message);

    picojson::value::object obj;
    obj["localId"] = picojson::value(std::to_string(localPortId));
    obj["appId"] = picojson::value(remoteAppId);
    if (remotePort != nullptr)
      obj["portName"] = picojson::value(remotePort);
    obj["trusted"] = picojson::value((trustedRemotePort) ? "true" : "false");
    obj["msg"] = ConvertBundleToObject(messageDup);

    if (messageDup) {
      bundle_free(messageDup);
    }

    if (obj["msg"].is<picojson::null>()) {
      LOGE("doesn't have any message");
      self->FireSimpleEvent("error", picojson::value("no message").serialize());
    } else {
      self->FireSimpleEvent("listen", picojson::value(obj).serialize());
    }
  };

  int ret = MESSAGE_PORT_ERROR_NONE;
  ret = (trusted) ? message_port_register_trusted_local_port(localPort.c_str(),
                                                             receiveCb, this)
                  : message_port_register_local_port(localPort.c_str(),
                                                     receiveCb, this);
  picojson::value::object obj;
  obj["result"] = picojson::value(std::to_string(ret));
  if (ret < 0)
    obj["reason"] = picojson::value(ConvertMessagePortErrorToStr(ret));
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

void MessagePortInstance::UnregisterLocalPort(int localId, bool trusted) {
  int ret = MESSAGE_PORT_ERROR_NONE;
  ret = (trusted) ? message_port_unregister_local_port(localId)
                  : message_port_unregister_trusted_local_port(localId);
  picojson::value::object obj;
  obj["result"] = picojson::value(std::to_string(ret));
  if (ret != MESSAGE_PORT_ERROR_NONE)
    obj["reason"] = picojson::value(ConvertMessagePortErrorToStr(ret));
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

void MessagePortInstance::SendMessage(const std::string& remoteAppId,
                                      const std::string& remotePort,
                                      bundle* message, bool trustedRemotePort) {
  int ret = MESSAGE_PORT_ERROR_NONE;
  ret = (trustedRemotePort)
      ? message_port_send_trusted_message(remoteAppId.c_str(),
                                          remotePort.c_str(), message)
      : message_port_send_message(remoteAppId.c_str(),
                                  remotePort.c_str(), message);
  picojson::value::object obj;
  obj["result"] = picojson::value(std::to_string(ret));
  obj["reason"] = picojson::value(ConvertMessagePortErrorToStr(ret));
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

void MessagePortInstance::SendMessageWithLocalPort(
    const std::string& remoteAppId,  const std::string& remotePort,
    bundle* message, int localId, bool trustedRemotePort) {
  int ret = MESSAGE_PORT_ERROR_NONE;
  ret = (trustedRemotePort)
      ? message_port_send_trusted_message_with_local_port(
            remoteAppId.c_str(), remotePort.c_str(), message, localId)
      : message_port_send_message_with_local_port(
            remoteAppId.c_str(), remotePort.c_str(), message, localId);
  picojson::value::object obj;
  obj["result"] = picojson::value(std::to_string(ret));
  obj["reason"] = picojson::value(ConvertMessagePortErrorToStr(ret));
  SendSyncReply(picojson::value(obj).serialize().c_str());
}

}  // namespace appfw

EXPORT_XWALK_EXTENSION(tizen_message_port, appfw::MessagePortExtension);
