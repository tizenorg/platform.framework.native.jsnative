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

#include <poll.h>

#include <string>
#include <functional>
#include <map>
#include <vector>

namespace runtime {

class PreLauncher {
 public:
  using Preload = std::function<void(void)>;
  using DidStart = std::function<void(const std::string& app_path)>;
  using RealMain = std::function<int(int, char**)>;
  static int Prelaunch(int argc, char* argv[], Preload, DidStart, RealMain);

  PreLauncher();
  ~PreLauncher();

 private:
  void StartMainLoop();
  void StopMainLoop();

  void Watch(int fd, std::function<void(int)> readable);
  void Unwatch(int fd);

  Preload preload_;
  DidStart didstart_;
  RealMain realmain_;

  volatile bool alive_;

  std::map<int, std::function<void(int)> > handlers_;
  std::vector<pollfd> fdlist_;
};

}  // namespace runtime
