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

#ifndef MESSAGE_PORT_EXTENSION_H_
#define MESSAGE_PORT_EXTENSION_H_

#include <xwalk/xwalk_extension.h>
#include <functional>
#include <string>
#include <bundle.h>

namespace appfw {

class MessagePortExtension : public xwalk::XWalkExtension {
 public:
  // @override
  xwalk::XWalkExtensionInstance* CreateInstance();
};

class MessagePortInstance : public xwalk::XWalkExtensionInstance {
 public:
  typedef std::function<void
      (int, const char*, const char*, bool, bundle*, void*)>
      MessagePortMessageCb;
  MessagePortInstance();
  virtual ~MessagePortInstance();
  // @override
  void Initialize();

  // @override
  void HandleSyncMessage(const char* msg);
 private:
  void FireSimpleEvent(const std::string& event,
                       const std::string& data = std::string());
  void RegisterLocalPort(const std::string& localPort, bool trusted);
  void UnregisterLocalPort(int localId, bool trusted);
  void SendMessage(const std::string& remoteAppId,
                   const std::string& remotePort, bundle* message,
                   bool trustedRemotePort);
  void SendMessageWithLocalPort(const std::string& remoteAppId,
                                const std::string& remotePort, bundle* message,
                                int localId, bool trustedRemotePort);
};

}  // namespace appfw

#endif  // MESSAGE_PORT_EXTENSION_H_

