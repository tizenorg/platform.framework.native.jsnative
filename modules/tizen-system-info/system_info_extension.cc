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

#include "system_info_extension.h"

#include <dlog.h>
#include <json/json.h>

#include <system_info.h>


#ifdef LOG_TAG
#undef LOG_TAG
#endif
#define LOG_TAG "JSNative"

namespace system_info {

namespace {

const char* GetErrorMessage(int errcode) {
  switch (errcode) {
    case SYSTEM_INFO_ERROR_INVALID_PARAMETER:
      return "Invalid parameter";
    case SYSTEM_INFO_ERROR_IO_ERROR:
      return "An error occurred while reading the value from the config file";
    case SYSTEM_INFO_ERROR_PERMISSION_DENIED:
      return "No permission to use the API";
    case SYSTEM_INFO_ERROR_OUT_OF_MEMORY:
      return "Out of memory";
    default:
      return "Unknown Error";
  }
}

}  // namespace

xwalk::XWalkExtensionInstance* SystemInfoExtension::CreateInstance() {
  return new SystemInfoInstance();
}

typedef char* string;
#define SYSTEM_INFO_GET(SCOPE, TYPE, REPLY)                                    \
  {                                                                            \
    TYPE value;                                                                \
    ret = system_info_get_##SCOPE##_##TYPE(key.c_str(), &value);               \
    if (ret == SYSTEM_INFO_ERROR_NONE) {                                       \
      REPLY["type"] = #TYPE;                                                   \
      REPLY["value"] = value;                                                  \
    } else {                                                                   \
      LOGE("Failed to get platform info. %s", GetErrorMessage(ret));           \
    }                                                                          \
  }

void SystemInfoInstance::HandleSyncMessage(const char* msg) {
  Json::Value args;
  Json::Reader reader;
  if (!reader.parse(msg, msg + strlen(msg), args)) {
    LOGE("Ignoring message. Can't parse msessage. %s",
         reader.getFormattedErrorMessages().c_str());
    return;
  }
  std::string cmd = args.get("cmd", "").asString();
  if (cmd == "systeminfo.getValue") {
    std::string scope = args.get("scope", "").asString();
    std::string key = args.get("key", "").asString();
    Json::Value reply;
    if (scope == "platform") {
      system_info_type_e type;
      int ret = system_info_get_platform_type(key.c_str(), &type);
      if (ret == SYSTEM_INFO_ERROR_NONE) {
        switch (type) {
          case SYSTEM_INFO_BOOL:
            {
              bool value;
              ret = system_info_get_platform_bool(key.c_str(), &value);
              if (ret == SYSTEM_INFO_ERROR_NONE) {
                reply["type"] = "bool";
                reply["value"] = value;
              } else {
                LOGE("Failed to get platform info. %s", GetErrorMessage(ret));
              }
            }
            break;
          case SYSTEM_INFO_INT:
            {
              int value;
              ret = system_info_get_platform_int(key.c_str(), &value);
              if (ret == SYSTEM_INFO_ERROR_NONE) {
                reply["type"] = "int";
                reply["value"] = value;
              } else {
                LOGE("Failed to get platform info. %s", GetErrorMessage(ret));
              }
            }
            break;
          case SYSTEM_INFO_DOUBLE:
            {
              double value;
              ret = system_info_get_platform_double(key.c_str(), &value);
              if (ret == SYSTEM_INFO_ERROR_NONE) {
                reply["type"] = "double";
                reply["value"] = value;
              } else {
                LOGE("Failed to get platform info. %s", GetErrorMessage(ret));
              }
            }
            break;
          case SYSTEM_INFO_STRING:
            {
              char* value;
              ret = system_info_get_platform_string(key.c_str(), &value);
              if (ret == SYSTEM_INFO_ERROR_NONE) {
                reply["type"] = "string";
                reply["value"] = value;
                free(value);
              } else {
                LOGE("Failed to get platform info. %s", GetErrorMessage(ret));
              }
            }
            break;
          default:
            LOGE("Unknown value type : %s", key.c_str());
            break;
        }  // switch
      } else {
        LOGE("Failed to get value type of %s. : %s",
            key.c_str(), GetErrorMessage(ret));
      }  // if (ret == SYSTEM_INFO_ERROR_NONE)
    } else if (scope == "custom") {
      system_info_type_e type;
      int ret = system_info_get_custom_type(key.c_str(), &type);
      if (ret == SYSTEM_INFO_ERROR_NONE) {
        switch (type) {
          case SYSTEM_INFO_BOOL:
            {
              bool value;
              ret = system_info_get_custom_bool(key.c_str(), &value);
              if (ret == SYSTEM_INFO_ERROR_NONE) {
                reply["type"] = "bool";
                reply["value"] = value;
              } else {
                LOGE("Failed to get platform info. %s", GetErrorMessage(ret));
              }
            }
            break;
          case SYSTEM_INFO_INT:
            {
              int value;
              ret = system_info_get_custom_int(key.c_str(), &value);
              if (ret == SYSTEM_INFO_ERROR_NONE) {
                reply["type"] = "int";
                reply["value"] = value;
              } else {
                LOGE("Failed to get platform info. %s", GetErrorMessage(ret));
              }
            }
            break;
          case SYSTEM_INFO_DOUBLE:
            {
              double value;
              ret = system_info_get_custom_double(key.c_str(), &value);
              if (ret == SYSTEM_INFO_ERROR_NONE) {
                reply["type"] = "double";
                reply["value"] = value;
              } else {
                LOGE("Failed to get platform info. %s", GetErrorMessage(ret));
              }
            }
            break;
          case SYSTEM_INFO_STRING:
            {
              char* value;
              ret = system_info_get_custom_string(key.c_str(), &value);
              if (ret == SYSTEM_INFO_ERROR_NONE) {
                reply["type"] = "string";
                reply["value"] = value;
                free(value);
              } else {
                LOGE("Failed to get platform info. %s", GetErrorMessage(ret));
              }
            }
            break;
          default:
            LOGE("Unknown value type : %s", key.c_str());
            break;
        }  // switch
      } else {
        LOGE("Failed to get value type of %s. : %s",
            key.c_str(), GetErrorMessage(ret));
      }  // if (ret == SYSTEM_INFO_ERROR_NONE)
    }
    Json::FastWriter writer;
    SendSyncReply(writer.write(reply).c_str());
  }
}

}  // namespace system_info

EXPORT_XWALK_EXTENSION(tizen-system-info, system_info::SystemInfoExtension);
