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

#include <functional>

namespace plugins {

class AppFW {
 public:
  static AppFW* GetInstance();
  bool Init(int argc, char* argv[]);
  void Deinit();
  void set_create_handler(std::function<void(void)> handler);
  void set_service_handler(std::function<void(void*)> handler);
  void set_terminate_handler(std::function<void(void)> handler);
  void set_pause_handler(std::function<void(void)> handler);
  void set_resume_handler(std::function<void(void)> handler);

  // TODO(sngn.lee) : Add system event callback. eg) low battery, low memory...

 private:
  AppFW();
  ~AppFW();
  bool initialized_;
  std::function<void(void)> create_handler_;
  std::function<void(void*)> service_handler_;
  std::function<void(void)> terminate_handler_;
  std::function<void(void)> pause_handler_;
  std::function<void(void)> resume_handler_;
};

}  // namespace plugins
