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

#ifndef EXAMPLES_TIZEN_POWER_DBUS_OPERATION_H_
#define EXAMPLES_TIZEN_POWER_DBUS_OPERATION_H_

#include <string>
#include <vector>
#include <set>

#include <dbus/dbus.h>

namespace tizen {
namespace power {

class DBusOperation;

class DBusOperationArguments {
 public:
  DBusOperationArguments();
  ~DBusOperationArguments();

  void AddArgumentBool(bool val);
  void AddArgumentInt32(int val);
  void AddArgumentUInt32(unsigned int val);
  void AddArgumentUInt64(uint64_t val);
  void AddArgumentString(const std::string& val);

 private:
  enum class ArgType {
    kTypeBool,
    kTypeInt32,
    kTypeUInt32,
    kTypeUInt64,
    kTypeString
  };

  typedef std::pair<ArgType, void*> ArgumentElement;
  typedef std::vector<ArgumentElement> Arguments;

  Arguments arguments_;

  friend class DBusOperation;

  int AppendVariant(DBusMessageIter* bus_msg_iter);
};

class DBusOperationListener {
 public:
  DBusOperationListener();
  virtual ~DBusOperationListener();

  virtual void OnDBusSignal(int value) = 0;
};

class DBusOperation {
 public:
  DBusOperation(const std::string& destination,
          const std::string& path,
          const std::string& interface);
  virtual ~DBusOperation();

  int InvokeSyncGetInt(const std::string& method,
             DBusOperationArguments* args, int* result);

  int RegisterSignalListener(const std::string& signal_name,
                DBusOperationListener* listener);
  int UnregisterSignalListener(const std::string& signal_name,
                  DBusOperationListener* listener);

 private:
  std::string destination_;
  std::string path_;
  std::string interface_;

  typedef std::pair<std::string, DBusOperationListener*> SignalListenerPair;
  typedef std::set<SignalListenerPair> SignalListenerSet;
  SignalListenerSet listeners_;

  DBusConnection* connection_;
  std::string rule_;

  int AddDBusSignalFilter();
  int RemoveDBusSignalFilter();

  DBusHandlerResult DBusSignalFilter(DBusConnection* conn,
                     DBusMessage* message);

  static DBusHandlerResult DBusSignalFilterHandler(DBusConnection* conn,
                           DBusMessage* message,
                           void* user_data);

  static std::set<DBusOperation*> s_objects_;
};

}  // namespace power
}  // namespace tizen

#endif  // EXAMPLES_TIZEN_POWER_DBUS_OPERATION_H_
