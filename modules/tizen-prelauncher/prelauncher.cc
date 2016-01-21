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

#include "prelauncher.h"

#include <launchpad.h>

#include <memory>

namespace runtime {

namespace {
}  // namespace


PreLauncher::PreLauncher() {
}

PreLauncher::~PreLauncher() {
}

void PreLauncher::StartMainLoop() {
  alive_ = true;
  while (alive_) {
    if (poll(fdlist_.data(), fdlist_.size(), -1) < 0) {
        continue;
    }

    auto it = fdlist_.begin();
    while (it != fdlist_.end()) {
      if ((it->revents & POLLIN) != 0) {
        handlers_[it->fd](it->fd);
      }
      it->revents = 0;
      if (it->events == 0) {
        it = fdlist_.erase(it);
      } else {
        ++it;
      }
    }
  }
}

void PreLauncher::StopMainLoop() {
  alive_ = false;
}

void PreLauncher::Watch(int fd, std::function<void(int)> readable) {
  // add fd into poll struct
  pollfd fdinfo;
  fdinfo.fd = fd;
  fdinfo.events = POLLIN;
  fdinfo.revents = 0;
  fdlist_.push_back(fdinfo);
  // add handler
  handlers_[fd] = readable;
}

void PreLauncher::Unwatch(int fd) {
  for (auto it = fdlist_.begin(); it != fdlist_.end(); ++it) {
    if (it->fd == fd) {
      it->events = 0;
      break;
    }
  }
  handlers_.erase(fd);
}

int PreLauncher::Prelaunch(int argc, char* argv[],
    Preload preload, DidStart didstart, RealMain realmain) {
  std::unique_ptr<PreLauncher> launcher(new PreLauncher());
  launcher->preload_ = preload;
  launcher->didstart_ = didstart;
  launcher->realmain_ = realmain;

  auto create = [](int argc, char **argv, int type, void *user_data) {
    PreLauncher* launcher = static_cast<PreLauncher*>(user_data);
    launcher->preload_();
  };

  auto launch = [](int argc, char **argv, const char *app_path,
                   const char *appid, const char *pkgid,
                   const char *pkg_type, void *user_data) {
    PreLauncher* launcher = static_cast<PreLauncher*>(user_data);
    launcher->didstart_(app_path);
    return 0;
  };

  auto terminate = [](int argc, char **argv, void *user_data) {
    PreLauncher* launcher = static_cast<PreLauncher*>(user_data);
    return launcher->realmain_(argc, argv);
  };

  auto start_loop = [](void *user_data) {
    PreLauncher* launcher = static_cast<PreLauncher*>(user_data);
    launcher->StartMainLoop();
  };
  auto stop_loop = [](void *user_data) {
    PreLauncher* launcher = static_cast<PreLauncher*>(user_data);
    launcher->StopMainLoop();
  };
  auto add_fd = [](void *user_data, int fd, loader_receiver_cb receiver) {
    PreLauncher* launcher = static_cast<PreLauncher*>(user_data);
    launcher->Watch(fd, receiver);
  };
  auto remove_fd = [](void *user_data, int fd) {
    PreLauncher* launcher = static_cast<PreLauncher*>(user_data);
    launcher->Unwatch(fd);
  };

  loader_lifecycle_callback_s callbacks = {
    create,
    launch,
    terminate
  };

  loader_adapter_s loop_methods = {
    start_loop,
    stop_loop,
    add_fd,
    remove_fd
  };

  return launchpad_loader_main(argc, argv,
                               &callbacks,
                               &loop_methods,
                               launcher.get());
}

}  // namespace runtime
