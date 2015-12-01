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

#include "dbus_operation.h"

#include <dbus/dbus.h>
#include <dbus/dbus-glib-lowlevel.h>
#include <dlog.h>

#include <string>
#include <sstream>
#include <vector>
#include <set>

#ifdef LOG_TAG
  #undef LOG_TAG
#endif
#define LOG_TAG "POWER"

#define DBUS_REPLY_TIMEOUT (-1)

namespace tizen {
namespace power {

DBusOperationArguments::DBusOperationArguments() {
}

DBusOperationArguments::~DBusOperationArguments() {
  for (auto iter = arguments_.begin(); iter != arguments_.end(); ++iter) {
    ArgType type = iter->first;
    void* p_val = iter->second;

    switch (type) {
    case ArgType::kTypeBool:
    case ArgType::kTypeInt32:
      delete static_cast<int32_t *>(p_val);
      break;

    case ArgType::kTypeUInt32:
      delete static_cast<uint32_t *>(p_val);
      break;

    case ArgType::kTypeUInt64:
      delete static_cast<uint64_t *>(p_val);
      break;

    case ArgType::kTypeString:
      delete[] static_cast<char *>(p_val);
      break;

    default:
      break;
    }
  }

  arguments_.clear();
}

void DBusOperationArguments::AddArgumentBool(bool val) {
  int32_t* p_val = new int32_t;
  *p_val = val;

  arguments_.push_back(ArgumentElement(ArgType::kTypeBool, p_val));
}

void DBusOperationArguments::AddArgumentInt32(int val) {
  int32_t* p_val = new int32_t;
  *p_val = val;

  arguments_.push_back(ArgumentElement(ArgType::kTypeInt32, p_val));
}

void DBusOperationArguments::AddArgumentUInt32(unsigned int val) {
  uint32_t* p_val = new uint32_t;
  *p_val = val;

  arguments_.push_back(ArgumentElement(ArgType::kTypeUInt32, p_val));
}

void DBusOperationArguments::AddArgumentUInt64(uint64_t val) {
  uint64_t* p_val = new uint64_t;
  *p_val = val;

  arguments_.push_back(ArgumentElement(ArgType::kTypeUInt64, p_val));
}

void DBusOperationArguments::AddArgumentString(const std::string& val) {
  const int length = val.length();

  char* p_val = new char[length+1];
  // copy 'length' characters and add a NULL-character at 'length+1' position
  strncpy(p_val, val.c_str(), length+1);

  arguments_.push_back(ArgumentElement(ArgType::kTypeString, p_val));
}

int DBusOperationArguments::AppendVariant(
    DBusMessageIter* bus_msg_iter) {
  for (auto iter = arguments_.begin(); iter != arguments_.end(); ++iter) {
    ArgType type = iter->first;
    void *p_val = iter->second;

    switch (type) {
    case ArgType::kTypeBool:
      dbus_message_iter_append_basic(bus_msg_iter, DBUS_TYPE_BOOLEAN, p_val);
      break;

    case ArgType::kTypeInt32:
      dbus_message_iter_append_basic(bus_msg_iter, DBUS_TYPE_INT32, p_val);
      break;

    case ArgType::kTypeUInt32:
      dbus_message_iter_append_basic(bus_msg_iter, DBUS_TYPE_UINT32, p_val);
      break;

    case ArgType::kTypeUInt64:
      dbus_message_iter_append_basic(bus_msg_iter, DBUS_TYPE_UINT64, p_val);
      break;

    case ArgType::kTypeString:
      dbus_message_iter_append_basic(bus_msg_iter, DBUS_TYPE_STRING, &p_val);
      break;

    default:
      return 1;
    }
  }
  return 0;
}

DBusOperationListener::DBusOperationListener() {
}

DBusOperationListener::~DBusOperationListener() {
}

std::set<DBusOperation*> DBusOperation::s_objects_;

DBusOperation::DBusOperation(const std::string& destination,
                             const std::string& path,
                             const std::string& interface) :
                             destination_(destination),
                             path_(path),
                             interface_(interface),
                             connection_(nullptr) {
  s_objects_.insert(this);
}

DBusOperation::~DBusOperation() {
  if (connection_) {
    dbus_connection_close(connection_);
    dbus_connection_unref(connection_);
  }

  const auto iter = s_objects_.find(this);

  if (s_objects_.end() != iter){
    s_objects_.erase(iter);
  } else {
    LOGE("Object is not existing in the static pool");
  }
}

int DBusOperation::InvokeSyncGetInt(const std::string& method,
                                    DBusOperationArguments* args, int* result) {
  if (!connection_) {
    connection_ = dbus_bus_get_private(DBUS_BUS_SYSTEM, nullptr);
  }

  if (!connection_) {
    LOGE("dbus_bus_get_private error");
    return 1;
  }

  DBusMessage* msg = dbus_message_new_method_call(destination_.c_str(),
                                                  path_.c_str(),
                                                  interface_.c_str(),
                                                  method.c_str());
  if (!msg) {
    LOGE("dbus_message_new_method_call error");
    return 1;
  }

  DBusMessageIter iter;
  dbus_message_iter_init_append(msg, &iter);

  if (nullptr != args) {
    int err = args->AppendVariant(&iter);
    if (err) {
      LOGE("append_variant error");
      dbus_message_unref(msg);
      return 1;
    }
  }

  DBusError err;
  dbus_error_init(&err);
  DBusMessage* reply = dbus_connection_send_with_reply_and_block(
      connection_, msg, DBUS_REPLY_TIMEOUT, &err);
  dbus_message_unref(msg);

  if (!reply) {
    LOGE("dbus_connection_send_with_reply_and_block error %s: %s",
         err.name, err.message);
    dbus_error_free(&err);
    return 1;
  }

  *result = 0;
  dbus_bool_t ret = dbus_message_get_args(reply,
                                          &err,
                                          DBUS_TYPE_INT32,
                                          result,
                                          DBUS_TYPE_INVALID);
  dbus_message_unref(reply);

  if (!ret) {
    LOGE("dbus_message_get_args error %s: %s", err.name, err.message);
    dbus_error_free(&err);
    return 1;
  }

  return 0;
}

int DBusOperation::RegisterSignalListener(
    const std::string& signal_name, DBusOperationListener* listener) {
  int error = AddDBusSignalFilter();
  if (error) {
    return error;
  }

  listeners_.insert(std::make_pair(signal_name, listener));
  return 0;
}

int DBusOperation::UnregisterSignalListener(
    const std::string& signal_name, DBusOperationListener* listener) {
  bool signal_found = false;

  for (auto iter = listeners_.begin(); iter != listeners_.end(); ++iter) {
    if (iter->first == signal_name && iter->second == listener) {
      listeners_.erase(iter);
      signal_found = true;
      break;
    }
  }

  if (false == signal_found) {
    LOGE("Failed to find signal handler");
    return 1;
  }

  if (listeners_.empty()) {
    return RemoveDBusSignalFilter();
  }
  return 0;
}

int DBusOperation::AddDBusSignalFilter() {
  if (!connection_) {
    connection_ = dbus_bus_get_private(DBUS_BUS_SYSTEM, nullptr);
  }

  if (!connection_) {
    LOGE("dbus_bus_get_private error");
    return 1;
  }

  dbus_connection_setup_with_g_main(connection_, nullptr);

  std::stringstream rule;
  rule << "type='signal',sender='" << destination_
       << "',path='" << path_
       << "',interface='" << interface_ << "'";

  rule_ = rule.str();

  DBusError err;
  dbus_error_init(&err);

  dbus_bus_add_match(connection_, rule_.c_str(), &err);

  if (dbus_error_is_set(&err)) {
    LOGE("dbus_bus_add_match error %s: %s", err.name, err.message);
    dbus_error_free(&err);
    return 1;
  }

  if (dbus_connection_add_filter(connection_,
                                 DBusSignalFilterHandler,
                                this, nullptr) == FALSE) {
    LOGE("dbus_connection_add_filter error %s: %s", err.name, err.message);
    return 1;
  }
  return 0;
}

int DBusOperation::RemoveDBusSignalFilter() {
  DBusError err;
  dbus_error_init(&err);
  dbus_bus_remove_match(connection_, rule_.c_str(), &err);

  if (dbus_error_is_set(&err)) {
    LOGE("dbus_bus_remove_match error %s: %s", err.name, err.message);
    dbus_error_free(&err);
    return 1;
  }

  dbus_connection_remove_filter(connection_, DBusSignalFilterHandler, this);
  return 0;
}

DBusHandlerResult DBusOperation::DBusSignalFilter(DBusConnection* /* conn */,
                                                  DBusMessage* message) {
  DBusError err;
  dbus_error_init(&err);

  int val = 0;
  if (dbus_message_get_args(message,
                            &err,
                            DBUS_TYPE_INT32,
                            &val,
                            DBUS_TYPE_INVALID) == FALSE) {
    LOGE("dbus_message_get_args error %s: %s", err.name, err.message);
    return DBUS_HANDLER_RESULT_NOT_YET_HANDLED;
  }

  for (auto iter = listeners_.begin(); iter != listeners_.end(); ++iter) {
    if (dbus_message_is_signal(message,
                               interface_.c_str(),
                               iter->first.c_str())) {
      iter->second->OnDBusSignal(val);
    }
  }

  return DBUS_HANDLER_RESULT_HANDLED;
}

DBusHandlerResult DBusOperation::DBusSignalFilterHandler(DBusConnection* conn,
                                                         DBusMessage* message,
                                                         void* user_data) {
  DBusOperation* that = static_cast<DBusOperation *>(user_data);

  if (s_objects_.end() == s_objects_.find(that)) {
    LOGE("Object does not exist in the static pool");
    return DBUS_HANDLER_RESULT_NOT_YET_HANDLED;
  }

  return that->DBusSignalFilter(conn, message);
}

}  // namespace power
}  // namespace tizen
