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

#ifndef PRIVILEGES_LOG_H_
#define PRIVILEGES_LOG_H_

#include <stdio.h>

#define LOGD(fmt, args...) printf(fmt "\n", ##args)
#define LOGI(fmt, args...) printf(fmt "\n", ##args)
#define LOGW(fmt, args...) printf(fmt "\n", ##args)
#define LOGE(fmt, args...) printf(fmt "\n", ##args)

#endif  // PRIVILEGES_LOG_H_
