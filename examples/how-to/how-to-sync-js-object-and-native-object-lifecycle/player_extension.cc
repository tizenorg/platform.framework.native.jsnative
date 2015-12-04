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

#include "player_extension.h"

#include <player.h>
#include <map>
#include <sstream>
#include <string>

#include "picojson.h"

namespace sample {

std::map<int, player_h> g_handles;
int g_last_handle_id = 0;

/**
 * @class PlayerExtension
 */

/* @method PlayerExtension::CreateInstance()
 *
 * CreateInstance() SHOULD be implemented in inherited class
 * to return your own ExtensionInstance class.
 */
xwalk::XWalkExtensionInstance* PlayerExtension::CreateInstance() {
  return new PlayerInstance;
}

/**
 * @class PlayerInstance
 */

/* @method PlayerInstance::HandleMessage()
 *
 * HandleMessage() CAN be implemented if want to handle asyncronous messages
 * sent by 'extension.postMessage()' in player_api.js.
 * Asyncronous response can be sent with PostMessage() and the sent response
 * can be handled using 'extension.setMessageListener()' in player_api.js also.
 */
void PlayerInstance::HandleMessage(const char* msg) {
}

/* @method PlayerInstance::HandleSyncMessage()
 *
 * HandleSyncMessage() CAN be implemented if want to handle syncronous messages
 * sent by 'extension.internal.sendSyncMessage()' in player_api.js.
 * This method should send response with SendSyncReply().
 */
void PlayerInstance::HandleSyncMessage(const char* msg) {
  picojson::value value;
  std::string err;
  picojson::parse(value, msg, msg + strlen(msg), &err);
  if (!err.empty()) {
    std::cerr << "Ignoring message, error: " << err << std::endl;
    return;
  }

  picojson::object result;

  std::string cmd = value.get("cmd").to_str();
  if (cmd == "Create") {
    int id = g_last_handle_id++;
    player_h player = nullptr;
    player_create(&player);
    g_handles.insert(std::make_pair(id, player));

    result["result"] = picojson::value("OK");
    result["id"] = picojson::value(static_cast<double>(id));
    SendSyncReply(picojson::value(result).serialize().c_str());
    return;
  }

  int id = static_cast<int>(value.get("id").get<double>());
  auto found = g_handles.find(id);
  if (found == g_handles.end()) {
    result["result"] = picojson::value("FAIL");
    result["reason"] = picojson::value("Can't found player handle");
    SendSyncReply(picojson::value(result).serialize().c_str());
    return;
  }
  player_h player = g_handles[id];
  int ret = 0;

  if (cmd == "SetUri") {
    std::string path = value.get("path").to_str();
    ret = player_set_uri(player, path.c_str());
  } else if (cmd == "Prepare") {
    ret = player_prepare(player);
  } else if (cmd == "Start") {
    ret = player_start(player);
  } else if (cmd == "Stop") {
    ret = player_stop(player);
  } else if (cmd == "Unprepare") {
    ret = player_unprepare(player);
  } else if (cmd == "Destroy") {
    ret = player_destroy(player);
    g_handles.erase(id);
  }

  if (ret == 0) {
    result["result"] = picojson::value("OK");
  } else {
    std::stringstream ss;
    result["result"] = picojson::value("FAIL");
    ss << "Fail to " << cmd << " with error no " << ret;
    result["reason"] = picojson::value(ss.str());
  }
  SendSyncReply(picojson::value(result).serialize().c_str());
}

}  // namespace sample

/* @macro EXPORT_XWALK_EXTENSION
 *
 * The implemented sub-class of XWalkExtension should be exported with
 * EXPORT_XWALK_EXTENSION(name, class) macro.
 */
EXPORT_XWALK_EXTENSION(player, sample::PlayerExtension);
